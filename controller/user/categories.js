const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Categories } = require('../../models/s_category');
const { Products } = require('../../models/s_products');

const gstStages = [
    { $lookup: { from: "gstcodes", localField: "gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "adminsettings", localField: "adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
];
const ecomProductsStages = [
    ...gstStages,
    { $unwind: { "path": "$attributes", "preserveNullAndEmptyArrays": true } },
    { $unwind: { "path": "$attributes.values", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            unitPrice: {
                $cond: {
                    if: { $gte: ["$productType", "Variant"] },
                    then: "$attributes.values.price", else: "$unitPrice"
                }
            },
            sellerId: 1, otherTaxes: 1, gst: "$gstCode.gst", name: 1, productImage: 1, customUrl: 1, productType: 1, attributes: 1,
            stock: {
                $cond: {
                    if: { $eq: ["$productType", "Variant"] },
                    then: "$attributes.values.stock", else: "$stock"
                }
            },
            adminsettings: 1, size: "$attributes.values.size", color: "$attributes.color", brandId: 1, discount: 1
        }
    },
    {
        $project: {
            price: {
                $sum: ["$unitPrice", "$otherTaxes"]
            },
            adminsettings: 1, sellerId: 1, discount: 1, gst: 1,
            name: 1, description: 1, productImage: 1, attributes: 1,
            customUrl: 1, stock: {
                $cond: { if: { $gte: ["$stock", 0] }, then: true, else: false }
            }, productType: 1, size: 1, color: 1, sellerId: 1, brandId: 1
        }
    },
    {
        $project: {
            discountPrice: {
                $multiply: [{
                    $divide: ["$discount", 100]
                }, "$price"]
            }, discount: 1, price: 1,
            adminsettings: 1, sellerId: 1, gst: 1,
            name: 1, description: 1, productImage: 1, attributes: 1,
            customUrl: 1, stock: {
                $cond: {
                    if: { $gte: ["$stock", 0] }, then: true, else: false
                }
            }, productType: 1, size: 1, color: 1, sellerId: 1, brandId: 1
        }
    },
    {
        $project: {
            finalPrice: { $subtract: ["$price", "$discountPrice"] }, price: 1,
            discountPrice: 1, discount: 1, adminsettings: 1, gst: 1,
            name: 1, description: 1, productImage: 1, attributes: 1,
            customUrl: 1, stock: 1, productType: 1, size: 1, color: 1,
            sellerId: 1, brandId: 1
        }
    },
    {
        $project: {
            finalPrice: {
                $sum: ["$finalPrice", {
                    $multiply: [{
                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                    }, "$finalPrice"]
                }, {
                        $multiply: [{
                            $divide: ["$gst", 100]
                        }, "$finalPrice"]
                    }]
            },
            totalPrice: {
                $sum: ["$price", {
                    $multiply: [{
                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                    }, "$price"]
                }, {
                        $multiply: [{
                            $divide: ["$gst", 100]
                        }, "$price"]
                    }]
            },
            discountPrice: 1, discount: 1, price: 1,
            name: 1, description: 1, productImage: 1, attributes: 1,
            customUrl: 1, stock: 1, productType: 1, sellerId: 1, size: 1, color: 1, brandId: 1,
        }
    },
]

class CategoriesController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
   Purpose: Get Categories In Front
   Method: Get
   Return: JSON String
   ********************************************************/
    async getCategories() {
        try {
            const category = await Categories.find({ type: "category", isDeleted: false, publish: true, isEcommerce: true });
            if (_.isEmpty(category)) { return this.res.send({ status: 0, message: "Category details not found" }); }
            let array = [];
            let productsArray = [];
            if (category.length > 0) {
                for (let i = 0; i < category.length; i++) {
                    let totalCount = 0; let subCategoryAvailable = false; let productsAvailable = false; let productsCount = 0
                    // getting product details
                    let catProducts = await Products.find({ "categoryIds": ObjectID(category[i]._id), isDeleted: false, status: 'Published', isEcommerce: true, description: { $exists: true } }, { _id: 1 });
                    if (!_.isEmpty(catProducts)) {
                        totalCount = totalCount + catProducts.length;
                        for (let s = 0; s < catProducts.length; s++) {
                            productsArray.push(ObjectID(catProducts[s]._id))
                        }
                    }
                    console.log(`productsArray: ${JSON.stringify(productsArray)}`)
                    // getting subCategory details
                    let details = category[i];
                    let subCategory = await Categories.find({ "parentCategory": ObjectID(details._id), type: "subCategory1", isDeleted: false, publish: true, isEcommerce: true }, { "_id": 1, "categoryName": 1 });

                    if (!_.isEmpty(subCategory)) {
                        subCategoryAvailable = true
                        for (let j = 0; j < subCategory.length; j++) {
                            // getting count of products that are available
                            let sub1Products = await Products.find({
                                $and: [{ "categoryIds": ObjectID(subCategory[j]._id) }, { isDeleted: false },
                                { status: 'Published' }, { isEcommerce: true }, { description: { $exists: true } }, { _id: { $nin: productsArray } }]
                            }, { _id: 1 }).populate('sellerId', { fullName: 1 }).populate('brandId', { name: 1 })
                            if (!_.isEmpty(sub1Products)) {
                                totalCount = totalCount + sub1Products.length;
                                for (let x = 0; x < sub1Products.length; x++) {
                                    productsArray.push(ObjectID(sub1Products[x]._id))
                                }
                            }

                            let subCategory1 = await Categories.find({ "parentCategory": ObjectID(subCategory[j]._id), type: "subCategory2", isDeleted: false, publish: true, isEcommerce: true })
                            if (!_.isEmpty(subCategory1)) {
                                for (let k = 0; k < subCategory1.length; k++) {
                                    let sub2Products = await Products.find({ $and: [{ "categoryIds": ObjectID(subCategory[j]._id) }, { isDeleted: false }, { status: 'Published' }, { isEcommerce: true }, { description: { $exists: true } }, { _id: { $nin: productsArray } }] }, { _id: 1 }).populate('sellerId', { fullName: 1 }).populate('brandId', { name: 1 })
                                    if (!_.isEmpty(sub2Products)) {
                                        totalCount = totalCount + sub2Products.length;
                                        for (let y = 0; y < sub2Products.length; y++) {
                                            productsArray.push(ObjectID(sub2Products[y]._id))
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        let value = await Products.find({ "categoryIds": ObjectID(details._id), isDeleted: false, status: 'Published', isEcommerce: true, description: { $exists: true } });
                        productsCount = value.length
                        productsAvailable = (value.length > 0) ? true : false
                        totalCount = 0
                    }
                    await array.push({ _id: details._id, categoryName: details.categoryName, customUrl: details.customUrl, icon: details.icon, image: details.image, subCategoryAvailable, subCategoryProductsCount: totalCount, productsAvailable, productsCount })
                }
            }
            return this.res.send({ status: 1, message: "Category details are: ", data: array });
        } catch (error) {
            console.log(error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Getting subCategories
    Method: POST
    Parameter:
    {
        "categoryId":"5ccc4d645a16ae2b47ced987",
        "finalPrice":{
                "minFinalPrice":10,
                "maxFinalPrice":500
        },
        "page":1,
        "pagesize":10,
        "brandName":["5cdd2864d940e50ce913ab2b",]
    }
    Return: JSON String
    ********************************************************/
    async getSubCategories() {
        try {
            let obj = {};
            let catArray = [];
            let category1, category2; let id = []
            // start code for breadCrums data
            let category = await Categories.findOne({ "_id": this.req.body.categoryId, isDeleted: false, publish: true, isEcommerce: true }, { _id: 1, categoryName: 1, parentCategory: 1, image: 1 });
            if (!_.isEmpty(category)) {
                catArray.push({ categoryName: category.categoryName, _id: category._id });
                category1 = await Categories.findOne({ "_id": category.parentCategory, isDeleted: false, publish: true, isEcommerce: true }, { _id: 1, categoryName: 1, parentCategory: 1 });
            }
            if (!_.isEmpty(category1)) {
                catArray.push({ categoryName: category1.categoryName, _id: category1._id });
                category2 = await Categories.findOne({ "_id": category1.parentCategory, isDeleted: false, publish: true, isEcommerce: true }, { _id: 1, categoryName: 1, parentCategory: 1 });
            }
            if (!_.isEmpty(category2)) {
                catArray.push({ categoryName: category2.categoryName, _id: category2._id });
            }
            obj.breadCrumbs = catArray.reverse()
            // end code for breadCrumbs data

            let subCategory = await Categories.find({ parentCategory: this.req.body.categoryId, isDeleted: false, publish: true, isEcommerce: true }, { _id: 1, categoryName: 1, customUrl: 1, image: 1 });
            console.log(`subCategory: ${JSON.stringify(subCategory)}`)

            if (subCategory.length > 0) {
                let subCatArr = []
                for (let i = 0; i < subCategory.length; i++) {
                    let subCategoryAvailable = false; let productsAvailable = false; let subCategoryProductsCount = 0; let productsCount = 0
                    let subCategory1 = await Categories.find({ parentCategory: subCategory[i]._id, isDeleted: false, publish: true, isEcommerce: true }, { _id: 1 });
                    if (subCategory1.length > 0) {
                        subCategoryAvailable = true;
                        let andArray = [{ isDeleted: false, status: 'Published', isEcommerce: true, description: { $exists: true }, categoryIds: subCategory[i]._id }];
                        // third level products with pagination
                        const products = await Products.find({ $and: andArray }, { _id: 1 }).populate('sellerId', { fullName: 1 }).populate('brandId', { name: 1 })
                        subCategoryProductsCount = products.length
                    }
                    else {
                        let andArray = [{ isDeleted: false, status: 'Published', isEcommerce: true, description: { $exists: true }, categoryIds: subCategory[i]._id }];
                        // third level products with pagination
                        const products = await Products.find({ $and: andArray }, { _id: 1 }).populate('sellerId', { fullName: 1 }).populate('brandId', { name: 1 })
                        productsCount = products.length
                        productsAvailable = (products.length > 0) ? true : false
                    }
                    await subCatArr.push({
                        categoryName: subCategory[i].categoryName, _id: subCategory[i]._id, image: subCategory[i].image, icon: subCategory[i].icon,
                        customUrl: subCategory[i].customUrl, subCategoryAvailable, subCategoryProductsCount,
                        productsAvailable, productsCount
                    })
                }
                obj.subCategory = subCatArr
                return this.res.send({ status: 1, message: "Details are: ", data: obj });
            }
            else {
                let andArray = [{}];
                const sort = this.req.body.sort ? this.req.body.sort : { _id: -1 };
                const skip = (parseInt(this.req.body.page) || parseInt(this.req.body.pagesize)) ? (parseInt(this.req.body.page) - 1) * parseInt(this.req.body.pagesize) : 0;
                const limit = parseInt(this.req.body.pagesize) ? parseInt(this.req.body.pagesize) : 5;
                // filter
                if (this.req.body.finalPrice) {
                    const Arr = this.req.body.finalPrice;
                    andArray.push({ "finalPrice": { $gte: Arr.minFinalPrice, $lte: Arr.maxFinalPrice } });
                }
                if (this.req.body.brandName) {

                    this.req.body.brandName.filter((i) => { id.push(ObjectID(i)); });
                    andArray.push({ 'brandId': { "$in": id } });
                }
                // all brands of products based on categories
                let query = {
                    isDeleted: false, isEcommerce: true, status: 'Published',
                    description: { $exists: true }, categoryIds: ObjectID(this.req.body.categoryId)
                }
                let brandData = await Products.aggregate([
                    { $match: query },
                    { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
                    { $unwind: { "path": "$brand", "preserveNullAndEmptyArrays": true } },
                    { $group: { _id: "$brandId", name: { $first: "$brand.name" } } },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            isSelected: { $cond: { if: { $gte: [{ $indexOfArray: [id, "$_id"] }, 0] }, then: true, else: false } }
                        }
                    }
                ]);
                console.log(`brandData: ${JSON.stringify(brandData)}`)
                obj.brand = brandData;
                // getting overall range of products
                const maximumRange = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    { $sort: { totalPrice: -1 } },
                    { $skip: 0 },
                    { $limit: 1 },
                ]);
                console.log(`maximumRange: ${maximumRange}`)
                obj.maxRange = (maximumRange != null || maximumRange != undefined) ? maximumRange.finalPrice : 0
                const minimumRange = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    { $sort: { totalPrice: 1 } },
                    { $skip: 0 },
                    { $limit: 1 },
                ]);
                console.log(`minimumRange: ${minimumRange}`)

                obj.minRange = (maximumRange != null || maximumRange != undefined) ? minimumRange.finalPrice : 0

                // third level products with pagination
                const products = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    {
                        $group: {
                            _id: "$_id", name: { $first: "$name" },
                            productImage: { $first: "$productImage" },
                            attributes: { $first: "$attributes" },
                            customUrl: { $first: "$customUrl" },
                            stock: { $first: "$stock" },
                            productType: { $first: "$productType" },
                            sellerId: { $first: "$sellerId" },
                            finalPrice: { $first: "$finalPrice" },
                            discountPrice: { $first: "$discountPrice" },
                            totalPrice: { $first: "$totalPrice" },
                            price: { $first: "$price" },
                            discount: { $first: "$discount" },
                            color: { $first: "$color" },
                            brandId: { $first: "$brandId" },
                        }
                    },
                    { $match: { $and: andArray } },
                    { $sort: sort },
                    { $skip: skip },
                    { $limit: limit },
                ]);
                const productsTotal = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    {
                        $group: {
                            _id: "$_id", name: { $first: "$name" },
                            productImage: { $first: "$productImage" },
                            attributes: { $first: "$attributes" },
                            customUrl: { $first: "$customUrl" },
                            stock: { $first: "$stock" },
                            productType: { $first: "$productType" },
                            sellerId: { $first: "$sellerId" },
                            finalPrice: { $first: "$finalPrice" },
                            discountPrice: { $first: "$discountPrice" },
                            totalPrice: { $first: "$totalPrice" },
                            price: { $first: "$price" },
                            discount: { $first: "$discount" },
                            color: { $first: "$color" },
                            brandId: { $first: "$brandId" },
                        }
                    },
                    { $match: { $and: andArray } },
                ]);
                obj.products = products;
                obj.total = productsTotal.length
                return this.res.send({ status: 1, message: "Details are: ", data: obj });
            }

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = CategoriesController


