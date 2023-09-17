const _ = require("lodash");

const Controller = require("../base");
const { GameProducts } = require('../../models/s_game_product');
const { Products } = require('../../models/s_products');
const { Categories } = require('../../models/s_category');
const { Plans } = require('../../models/s_plan_game');
const { Country } = require('../../models/s_country');
const { Games } = require('../../models/s_games');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');
const RequestBody = require("../../utilities/requestBody");
const { AdminSettings } = require("../../models/s_admin_settings");


const categoriesStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];

const countryStages = [
    { $lookup: { from: "countries", localField: "countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
]

const planStages = [
    { $lookup: { from: "plans", localField: "planId", foreignField: "_id", as: "plan" } },
    { $unwind: { "path": "$plan", "preserveNullAndEmptyArrays": true } },
]

const adminSettingsStages = [
    { $lookup: { from: "adminsettings", localField: "adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
]

const stages = [
    { $lookup: { from: "categories", localField: "categoryIds", foreignField: "_id", as: "category" } },
    { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
    { $unwind: { "path": "$brand", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "gstcodes", localField: "gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "commissions", localField: "commissionId", foreignField: "_id", as: "commission" } },
    { $unwind: { "path": "$commission", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "stores", localField: "seller._id", foreignField: "sellerId", as: "store" } },
    { $unwind: { "path": "$store", "preserveNullAndEmptyArrays": true } },
    ...adminSettingsStages
];

const projection = [
    {
        $project: {
            "categories._id": "$category._id", "categories.categoryName": "$category.categoryName", "categories.type": "$category.type",
            "brand._id": "$brand._id", "brand.name": "$brand.name",
            "gstCode._id": "$gstCode._id", "gstCode.gst": "$gstCode.gst",
            otherTaxes: 1,
            price: {
                $sum: ["$unitPrice", "$otherTaxes"]
            },
            adminsettings: 1, discount: 1,
            "commission._id": "$commission._id", "commission.commission": "$commission.commission",
            "seller._id": "$seller._id", "seller.fullName": "$seller.fullName",
            "store._id": "$store._id", "store.name": "$store.name",
            name: 1, productImage: 1, customUrl: 1, unitPrice: 1, stock: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1,
            productType: 1
        }
    },
    {
        $project: {
            categories: 1, brand: 1, gstCode: 1,
            otherTaxes: 1,
            price: 1,
            adminsettings: 1, discount: 1,
            discountPrice: {
                $multiply: [{
                    $divide: ["$discount", 100]
                }, "$price"]
            },
            commissionAmount: {
                $multiply: [{
                    $divide: ["$commission.commission", 100]
                }, "$price"]
            },
            gstAmount: {
                $multiply: [{
                    $divide: ["$gstCode.gst", 100]
                }, "$price"]
            },
            commission: 1, seller: 1, store: 1,
            name: 1, productImage: 1, customUrl: 1, unitPrice: 1, stock: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1,
            productType: 1
        }
    },
    {
        $project: {
            categories: 1, brand: 1, gstCode: 1,
            otherTaxes: 1,
            price: 1, discountPrice: 1,
            adminsettings: 1, discount: 1,
            finalPrice: { $subtract: ["$price", "$discountPrice"] },
            commissionAmount: 1,
            gstAmount: 1,
            adminsettings: 1,
            commission: 1, seller: 1, store: 1,
            name: 1, productImage: 1, customUrl: 1, unitPrice: 1, stock: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1,
            productType: 1
        }
    },
    {
        $project: {
            categories: 1, brand: 1, gstCode: 1, productType: 1,
            otherTaxes: 1,
            price: 1, discountPrice: 1,
            discount: 1,
            finalPrice: {
                $sum: ["$finalPrice", {
                    $multiply: [{
                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                    }, "$finalPrice"]
                }, {
                        $multiply: [{
                            $divide: ["$gstCode.gst", 100]
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
                            $divide: ["$gstCode.gst", 100]
                        }, "$price"]
                    }]
            },
            commissionAmount: 1,
            gstAmount: 1,
            adminsettings: 1,
            commission: 1, seller: 1, store: 1,
            name: 1, productImage: 1, customUrl: 1, unitPrice: 1, stock: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1
        }
    },
]
class GameProductsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Game product details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "countryId": "630f516684310d4d2a98baf2",
        "planId": "63f9afbdc644f7f164b2b4f8",
        "categoryId": "63e87d54916c08c8ae166caf",
        "hsnCode": "CODE",
        "name": "Game 1",
        "games": ["63f9b1cbd65ec100a31f5921","63f9b1dbd65ec100a31f5926"],
        "description": "description",
        "unitPrice": 100,
        "gstPercentage": 10,
        "gstAmount": 10,
        "otherTaxes": 2,
        "finalPrice": 112,
        "sponserCommission": 3,
        "autoRepurchaseCommission": 2,
        "points": 5,
        "pointsValidity": 90,
        "autoPoints": 5,
        "autoPointsValidity": 90,
        "autoRepurchaseCycle": 2,
        "rewardsCycle": 2,
        "shoppingAmountCycle": 2,
        "products": [],
        "levels": [
            {
            "level": 1,
            "commissionAmount": 2000,
            "salarCoins": 12,
            "shoppingAmount": 200,
            },
        ],
        "image": "game.png",
        "imageLabel": "Main image",
        "gallaryImages": [
            {
            "imgSequence": 1,
            "imgLabel": "first-image",
            "imgName": "image1.jpg",
            },
        ],
        "tempImgArr": [
            {
             "imgSequence": 1,
            "imgLabel": "first-image",
            "imgName": "image1.jpg",
            },
        ],
        "temporaryImages": [{ "imgName": "image1.jpg" }],
        "metaTitle": "meta title",
        "metaKeywords": "meta keywords",
        "metaDescription": "meta description",
        "gameProductId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateGameProduct() {
        try {
            let data = this.req.body;
            const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
            if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
            data.adminSettingsId = adminSettings._id;
            if (data.gameProductId) {
                const fieldsArray = ["countryId", "planId", "categoryId", "hsnCode", "name",
                    "description", "unitPrice", "gstPercentage", "gstAmount", "otherTaxes",
                    "finalPrice", "sponserCommission", "autoRepurchaseCommission", "points", "pointsValidity",
                    "autoPoints", "autoPointsValidity", "autoRepurchaseCycle", "rewardsCycle",
                    "shoppingAmountCycle", "metaTitle", "metaKeywords", "metaDescription"];
                const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
                if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                    return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
                }
                const checkCategory = await Categories.findOne({ _id: data.categoryId, isDeleted: false });
                if (_.isEmpty(checkCategory)) {
                    return this.res.send({ status: 0, message: "Category details not found" });
                }
                const checkPlan = await Plans.findOne({ _id: data.planId, isDeleted: false });
                if (_.isEmpty(checkPlan)) {
                    return this.res.send({ status: 0, message: "Plan details not found" });
                }
                const checkCountry = await Country.findOne({ _id: data.countryId, isDeleted: false });
                if (_.isEmpty(checkCountry)) {
                    return this.res.send({ status: 0, message: "Country details not found" });
                }
                if (data.games && data.games.length > 0) {
                    for (let i = 0; i < data.games.length; i++) {
                        const checkGames = await Games.findOne({ _id: data.games[i], isDeleted: false });
                        if (_.isEmpty(checkGames)) {
                            return this.res.send({ status: 0, message: "Game details not found" });
                        }
                    }

                }
            } else {
                if (!data.name) {
                    return this.res.send({ status: 0, message: "Please send name" });
                }
            }
            if (data.gameProductId) {
                const checkName = await GameProducts.findOne({ name: data.name, _id: { $nin: [data.gameProductId] }, isDeleted: false });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                const updatedGameProduct = await GameProducts.findByIdAndUpdate(data.gameProductId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Game updated successfully", data: updatedGameProduct });
            } else {
                const checkName = await GameProducts.findOne({ name: data.name });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                let gameProduct = await GameProducts.find();
                let custom = "";
                let check = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-')
                for (let i = 0; i < gameProduct.length; i++) {
                    custom = await GameProducts.find({ "customUrl": check })
                    if (custom.length === 0) { break; }
                    else { check = check + i }
                }
                data.customUrl = check;
                let middle = "";
                let check1 = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
                for (let i = 0; i < gameProduct.length; i++) {
                    custom = await GameProducts.find({ "customUrl": check1 })
                    if (custom.length === 0) { break; }
                    else { check1 = check1 + i }
                }
                if (data.name.length > 4) { middle = data.name.substring(0, 3); }
                else { middle = data.name }
                let last = gameProduct.length;
                data.sku = "sku" + "-" + middle + "-" + last;
                const newGame = await new Model(GameProducts).store(data);
                if (_.isEmpty(newGame)) {
                    return this.res.send({ status: 0, message: "Game details not saved" })
                }
                return this.res.send({ status: 1, message: "Game details added successfully", data: newGame });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Game Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getGameProductDetails() {
        try {
            const data = this.req.params;
            if (!data.gameProductId) {
                return this.res.send({ status: 0, message: "Please send gameProductId" });
            }
            const game = await GameProducts.findOne({ _id: data.gameProductId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('countryId', { name: 1 })
                .populate('planId', { name: 1 })
                .populate('games', { name: 1 })
                .populate('adminSettingsId', { transactionFeeLocal: 1, transactionFeeGlobal: 1 })
                .populate('products', { name: 1 });
            if (_.isEmpty(game)) {
                return this.res.send({ status: 0, message: "Game details not found" });
            }
            return this.res.send({ status: 1, data: game });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple Game change status
    Parameter:
    {
        "gameProductIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfGameProducts() {
        try {
            let msg = "Game status not updated";
            const updatedGameProducts = await GameProducts.updateMany({ _id: { $in: this.req.body.gameProductIds } }, { $set: { status: this.req.body.status } });
            if (updatedGameProducts) {
                msg = updatedGameProducts.modifiedCount ? updatedGameProducts.modifiedCount + " Game updated" : updatedGameProducts.matchedCount == 0 ? "Game not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Game details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "gameProductIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteGameProducts() {
        try {
            if (!this.req.body.gameProductIds) {
                return this.res.send({ status: 0, message: "Please send gameProductIds" });
            }
            let msg = 'Game not deleted.';
            let status = 1;
            const updatedGameProducts = await GameProducts.updateMany({ _id: { $in: this.req.body.gameProductIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedGameProducts) {
                msg = updatedGameProducts.modifiedCount ? updatedGameProducts.modifiedCount + ' Game deleted.' : updatedGameProducts.matchedCount == 0 ? "Details not found" : msg;
                status = updatedGameProducts.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: GameProducts Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
    async gameProductsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { name: regex }, { description: regex }, { hsnCode: regex },
                        { customUrl: regex }, { 'category.categoryName': regex },
                        { 'country.name': regex }, { 'plan.name': regex }
                    ]
                })
            }
            const result = await GameProducts.aggregate([
                { $match: { isDeleted: false, hsnCode: { $exists: true } } },
                ...categoriesStages,
                ...countryStages,
                ...planStages,
                ...adminSettingsStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, name: 1, customUrl: 1, status: 1, image: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "country._id": "$country._id", "country.name": "$country.name", sku: 1,
                        "plan._id": "$plan._id", "plan.name": "$plan.name", games: { $size: "$games" },
                        unitPrice: 1, gstPercentage: 1, gstAmount: 1, otherTaxes: 1, finalPrice: {
                            $sum: ["$finalPrice", {
                                $multiply: [{
                                    $divide: ["$adminsettings.transactionFeeLocal", 100]
                                }, "$finalPrice"]
                            }]
                        },
                        transactionFee: {
                            $multiply: [{
                                $divide: ["$adminsettings.transactionFeeLocal", 100]
                            }, "$finalPrice"]
                        },
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await GameProducts.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...countryStages,
                ...planStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: Download csv and excel files
     Method: Post
     Authorisation: true
     Parameter:
     {
          "type":"csv" or "excel",
          "startDate":"2022-09-20",
          "endDate":"2022-09-25",
          "searchText": "",
          "filteredFields":  ["Date",  "Game Product Id", "SKU", "Region","Product Type" "Product Name", "Plan", "Unit Price", "GST (%)", "GST Amount", "Other Taxes" "Final Price", "Status]
      }
     Return: JSON String
     ********************************************************/
    async downloadGameProductFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Game Product Id", "SKU", "Region", "Product Type", "Product Name", "Plan", "Unit Price", "GST (%)", "GST Amount", "Other Taxes", "Final Price", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { name: regex }, { description: regex }, { hsnCode: regex }, { sku: regex },
                        { customUrl: regex }, { 'category.categoryName': regex },
                        { 'country.name': regex }, { 'plan.name': regex }
                    ]
                })
            }
            data['model'] = GameProducts;
            data['stages'] = [
                ...categoriesStages,
                ...countryStages,
                ...planStages,
                { $match: { $and: query } },
            ];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Game Product Id": "$customUrl",
                    "Region": "$country.name",
                    "Product Name": "$name",
                    "SKU": "$sku",
                    "Plan": "$plan.name",
                    "Unit Price": "$unitPrice",
                    "GST (%)": "$gstPercentage",
                    "GST Amount": "$gstAmount",
                    "Other Taxes": "$otherTaxes",
                    "Final Price": {
                        $sum: ["$finalPrice", {
                            $multiply: [{
                                $divide: ["$adminsettings.transactionFeeLocal", 100]
                            }, "$finalPrice"]
                        }]
                    },
                    "Status": "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'game-products'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Add ecom product
      Method: Post
      Authorisation: true
      Parameter:
       {
          "productIds":["5c9df24382ddca1298d855bb"],
          "gameProductId":"5c9df24382ddca1298d855bb",
      }          
      Return: JSON String
      ********************************************************/
    async addEcomProduct() {
        try {
            let data = this.req.body;
            const fieldsArray = ["gameProductId", "productIds"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required.", });
            }
            const checkProduct = await GameProducts.findOne({ _id: data.gameProductId });
            if (_.isEmpty(checkProduct)) { return this.res.send({ status: 0, message: "Game product details not found" }); }
            await GameProducts.findByIdAndUpdate(data.gameProductId, { $push: { products: data.productIds } });
            return this.res.send({ status: 1, message: "Product details added successfully" });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Delete ecom product
      Method: Post
      Authorisation: true
      Parameter:
      {
          "productIds":["5c9df24382ddca1298d855bb"],
          "gameProductId":"5c9df24382ddca1298d855bb",
      }  
      Return: JSON String
      ********************************************************/
    async deleteEcomProduct() {
        try {
            let data = this.req.body;
            const fieldsArray = ["gameProductId", "productIds"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required.", });
            }
            const checkProduct = await GameProducts.findOne({ _id: data.gameProductId });
            if (_.isEmpty(checkProduct)) { return this.res.send({ status: 0, message: "Game product details not found" }); }
            await GameProducts.findByIdAndUpdate({ _id: data.gameProductId }, { $pull: { products: { $in: data.productIds } } });
            return this.res.send({ status: 1, message: "Product deleted successfully", });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: ecomProductsListing of product in admin
   Method: Post
   Authorisation: true
   Parameter:
   {
       "gameProductId":"63f9d3aab4bf5ee662d48d7e",
       "page":1,
       "pagesize":1,
       "sort":{
           "unitPrice":1
       }
   }
   Return: JSON String
   ********************************************************/
    async ecomProductsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            const details = await GameProducts.findOne({ _id: this.req.body.gameProductId, isDeleted: false }, { products: 1 });
            if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "Details not found" }); }
            console.log(`details: ${JSON.stringify(details)}`)
            const result = await Products.aggregate([
                { $match: { isDeleted: false, _id: { $in: details.products } } },
                ...stages,
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Products.aggregate([
                { $match: { isDeleted: false, _id: { $in: details.products } } },
                ...stages,
                ...projection,
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns of gameProduct names
    Method: Post
    Authorisation: true
    Parameter:
    {
       "searchText":"",
    }
    Return: JSON String
    ********************************************************/
    async gameProductFieldsList() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            let query = [{ isDeleted: false }]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }, { sku: regex }, { hsnCode: regex }] })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await GameProducts.aggregate([
                { $match: { $and: query } },
                { $project: { name: 1 } },
                { $sort: sort },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result });

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal Server Error" });
        }
    }

    /********************************************************
     Purpose:Getting Dropdowns of gameProduct names
    Method: Post
    Authorisation: true
    Parameter:
    {
        "searchText":"",
    }
    Return: JSON String
    ********************************************************/
    async gameProductFieldsListForGifts() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            let query = [{ isDeleted: false }]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }, { sku: regex }, { hsnCode: regex }] })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await GameProducts.aggregate([
                { $match: { $and: query } },
                ...planStages,
                { $project: { name: 1, unitPrice: 1, finalPrice: 1, width: "$plan.width", depth: "$plan.depth" } },
                { $sort: sort },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result });

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal Server Error" });
        }
    }
}
module.exports = GameProductsController;