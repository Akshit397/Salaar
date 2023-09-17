/** @format */

const _ = require("lodash");
const { ObjectID } = require('mongodb');
const fs = require('fs');

const Controller = require("../base");
const { FoodProducts } = require("../../models/s_food_products");
const { Categories } = require("../../models/s_category");
const { Commissions } = require("../../models/s_category_commission");
const { GSTCodes } = require("../../models/s_gov_and_gst_code");

const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const DownloadsController = require('../common/downloads');
const { AdminSettings } = require("../../models/s_admin_settings");

const Model = require("../../utilities/model");

const stages = [
    { $lookup: { from: "categories", localField: "categoryIds", foreignField: "_id", as: "category" } },
    { $lookup: { from: "gstcodes", localField: "gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "commissions", localField: "commissionId", foreignField: "_id", as: "commission" } },
    { $unwind: { "path": "$commission", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "stores", localField: "seller._id", foreignField: "sellerId", as: "store" } },
    { $unwind: { "path": "$store", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "adminsettings", localField: "adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
];
const projection = [
    {
        $project: {
            "categories._id": "$category._id", "categories.categoryName": "$category.categoryName",
            "gstCode._id": "$gstCode._id", "gstCode.gst": "$gstCode.gst",
            otherTaxes: 1,
            finalPrice: {
                $sum: ["$unitPrice", "$otherTaxes", {
                    $multiply: [{
                        $divide: ["$gstCode.gst", 100]
                    }, "$unitPrice"]
                }]
            },
            commissionAmount: {
                $multiply: [{
                    $divide: ["$commission.commission", 100]
                }, "$unitPrice"]
            },
            gstAmount: {
                $multiply: [{
                    $divide: ["$gstCode.gst", 100]
                }, "$unitPrice"]
            },
            adminsettings: 1,
            "commission._id": "$commission._id", "commission.commission": "$commission.commission",
            "seller._id": "$seller._id", "seller.fullName": "$seller.fullName",
            "store._id": "$store._id", "store.name": "$store.name",
            name: 1, productImage: 1, type: 1, unitPrice: 1, description: 1, sku: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1,
            bestSeller: 1, newArrival: 1, featured: 1, todaysDeal: 1, salarChoice: 1, festiveOffers: 1,
        }
    },
    {
        $project: {
            finalPrice: {
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
            categories: 1, gstCode: 1, otherTaxes: 1, commissionAmount: 1, gstAmount: 1,
            commission: 1, seller: 1, store: 1, description: 1,
            name: 1, productImage: 1, type: 1, unitPrice: 1, status: 1, sku: 1,
            createdAt: 1, updatedAt: 1, sponserCommission: 1, bestSeller: 1, newArrival: 1, featured: 1, todaysDeal: 1, salarChoice: 1, festiveOffers: 1,
            netPrice: { $subtract: ["$unitPrice", { $add: ["$commissionAmount", "$sponserCommission", "$discountPoints"] }] }
        }
    }
]

class FoodProductController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
        this.authentication = new Authentication();
    }

    /********************************************************
      Purpose: Add and update Food product details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryIds": ["63e87d54916c08c8ae166caf"],
        "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
        "commissionId": "63fb2e51c05b36be844c4a5f",
        "type":"Veg",
        "name": "Oppo A74",
        "description": "product short description",
        "unitPrice": 200,
        "productImage": "Product.png",
        "imageLabel": "Main image",
        "sku": "pro-sku-1",
        "otherTaxes": 5,
        "packagingCharges": 10,
        "DeliveryCharges": 2,
        "peakCharges": 5,
        "discountPoints": 10,
        "sponserCommission": 10,
        "discountDate": {
          "from": "22/03/2023",
          "to": "22/06/2023",
        },
        "discountType": "flat",
        "discount": 10,
        "metaTitle": "meta title",
        "metaKeywords": "meta keywords",
        "metaDescription": "meta description",
        "bestSeller": true,
        "newArrival": true,
        "featured": true,
        "todaysDeal": true,
        "salarChoice": true,
        "festiveOffers": true,
        "foodProductId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateFoodProduct() {
        try {
            let data = this.req.body;
            data.sellerId = this.req.user;
            const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
            if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
            data.adminSettingsId = adminSettings._id;
            if (data.foodProductId) {
                const fieldsArray = ["categoryIds", "gstCodeId", "commissionId", "name",
                    "unitPrice", "discountPoints", "sponserCommission", "description",
                    "productImage", "imageLabel", "metaTitle", "metaKeywords", "metaDescription", "type"];
                const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
                if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                    return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
                }
                const checkCategories = await Categories.find({ _id: { $in: data.categoryIds }, isDeleted: false }, { categoryName: 1 });
                if (_.isEmpty(checkCategories) || !(checkCategories.length >= 1)) {
                    return this.res.send({ status: 0, message: "Category details not found" });
                }
                const checkGSTCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false });
                if (_.isEmpty(checkGSTCode)) {
                    return this.res.send({ status: 0, message: "GSTCode details not found" });
                }
                const checkCommission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false });
                if (_.isEmpty(checkCommission)) {
                    return this.res.send({ status: 0, message: "Commission details not found" });
                }
            }
            else {
                if (!data.name) {
                    return this.res.send({ status: 0, message: "Please send name" });
                }
            }
            if (data.foodProductId) {
                const foodProduct1 = await FoodProducts.findOne({ _id: this.req.body.foodProductId, sellerId: data.sellerId });
                if (_.isEmpty(foodProduct1)) { return this.res.send({ status: 0, message: "Food Product details not found" }); }

                data.sku = foodProduct1.sku;
                data.customUrl = foodProduct1.customUrl
                const checkName = await FoodProducts.findOne({ name: data.name, _id: { $nin: [data.foodProductId] }, isDeleted: false });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                const updatedProduct = await FoodProducts.findByIdAndUpdate(data.foodProductId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Food Product updated successfully", data: updatedProduct });
            } else {
                const checkName = await FoodProducts.findOne({ name: data.name });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                const foodProductDetails = await FoodProducts.find();
                let custom = "";
                let check = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-')
                for (let i = 0; i < foodProductDetails.length; i++) {
                    custom = await FoodProducts.find({ "customUrl": check })
                    if (custom.length === 0) { break; }
                    else { check = check + i }
                }
                data.customUrl = check;
                let middle = "";
                let check1 = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
                for (let i = 0; i < foodProductDetails.length; i++) {
                    custom = await FoodProducts.find({ "foodProductId": check1 })
                    if (custom.length === 0) { break; }
                    else { check1 = check1 + i }
                }
                if (data.name.length > 4) { middle = data.name.substring(0, 3); }
                else { middle = data.name }
                let last = foodProductDetails.length;
                data.sku = "sku" + "-" + middle + "-" + last;
                const newProduct = await new Model(FoodProducts).store(data);
                if (_.isEmpty(newProduct)) {
                    return this.res.send({ status: 0, message: "Food Product details not saved" })
                }
                return this.res.send({ status: 1, message: "Food Product details added successfully", data: newProduct });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Food Product Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getFoodProductDetails() {
        try {
            const data = this.req.params;
            if (!data.foodProductId) {
                return this.res.send({ status: 0, message: "Please send foodProductId" });
            }
            const foodProductDetails = await FoodProducts.findOne({ _id: data.foodProductId, isDeleted: false }, { _v: 0 })
                .populate('categoryIds', { categoryName: 1 })
                .populate('gstCodeId', { gst: 1, price: 1 })
                .populate('commissionId', { commission: 1, price: 1 })
                .populate('adminSettingsId', { transactionFeeLocal: 1, transactionFeeGlobal: 1 })
                .populate('sellerId', { fullName: 1 })
            if (_.isEmpty(foodProductDetails)) {
                return this.res.send({ status: 0, message: "Food Product details not found" });
            }
            return this.res.send({ status: 1, data: foodProductDetails });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple change status
    Parameter:
    {
        "foodProductIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status": "Pending",
        "isAdmin": true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfFoodProducts() {
        try {
            const sellerId = this.req.user;
            let msg = "Food product status not updated";
            const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.foodProductIds } } : { _id: { $in: this.req.body.foodProductIds }, sellerId: ObjectID(sellerId) };
            const updatedFoodProducts = await FoodProducts.updateMany(query, { $set: { status: this.req.body.status } });
            if (updatedFoodProducts) {
                msg = updatedFoodProducts.modifiedCount ? updatedFoodProducts.modifiedCount + " Food product updated" : updatedFoodProducts.matchedCount == 0 ? "Food product not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Product details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "foodProductIds":["5c9df24382ddca1298d855bb"],
        "isAdmin": true
   }  
   Return: JSON String
   ********************************************************/
    async deleteFoodProducts() {
        try {
            const sellerId = this.req.user;
            if (!this.req.body.foodProductIds) {
                return this.res.send({ status: 0, message: "Please send foodProductIds" });
            }
            let msg = 'Food Product not deleted.';
            let status = 1;
            const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.foodProductIds }, isDeleted: false } : { _id: { $in: this.req.body.foodProductIds }, sellerId: ObjectID(sellerId), isDeleted: false };

            const updatedFoodProducts = await FoodProducts.updateMany(query, { $set: { isDeleted: true } });
            if (updatedFoodProducts) {
                msg = updatedFoodProducts.modifiedCount ? updatedFoodProducts.modifiedCount + ' Food Product deleted.' : updatedFoodProducts.matchedCount == 0 ? "Details not found" : msg;
                status = updatedFoodProducts.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Food Products Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": "long",
          "type":"Non-veg",
          "status":"Pending",
          "isAdmin": true,
          "filter":{
            "bestSeller": true,
            "newArrival": true,
            "featured": true,
            "todaysDeal": true,
            "salarChoice": true,
            "festiveOffers": true
          }
      }
      Return: JSON String
      ********************************************************/
    async foodProductsListing() {
        try {
            const sellerId = this.req.user;
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
            }
            if (data.type) {
                query.push({ type: data.type })
            }
            if (data.status) {
                query.push({ status: data.status })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { name: regex }, { description: regex },
                        { sku: regex }, { type: regex }, { 'category.categoryName': regex },
                        { 'seller.fullName': regex }, { 'store.name': regex }
                    ]
                })
            }
            const matchQuery = this.req.body.isAdmin ? { isDeleted: false, description: { $exists: true } } : { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };
            const result = await FoodProducts.aggregate([
                { $match: matchQuery },
                ...stages,
                { $match: { $and: query } },
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await FoodProducts.aggregate([
                { $match: matchQuery },
                ...stages,
                { $match: { $and: query } },
                ...projection,
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
          "foodType":"Veg",
          "status":"Approved",
          "isAdmin": true,
        "filter":{
            "bestSeller": true,
            "newArrival": true,
            "featured": true,
            "todaysDeal": true,
            "salarChoice": true,
            "festiveOffers": true
          },
          "filteredFields":["Date", "Product Name", "Product Image", "Product Id", "Product Type", "Unit Price",  "Status", "Categories", 
           "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Net Price", "Updated Date"]
      }
     Return: JSON String
     ********************************************************/
    async downloadFoodProductFiles() {
        try {
            const sellerId = this.req.user;
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.foodType) {
                query.push({ type: data.foodType })
            }
            if (data.status) {
                query.push({ status: data.status })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Product Name", "Product Image", "Product Id", "Product Type", "Unit Price", "Status", "Categories",
                    "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Net Price", "Updated Date"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [
                        { name: regex }, { description: regex },
                        { sku: regex }, { type: regex }, { 'category.categoryName': regex },
                        { 'seller.fullName': regex }, { 'store.name': regex }
                    ]
                })
            }
            const matchQuery = this.req.body.isAdmin ? { isDeleted: false, description: { $exists: true } } : { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };

            data['model'] = FoodProducts;
            data['stages'] = [
                ...stages,
                { $match: { $and: query } },
                ...projection,
            ];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Product Name": "$name",
                    "Product Image": "$productImage",
                    "Product Id": '$sku',
                    "Product Type": "$type",
                    "Unit Price": "$unitPrice",
                    "Status": "$status",
                    "Categories": "$categories.categoryName",
                    "GST Percentage": "$gstCode.gst",
                    "GST Amount": "$gstAmount",
                    "Other Taxes": "$otherTaxes",
                    "Commission Percentage": "$commission.commission",
                    "Commission Amount": "$commissionAmount",
                    "Seller Name": "$seller.fullName",
                    "Store Name": "$store.name",
                    "Sponser Commission": "$sponserCommission",
                    "Final Price": "$finalPrice",
                    "Net Price": "$netPrice",
                    "Updated Date": { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt", timezone: "Asia/Kolkata" } },
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = matchQuery;
            data['filterQuery'] = {}
            data['fileName'] = 'food-products'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: Delete related products of a product in admin
     Method: Post
     Authorisation: true
     Parameter:
     {
         "foodProductId":"6402ed51f0c082f623a4683d",
         "ids":["6402ed58f0c082f623a4685a"]
     }
     Return: JSON String
     ********************************************************/
    async deleteRelatedFoodProduct() {
        try {
            const details = await FoodProducts.findById({ _id: this.req.body.foodProductId });
            const arr = details.relatedItems;
            const foodProductIds = this.req.body.ids;
            for (let i = 0; i < foodProductIds.length; i++) {
                for (let j = 0; j < arr.length; j++) {
                    if (arr[j].toString() === foodProductIds[i]) { arr.splice(j, 1) }
                }
            }
            let data = {}
            data.relatedItems = arr;
            await FoodProducts.findByIdAndUpdate(this.req.body.foodProductId, data)
            return this.res.send({ status: 1, message: "Deleted successfully" });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: relatedProductsListing of food product in admin
     Method: Post
     Authorisation: true
     Parameter:
     {
         "foodProductId":"5cc922464e46c85a7261df96",
         "page":1,
         "pagesize":1,
         "sort":{
             "price":1
         }
     }
     Return: JSON String
     ********************************************************/
    async relatedFoodProductsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            const details = await FoodProducts.findById({ _id: this.req.body.foodProductId });
            if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "Details not found" }); }
            const related = details.relatedItems;
            const result = await FoodProducts.aggregate([
                { $match: { isDeleted: false, _id: { $in: related } } },
                ...stages,
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await FoodProducts.aggregate([
                { $match: { isDeleted: false, _id: { $in: related } } },
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
    Purpose: Delete Main image of food product
    Method: Get
    Return: JSON String
    ********************************************************/
    async deleteFoodProductImage() {
        try {
            const sellerId = this.req.user;
            const foodProduct = await FoodProducts.findOne({ _id: this.req.params.foodProductId, sellerId: ObjectID(sellerId), }, { productImage: 1, imageLabel: 1 });
            if (_.isEmpty(foodProduct)) { return this.res.send({ status: 0, message: "Details not found" }); }
            const deleteImage = (foodProduct.productImage) ? foodProduct.productImage : "";
            let imagePath = '';
            if (deleteImage != '') {
                let img = deleteImage.slice(0, -4);
                for (let i = 1; i <= 3; i++) {
                    if (i === 1)
                        imagePath = 'public/products/upload/' + deleteImage
                    if (i === 2)
                        imagePath = 'public/products/upload/' + img + '-sm' + '.jpg'
                    if (i === 3)
                        imagePath = 'public/products/upload/' + img + '-th' + '.jpg'
                    fs.unlink(imagePath, (err) => { if (err) throw err; });
                }
            }
            let data = {}
            data.productImage = ''; data.imageLabel = ''
            await FoodProducts.findOneAndUpdate({ _id: this.req.params.foodProductId }, data);
            return this.res.send({ status: 1, message: "Deleted successfully" });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Update food product details by admin
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryIds": ["63e87d54916c08c8ae166caf"],
        "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
        "commissionId": "63fb2e51c05b36be844c4a5f",
        "type":"Veg",
        "name": "Oppo A74",
        "description": "product short description",
        "unitPrice": 200,
        "productImage": "Product.png",
        "imageLabel": "Main image",
        "sku": "pro-sku-1",
        "otherTaxes": 5,
        "packagingCharges": 10,
        "DeliveryCharges": 2,
        "peakCharges": 5,
        "discountPoints": 10,
        "sponserCommission": 10,
        "discountDate": {
          "from": "22/03/2023",
          "to": "22/06/2023",
        },
        "discountType": "flat",
        "discount": 10,
        "metaTitle": "meta title",
        "metaKeywords": "meta keywords",
        "metaDescription": "meta description",
        "foodProductId": "" //optional 
      }                
      Return: JSON String
  ********************************************************/
    async updateFoodProductDetailsByAdmin() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryIds", "gstCodeId", "commissionId", "name",
                "unitPrice", "discountPoints", "sponserCommission", "description",
                "productImage", "imageLabel", "metaTitle", "metaKeywords", "metaDescription", "type", "foodProductId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
            if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
            data.adminSettingsId = adminSettings._id;
            const checkCategories = await Categories.find({ _id: { $in: data.categoryIds }, isDeleted: false }, { categoryName: 1 });
            if (_.isEmpty(checkCategories) || !(checkCategories.length >= 1)) {
                return this.res.send({ status: 0, message: "Category details not found" });
            }
            const checkGSTCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false });
            if (_.isEmpty(checkGSTCode)) {
                return this.res.send({ status: 0, message: "GSTCode details not found" });
            }
            const checkCommission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false });
            if (_.isEmpty(checkCommission)) {
                return this.res.send({ status: 0, message: "Commission details not found" });
            }
            const foodProduct1 = await FoodProducts.findById(this.req.body.foodProductId);
            if (_.isEmpty(foodProduct1)) { return this.res.send({ status: 0, message: "Food Product details not found" }); }

            data.sku = foodProduct1.sku;
            data.customUrl = foodProduct1.customUrl
            const checkName = await FoodProducts.findOne({ name: data.name, _id: { $nin: [data.foodProductId] }, isDeleted: false });
            if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
            await FoodProducts.findByIdAndUpdate(data.foodProductId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Food Product updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns For Filters In food ProductListing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
       "searchText":"",
       "isAdmin":true,
        "filter":{
            "bestSeller": true,
            "newArrival": true,
            "featured": true,
            "todaysDeal": true,
            "salarChoice": true,
            "festiveOffers": true
          }
    }
    Return: JSON String
    ********************************************************/
    async foodProductFieldsList() {
        try {
            const sellerId = this.req.user;
            const sort = { _id: -1 };
            const limit = 20;
            const matchQuery = this.req.body.isAdmin ? { isDeleted: false, description: { $exists: true } } : { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };
            let query = [matchQuery]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }, { sku: regex }] })
            }
            if (this.req.body.filter) {
                query.push({ ...this.req.body.filter })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await FoodProducts.aggregate([
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

}
module.exports = FoodProductController;
