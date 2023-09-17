const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { Users } = require('../../models/s_users');
const { Products } = require('../../models/s_products');
const { FoodProducts } = require('../../models/s_food_products');
const { Orders } = require('../../models/s_orders');
const { ProductReviews } = require('../../models/s_product_review');
const RequestBody = require("../../utilities/requestBody");
const Model = require("../../utilities/model");


const stages = [
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: { "path": "$user", "preserveNullAndEmptyArrays": true } },
];

const projection = [
    {
        $project: {
            createdAt: 1,
            "user._id": 1, "user.registerId": 1, "user.fullName": 1,
            title: 1, description: 1, rating: 1, files: 1, type: 1
        }
    }
]


class ReviewsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add Review Details In Front
    Method: Post
    Authorisation: true
    Parameter:
    {
        "rating":5,
        "title":"good one",
        "description":"very nice",
        "productId" : "", 
        "files":[
            {
                "type":"image",
                "path":"image.jpg"
            }
        ],
        "orderId":"",
        "type": "isEcommerce" or "isFood"
    }
    Return: JSON String
    ********************************************************/
    async addReview() {
        try {
            let data = this.req.body;
            const fieldsArray = ["rating", "title", "description", "type", "productId", "orderId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            // checking user
            const currentUserId = this.req.user;
            data.userId = currentUserId;
            const user = await Users.findOne({ _id: currentUserId }, { fullName: 1 });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "User details not found" }); }
            // checking order
            if (data.type == "isEcommerce") {
                const product = await Products.findOne({ _id: data.productId, isDeleted: false }, { sellerId: 1 });
                if (_.isEmpty(product)) { return this.res.send({ status: 0, message: "Product details not found" }); }
                data.sellerId = product.sellerId;
                const order = await Orders.findOne({ _id: data.orderId, "products.productId": data.productId }, { _id: 1 });
                if (_.isEmpty(order)) { return this.res.send({ status: 0, message: "Order details not found" }); }
            }
            if (data.type == "isFood") {
                data.foodProductId = data.productId;
                delete data.productId;
                const foodProduct = await FoodProducts.findOne({ _id: data.foodProductId, isDeleted: false }, { sellerId: 1 });
                if (_.isEmpty(foodProduct)) { return this.res.send({ status: 0, message: "Food product details not found" }); }
                data.sellerId = foodProduct.sellerId;
                const order = await Orders.findOne({ _id: data.orderId, "products.productId": data.foodProductId }, { _id: 1 });
                if (_.isEmpty(order)) { return this.res.send({ status: 0, message: "Order details not found" }); }

            }
            const newReview = await new Model(ProductReviews).store(data);
            if (_.isEmpty(newReview)) { return this.res.send({ status: 0, message: "Details not added" }); }

            if (data.type == "isEcommerce") {
                const ratings = await ProductReviews.find({ productId: data.productId }, { "rating": 1, "_id": 1 });
                // changing rating in product based on review rating given by the users
                let totalVal = 0;
                ratings.filter(e => { totalVal = totalVal + e.rating })
                const avgRating = totalVal / ratings.length;
                await Products.update({ _id: data.productId }, { "rating": avgRating });
            }
            if (data.type == "isFood") {
                const ratings = await ProductReviews.find({ foodProductId: data.foodProductId }, { "rating": 1, "_id": 1 });
                // changing rating in food product based on review rating given by the users
                let totalVal = 0;
                ratings.filter(e => { totalVal = totalVal + e.rating })
                const avgRating = totalVal / ratings.length;
                await FoodProducts.update({ _id: data.foodProductId }, { "rating": avgRating });
            }
            return this.res.send({ status: 1, message: "Details added successfully", data: newReview });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: ReviewListing of a product
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "productId":"",
        "type":"isEcommerce" or "isFood"
    }
    Return: JSON String
    ********************************************************/
    async reviewListing() {
        try {
            const data = this.req.body;
            if (!data.type || !data.productId) {
                return this.res.send({ status: 0, message: "Please send type and productId" });
            }
            const skip = data.page && data.pagesize ? (parseInt(data.page) - 1) * parseInt(data.pagesize) : 1;
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize ? data.pagesize : 20;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            const result = await ProductReviews.aggregate([
                { $match: { isDeleted: false, type: data.type, productId: ObjectID(data.productId), $and: query } },
                ...stages,
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await ProductReviews.aggregate([
                { $match: { isDeleted: false, type: data.type, productId: ObjectID(data.productId), $and: query } },
                ...stages,
                { $project: { _id: 1 } }
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error in controller", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }
}
module.exports = ReviewsController
