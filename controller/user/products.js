const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Categories } = require('../../models/s_category');
const { Products } = require('../../models/s_products');
const { Deals } = require('../../models/s_deals');
const { ProductReviews } = require("../../models/s_product_review");

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
            sellerId: 1, otherTaxes: 1, gst: "$gstCode.gst", name: 1, description: 1, productImage: 1, customUrl: 1, productType: 1, attributes: 1,
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

const homeStages = [
    {
        $group: {
            _id: "$_id", name: { $first: "$name" },
            description: { $first: "$description" },
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
            size: { $first: "$size" },
        }
    }
]

const getProductStages = [
    {
        $group: {
            _id: "$_id", name: { $first: "$name" },
            description: { $first: "$description" },
            productImage: { $first: "$productImage" },
            attributes: { $push: "$attributes" },
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
            size: { $first: "$size" },
            brandId: { $first: "$brandId" },
        }
    }
]

class ProductsController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
  Purpose: Get HomePage Details In Front
  Method: Post
  Authorisation: true
  Parameter:
  {
      "sort":{
              "finalPrice":1
      },
      "page":1,
      "pagesize":20
  }
  Return: JSON String
  ********************************************************/
    async homePage() {
        try {
            const sort = this.req.body.sort ? this.req.body.sort : { _id: -1 };
            const skip = (parseInt(this.req.body.page) && parseInt(this.req.body.pagesize)) ? (parseInt(this.req.body.page) - 1) * parseInt(this.req.body.pagesize) : 0;
            const limit = parseInt(this.req.body.pagesize) ? parseInt(this.req.body.pagesize) : 20;
            const newDate = new Date()
            // need to get banner details from Deals
            const banner = await Deals.aggregate([
                { $match: { isDeleted: false, status: true } },
                {
                    $project: {
                        startDate: { $dateFromString: { dateString: '$startDate' } },
                        endDate: { $dateFromString: { dateString: '$endDate' } }, title: 1, banner: 1, usersLimit: 1, pageLink: 1, products: 1,
                    }
                },
                { $match: { $and: [{ startDate: { $lte: newDate } }, { endDate: { $gte: newDate } }] } }
            ])
            // getting categories
            let shopByCategory = await Categories.find({ isDeleted: false, type: "category", publish: true, isEcommerce: true })

            // getting bestSeller added products
            const bestSeller = await Products.aggregate([
                { $match: { isDeleted: false, bestSeller: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            // getting newArrival added products
            const newArrival = await Products.aggregate([
                { $match: { isDeleted: false, newArrival: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            // getting featured added products
            const featured = await Products.aggregate([
                { $match: { isDeleted: false, featured: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            // getting todaysDeal added products
            const todaysDeal = await Products.aggregate([
                { $match: { isDeleted: false, todaysDeal: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            // getting salarChoice added products
            const salarChoice = await Products.aggregate([
                { $match: { isDeleted: false, salarChoice: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            // getting festiveOffers added products
            const festiveOffers = await Products.aggregate([
                { $match: { isDeleted: false, festiveOffers: true, status: 'Published', isEcommerce: true, description: { $exists: true } } },
                ...ecomProductsStages,
                ...homeStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ])
            return this.res.send({ status: 1, message: "Details are: ", data: { banner, shopByCategory, bestSeller, newArrival, featured, todaysDeal, salarChoice, festiveOffers } });

        } catch (error) {
            console.log(error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose:Getting product Details in front
   Method: Post
   Parameter:
   {
       "page":1,
       "pagesize":5
   }
   Return: JSON String
   ********************************************************/
    async getProductDetails() {
        try {
            let reviewsCount = [];
            let categoryArr = [];
            // get product details begins
            let product = await Products.aggregate([
                {
                    $match: {
                        isDeleted: false, customUrl: this.req.params.customUrl,
                        isEcommerce: true, status: "Published", description: { $exists: true }
                    }
                },
                ...ecomProductsStages,
                ...getProductStages
            ]);
            if (_.isEmpty(product)) { return this.res.send({ status: 0, message: "Details not found" }); }

            const productDetails = await Products.findOne({ customUrl: this.req.params.customUrl }, {
                productImage: 0, attributes: 0,
                customUrl: 0, stock: 0, productType: 0,
            })
                .populate({
                    path: 'sellerId',
                    match: { isDeleted: false, status: true },
                    select: "fullName _id"
                })
                .populate({
                    path: 'returnTypes',
                    match: { isDeleted: false, status: true },
                    select: "name _id"
                })
                .populate({
                    path: 'replacementTypes',
                    match: { isDeleted: false, status: true },
                    select: "name _id"
                })
                .populate({
                    path: 'brandId',
                    match: { isDeleted: false, status: true },
                    select: "name _id"
                }).lean();
            // get product details ends

            // code for breadCrumbs start
            const parentCat = productDetails.categoryIds;
            if (parentCat.length > 0) {
                for (let s = 0; s < parentCat.length; s++) {
                    let cat = await Categories.findOne({ _id: parentCat[s] }, { categoryName: 1, type: 1 });
                    if (!_.isEmpty(cat)) {
                        categoryArr.push({ categoryName: cat.categoryName, _id: cat._id, type: cat.type })
                    }
                }
            }
            const arr1 = _.map(categoryArr, (o) => { if (o.type == "category") return { categoryName: o.categoryName, _id: o._id } });
            const arr2 = _.map(categoryArr, (o) => { if (o.type == "subCategory1") return { categoryName: o.categoryName, _id: o._id } });
            const arr3 = _.map(categoryArr, (o) => { if (o.type == "subCategory2") return { categoryName: o.categoryName, _id: o._id } });
            const arr = arr1.concat(arr2, arr3)
            const breadCrumbs = _.filter(arr, (val) => { if (val != undefined) return val })
            // code for breadCrumbs end

            // get reviews of the customer starts
            const query = { isDeleted: false, status: true, type: "isEcommerce", productId: productDetails._id };
            const project = { rating: 1, title: 1, description: 1, createdAt: 1 }
            const totalCount = await ProductReviews.countDocuments(query)
            const reviewDetails = await ProductReviews.find(query, project)
            if (!_.isEmpty(reviewDetails)) {
                for (let j = 1; j <= 5; j++) {
                    let review1 = await ProductReviews.find({ ...query, "rating": j });
                    reviewsCount.push({
                        rating: j,
                        count: review1.length,
                        percentage: (review1.length / totalCount) * 100
                    })
                }
            }
            // get reviews of the customer ends

            const similar = _.uniqBy(productDetails.relatedItems);
            const relatedItems = await Products.aggregate([
                {
                    $match: {
                        isDeleted: false, _id: { $in: similar },
                        isEcommerce: true, status: "Published"
                    }
                },
                ...ecomProductsStages,
                ...getProductStages
            ])
            return this.res.send({ status: 1, message: "Details are: ", productDetails: { ...product[0], ...productDetails }, breadCrumbs, relatedItems, reviewsCount });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting all products during search (searchProduct api)
    Method: Post
    Parameter:
    {
        "searchText":"m",
        "sort":{
                "finalPrice":1
        },
                "brandName":["5cdd283cd940e50ce913ab29"],
                    "finalPrice":{
                "minFinalPrice":10,
                "maxFinalPrice":500
        },
        "stock":"outOfStock"
    }
    Return: JSON String
    ********************************************************/
    async searchProduct() {
        try {
            let andArray = [{}];
            let sort = this.req.body.sort ? this.req.body.sort : { _id: -1 };
            let skip = this.req.body.page && this.req.body.pagesize ? (parseInt(this.req.body.page) - 1) * (parseInt(this.req.body.pagesize)) : 0;
            let limit = this.req.body.pagesize ? parseInt(this.req.body.pagesize) : 20;
            if (this.req.body.searchText) {
                let newRegEx = { $regex: '.*' + this.req.body.searchText + '.*', $options: 'i' }
                const name = { 'name': newRegEx }
                const description = { 'description': newRegEx }
                const orquery = { $or: [name, description] };
                andArray.push(orquery);
            }
            if (this.req.body.finalPrice) {
                let arr = this.req.body.finalPrice;
                if (arr.minFinalPrice || arr.maxFinalPrice) { andArray.push({ "finalPrice": { $gte: arr.minFinalPrice, $lte: arr.maxFinalPrice } }); }
            }
            if (this.req.body.brandName) {
                let id = []
                this.req.body.brandName.filter((i) => {
                    id.push(ObjectID(i));
                });
                andArray.push({ 'brandId': { "$in": id } });
            }
            if (this.req.body.stock) {
                if (this.req.body.stock === "inStock") {
                    andArray.push({ "stock": true })
                }
                if (this.req.body.stock === "outOfStock") {
                    andArray.push({ "stock": false })
                }
            }
            let query = { $and: andArray }
            console.log(`query: ${JSON.stringify(query)}`)
            // brand details begins
            const brand = await Products.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        isEcommerce: true, status: "Published", description: { $exists: true }
                    }
                },
                ...ecomProductsStages,
                ...getProductStages,
                { $match: query },
                { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
                { $unwind: { "path": "$brand", "preserveNullAndEmptyArrays": true } },
                {
                    $group: {
                        _id: "$brandId",
                        name: { $first: "$brand.name" }
                    }
                }
            ]);
            console.log(`brand: ${JSON.stringify(brand)}`)
            // brand details ends
            // getting product details begins
            let productListing = await Products.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        isEcommerce: true, status: "Published", description: { $exists: true }
                    }
                },
                ...ecomProductsStages,
                ...getProductStages,
                { $match: query },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            console.log(`productListing: ${JSON.stringify(productListing)}`)
            if (_.isEmpty(productListing)) { return this.res.send({ status: 0, message: "Details not found" }); }
            let total = 0; let maxRange = 0; let minRange = 0;
            if (productListing.length > 0) {
                const maximumRange = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    { $sort: { finalPrice: -1 } },
                    { $skip: 0 },
                    { $limit: 1 },
                ]);
                maxRange = ((maximumRange != null || maximumRange != undefined) && maximumRange.length > 0) ? maximumRange[0].finalPrice : 0
                const minimumRange = await Products.aggregate([
                    { $match: query },
                    ...ecomProductsStages,
                    { $sort: { finalPrice: 1 } },
                    { $skip: 0 },
                    { $limit: 1 },
                ]);
                minRange = ((minimumRange != null || minimumRange != undefined) && minimumRange.length > 0) ? minimumRange[0].finalPrice : 0

                const productsTotal = await Products.aggregate([
                    {
                        $match: {
                            isDeleted: false,
                            isEcommerce: true, status: "Published", description: { $exists: true }
                        }
                    },
                    ...ecomProductsStages,
                    ...getProductStages,
                    { $match: query },
                ]);
                total = productsTotal.length;
            }
            if (_.isEmpty(productListing))
                return this.res.send({ status: 0, message: "Product details not found" });
            let data = {
                products: productListing, brand, minRange, maxRange, total
            }
            return this.res.send({ status: 1, message: "Details are: ", data });
        }
        catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting products based on categories
    Method: Post
    Parameter:
    {
        "categoryIds":["6464c6954f9f83367f5ba1d9"],
        "finalPrice":{
                "minFinalPrice":10,
                "maxFinalPrice":500
        },
        "page":1,
        "pagesize":10
        "stock":"inStock",
        "brandName":["63fb03bafac9103ca0a28f78",]
        "categoryId":"6464c6954f9f83367f5ba1d9"
    }
    Return: JSON String
    ********************************************************/
    async productFilter() {
        try {
            let andArray = [{}];
            let sort = this.req.body.sort ? this.req.body.sort : { _id: -1 };
            let skip = this.req.body.page && this.req.body.pagesize ? (parseInt(this.req.body.page) - 1) * (parseInt(this.req.body.pagesize)) : 0;
            let limit = this.req.body.pagesize ? parseInt(this.req.body.pagesize) : 20;
            // filter
            if (this.req.body.finalPrice) {
                let arr = this.req.body.finalPrice;
                andArray.push({ "finalPrice": { $gte: arr.minFinalPrice, $lte: arr.maxFinalPrice } });
            }
            if (this.req.body.categoryIds) {
                let ids = []
                this.req.body.categoryIds.filter((i) => { ids.push(ObjectID(i)); });
                this.req.body.categoryIds = ids;
            }
            if (this.req.body.brandName) {
                let id = []
                this.req.body.brandName.filter((i) => { id.push(ObjectID(i)); });
                andArray.push({ 'brandId': { "$in": id } });
            }
            if (this.req.body.stock) {
                if (this.req.body.stock === "inStock") andArray.push({ "stock": true })
                if (this.req.body.stock === "outOfStock") andArray.push({ "stock": false })
            }
            let obj = {};
            let catArray = [];
            let category1, category2;
            // start code for breadCrumsb data
            let category = await Categories.findOne({ "_id": this.req.body.categoryId, isDeleted: false, publish: true }, { _id: 1, categoryName: 1, parentCategory: 1, image: 1 });
            if (!_.isEmpty(category)) {
                catArray.push({ categoryName: category.categoryName, _id: category._id });
                category1 = await Categories.findOne({ "_id": category.parentCategory, isDeleted: false, publish: true }, { _id: 1, categoryName: 1, parentCategory: 1 });
            }
            if (!_.isEmpty(category1)) {
                catArray.push({ categoryName: category1.categoryName, _id: category1._id });
                category2 = await Categories.findOne({ "_id": category1.parentCategory, isDeleted: false, publish: true }, { _id: 1, categoryName: 1, parentCategory: 1 });
            }
            if (!_.isEmpty(category2)) {
                catArray.push({ categoryName: category2.categoryName, _id: category2._id });
            }
            obj.categoryNamesArray = catArray.reverse()
            // end code for breadCrumbs data
            obj.categoryName = category;
            // getting categoryNames for sideBar
            let subCat = await Categories.find({ "parentCategory": this.req.body.categoryId, isDeleted: false, publish: true }, { _id: 1, categoryName: 1 });
            obj.subcategoryName = subCat.reverse();
            // applying pagination for lazying loading
            let subcategory = await Categories.find({ "parentCategory": this.req.body.categoryId, isDeleted: false, publish: true }, { _id: 1, categoryName: 1 }, { _id: 1, categoryName: 1 }).sort({ _id: 1 }).skip(skip).limit(limit)
            // all brands of products based on categories
            let query = {
                isDeleted: false,
                isEcommerce: true, status: "Published", description: { $exists: true }
            }
            let finalQuery = this.req.body.categoryIds && this.req.body.categoryIds.length > 0 ?
                { categoryIds: { $in: (this.req.body.categoryIds) } } : {};
            const brandData = await Products.aggregate([
                { $match: { ...query, ...finalQuery } },
                ...ecomProductsStages,
                ...getProductStages,
                { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
                { $unwind: { "path": "$brand", "preserveNullAndEmptyArrays": true } },
                {
                    $group: {
                        _id: "$brandId",
                        name: { $first: "$brand.name" }
                    }
                }
            ]);
            console.log(`brandData: ${JSON.stringify(brandData)}`)
            obj.brand = brandData;
            // getting overall range of products
            const maximumRange = await Products.aggregate([
                { $match: query },
                ...ecomProductsStages,
                { $sort: { finalPrice: -1 } },
                { $skip: 0 },
                { $limit: 1 },
            ]);
            obj.maxRange = ((maximumRange != null || maximumRange != undefined) && maximumRange.length > 0) ? maximumRange[0].finalPrice : 0
            const minimumRange = await Products.aggregate([
                { $match: query },
                ...ecomProductsStages,
                { $sort: { finalPrice: 1 } },
                { $skip: 0 },
                { $limit: 1 },
            ]);
            obj.minRange = ((minimumRange != null || minimumRange != undefined) && minimumRange.length > 0) ? minimumRange[0].finalPrice : 0

            // third level products with pagination
            if (_.isEmpty(subcategory)) {
                // andArray.push({ "categoryIds": { $in: [category._id] }, isDeleted: false });
                console.log(`andArray: ${JSON.stringify(andArray)}`)
                const products = await Products.aggregate([
                    {
                        $match: { ...query, ...finalQuery }
                    },
                    ...ecomProductsStages,
                    ...getProductStages,
                    { $match: { $and: andArray } },
                    { $sort: sort },
                    { $skip: skip },
                    { $limit: limit },
                ]);
                const productsTotal = await Products.aggregate([
                    { $match: { ...query, ...finalQuery } },
                    ...ecomProductsStages,
                    ...getProductStages,
                    { $match: { $and: andArray } },
                ])
                obj.products = products;
                obj.total = productsTotal.length
                return this.res.send({ status: 1, message: "Details are: ", data: obj });
            }
            else {
                obj.subcategoryName = subCat;
                obj.total = subCat.length;
                // second level products
                for (let i = 0; i < subcategory.length; i++) {
                    andArray.push({ "categoryIds": ObjectID(subcategory[i]._id), isDeleted: false });
                    const products = await Products.aggregate([
                        {
                            $match: {
                                isDeleted: false,
                                isEcommerce: true, status: "Published", description: { $exists: true }
                            }
                        },
                        ...ecomProductsStages,
                        ...getProductStages,
                        { $match: { $and: andArray } },
                        { $sort: sort },
                        { $skip: skip },
                        { $limit: limit },
                    ]);
                    andArray.pop();
                    if (!_.isEmpty(products)) {
                        obj[subcategory[i].categoryName] = products;
                    }
                }
            }
            return this.res.send({ status: 1, message: "Details are: ", data: obj });
        }
        catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = ProductsController


