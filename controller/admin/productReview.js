const _ = require("lodash");

const Controller = require("../base");
const { ProductReviews } = require('../../models/s_product_review');
const DownloadsController = require('../common/downloads');

const productReviewStages = [
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: { "path": "$user", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "order" } },
    { $unwind: { "path": "$order", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller", "preserveNullAndEmptyArrays": true } },
];
const productReviewStagesOfEcommerce = [
    ...productReviewStages,
    { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
    { $unwind: { "path": "$product", "preserveNullAndEmptyArrays": true } },
];
const productReviewStagesOfFood = [
    ...productReviewStages,
    { $lookup: { from: "foodproducts", localField: "foodProductId", foreignField: "_id", as: "foodProduct" } },
    { $unwind: { "path": "$foodProduct", "preserveNullAndEmptyArrays": true } },
];

const ecommerceProductProjection = [
    {
        $project: {
            createdAt: 1,
            "order._id": 1, "order.orderId": 1,
            "product._id": 1, "product.name": 1,
            "user._id": 1, "user.registerId": 1, "user.fullName": 1,
            title: 1, description: 1, rating: 1, files: 1, type: 1,
            "seller._id": 1, "seller.registerId": 1, "seller.fullName": 1
        }
    }
]

const foodProductProjection = [
    {
        $project: {
            createdAt: 1,
            "order._id": 1, "order.orderId": 1,
            "product._id": "$foodProduct._id", "product.name": "$foodProduct.name",
            "user._id": 1, "user.registerId": 1, "user.fullName": 1,
            title: 1, description: 1, rating: 1, files: 1, type: 1,
            "seller._id": 1, "seller.registerId": 1, "seller.fullName": 1
        }
    }
]
class ReviewsController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
    Purpose: Update Review Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "title":"good",
        "description":"nice product",
        "reviewId":"5cd00e988566d30c6b8553cc"
    }
    Return: JSON String
    ********************************************************/
    async updateReview() {
        try {
            let data = this.req.body;
            delete data.rating;
            const reviewDetails = await ProductReviews.findOne({ _id: this.req.body.reviewId });
            if (_.isEmpty(reviewDetails)) { return this.res.send({ status: 0, message: "Details not found" }); }
            const updatedReview = await ProductReviews.findByIdAndUpdate(this.req.body.reviewId, data);
            if (_.isEmpty(updatedReview)) { return this.res.send({ status: 0, message: "Details not updated" }); }
            return this.res.send({ status: 1, message: "Details are updated successfully" });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Single And Multiple Review Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "reviewIds":["5cd01da1371dc7190b085f86"]
    }
    Return: JSON String
    ********************************************************/
    async deleteReviews() {
        try {
            if (!this.req.body.reviewIds) {
                return this.res.send({ status: 0, message: "Please send reviewIds" });
            }
            let msg = 'Product review not deleted.';
            let status = 1;
            const updatedReview = await ProductReviews.updateMany({ _id: { $in: this.req.body.reviewIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedReview) {
                msg = updatedReview.modifiedCount ? updatedReview.modifiedCount + ' review deleted.' : updatedReview.matchedCount == 0 ? "Details not found" : msg;
                status = updatedReview.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Single Review Details In Admin
    Method: Get
    Return: JSON String
    ********************************************************/
    async getReviewDetails() {
        try {
            const review = await ProductReviews.findOne({ _id: this.req.params.reviewId })
                .populate('userId', { registerId: 1, fullName: 1 })
                .populate('sellerId', { registerId: 1, fullName: 1 })
                .populate('productId', { name: 1 })
                .populate('foodProductId', { name: 1 })
                .populate('orderId', { orderId: 1 });
            if (_.isEmpty(review)) { return this.res.send({ status: 0, message: "Details not found" }); }
            return this.res.send({ status: 1, message: "Details are: ", data: review });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Change Status Of Review Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "reviewIds":["5cd01da1371dc7190b085f86"],
        "status":false
    }
    Return: JSON String
    ********************************************************/
    async changeReviewStatus() {
        try {
            let msg = "Review status not updated";
            const updatedReview = await ProductReviews.updateMany({ _id: { $in: this.req.body.reviewIds } }, { $set: { status: this.req.body.status } });
            if (updatedReview) {
                msg = updatedReview.modifiedCount ? updatedReview.modifiedCount + " review updated" : updatedReview.matchedCount == 0 ? "Review not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: ReviewListing Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2022-10-25",
        "searchText": "",
        "type": "isEcommerce" or "isFood"
    }
    Return: JSON String
    ********************************************************/
    async reviewListing() {
        try {
            const data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type" });
            }
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            const stages = data.type == 'isEcommerce' ? productReviewStagesOfEcommerce : productReviewStagesOfFood;
            const projection = data.type == "isEcommerce" ? ecommerceProductProjection : foodProductProjection;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { title: regex }, { description: regex }, { type: regex },
                        { "user.registerId": regex }, { "user.fullName": regex },
                        { "seller.registerId": regex }, { "seller.fullName": regex },
                        { "product.name": regex }, { "order.orderId": regex },
                    ]
                })
            }
            const result = await ProductReviews.aggregate([
                { $match: { isDeleted: false, type: data.type } },
                ...stages,
                { $match: { $and: query } },
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await ProductReviews.aggregate([
                { $match: { isDeleted: false, type: data.type } },
                ...stages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error in controller", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /********************************************************
    Purpose:Download CSV Of Reviews Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
     {
          "type":"csv" or "excel",
          "startDate":"2022-09-20",
          "endDate":"2022-09-25",
          "searchText": "",
          "reviewType": "isEcommerce", // or "isFood"
          "filteredFields": ["Date", "Type", "Order ID", "Product Name", "User ID", "User Name", "Title", "Description", "Rating", "Images", "Seller ID", "Seller Name"]     }
    Return: JSON String
    ********************************************************/
    async downloadReviewsFile() {
        try {
            let data = this.req.body;
            if (!data.type || !data.reviewType) {
                return this.res.send({ status: 0, message: "Please send type and reviewType of the file to download" });
            }
            const stages = data.reviewType == 'isEcommerce' ? productReviewStagesOfEcommerce : productReviewStagesOfFood;
            const projection = data.reviewType == "isEcommerce" ? ecommerceProductProjection : foodProductProjection;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Type", "Order ID", "Product Name", "User ID", "User Name", "Title", "Description", "Rating", "Images", "Seller ID", "Seller Name"];
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { title: regex }, { description: regex },
                        { "user.registerId": regex }, { "user.fullName": regex },
                        { "seller.registerId": regex }, { "seller.fullName": regex },
                        { "product.name": regex }, { "order.orderId": regex },
                    ]
                })
            }
            data['model'] = ProductReviews;
            data['stages'] = stages;
            data['projectData'] = [
                ...projection,
                { $match: { $and: query } },
                {
                    $project: {
                        Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        "Order ID": "$order.orderId",
                        "Product Name": "$product.name",
                        "User ID": "$user.registerId",
                        "User Name": "$user.fullName",
                        "Title": "$title", "Description": "$description", "Rating": "$rating",
                        "Images": "$files",
                        "Seller ID": "$seller.registerId", "Seller Name": "$seller.fullName",
                        "Type": "$type"
                    }
                }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, type: data.reviewType };
            data['filterQuery'] = {}
            data['fileName'] = 'product-reviews'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns For review types In Admin
    Method: Post
    Authorisation: true
    {
        "searchText":"as",
        "type":""
    }
    Return: JSON String
    ********************************************************/
    async reviewsList() {
        try {
            const skip = 0;
            const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }];
            if (data.type) {
                query.push({ type: data.type });
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: "i", };
                query.push({ $or: [{ title: regex }, { description: regex }] });
            }
            const result = await ProductReviews.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { title: 1, description: 1, rating: 1 } },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = ReviewsController;
