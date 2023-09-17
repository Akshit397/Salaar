/** @format */

const _ = require("lodash");
const { ObjectID } = require('mongodb');
const fs = require('fs');

const Controller = require("../base");
const { Products } = require("../../models/s_products");
const { Categories } = require("../../models/s_category");
const { Brands } = require("../../models/s_brand");
const { Commissions } = require("../../models/s_category_commission");
const { Attributes } = require("../../models/s_attribute");
const { GSTCodes } = require("../../models/s_gov_and_gst_code");

const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const DownloadsController = require('../common/downloads');

const Model = require("../../utilities/model");
const { AdminSettings } = require("../../models/s_admin_settings");

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
  { $lookup: { from: "adminsettings", localField: "adminSettingsId", foreignField: "_id", as: "adminsettings" } },
  { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
];
const projection = [
  {
    $project: {
      "categories._id": "$category._id", "categories.categoryName": "$category.categoryName", "categories.type": "$category.type",
      "brand._id": "$brand._id", "brand.name": "$brand.name",
      "gstCode._id": "$gstCode._id", "gstCode.gst": "$gstCode.gst",
      otherTaxes: 1, price: {
        $sum: ["$unitPrice", "$otherTaxes"]
      },
      adminsettings: 1, discount: 1,
      discountPoints: 1, discount: 1, discountType: 1, discountDate: 1,
      length: 1, width: 1, height: 1, weight: 1, hsnCode: 1, stockWarning: 1,
      "commission._id": "$commission._id", "commission.commission": "$commission.commission",
      "seller._id": "$seller._id", "seller.fullName": "$seller.fullName",
      "store._id": "$store._id", "store.name": "$store.name",
      name: 1, productImage: 1, sku: 1, productType: 1, productDataType: 1, unitPrice: 1, stock: 1,
      createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1
    }
  },
  {
    $project: {
      categories: 1, brand: 1, gstCode: 1, productType: 1,
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
      createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1
    }
  },
  {
    $project: {
      categories: 1, brand: 1, gstCode: 1, productType: 1,
      otherTaxes: 1,
      price: 1, discountPrice: 1,
      adminsettings: 1, discount: 1,
      finalPrice: { $subtract: ["$price", "$discountPrice"] },
      commissionAmount: 1,
      gstAmount: 1,
      adminsettings: 1,
      commission: 1, seller: 1, store: 1,
      name: 1, productImage: 1, customUrl: 1, unitPrice: 1, stock: 1,
      createdAt: 1, updatedAt: 1, sponserCommission: 1, discountPoints: 1, status: 1
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
  {
    $project: {
      price: 1, discountPrice: 1, productType: 1,
      discount: 1,
      finalPrice: 1, totalPrice: 1,
      categories: 1, brand: 1, gstCode: 1, otherTaxes: 1, commissionAmount: 1, gstAmount: 1,
      commission: 1, seller: 1, store: 1, discountPoints: 1, discount: 1, discountType: 1, discountDate: 1,
      name: 1, productImage: 1, sku: 1, productDataType: 1, unitPrice: 1, stock: 1, status: 1,
      length: 1, width: 1, height: 1, weight: 1, hsnCode: 1, stockWarning: 1,
      createdAt: 1, updatedAt: 1, sponserCommission: 1,
      // netPrice: { $subtract: ["$unitPrice", { $add: ["$commissionAmount", "$sponserCommission", "$discountPoints"] }] }
    }
  }
]

class ProductsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  /********************************************************
  Purpose: Get default values of product
  Method: POST
  {
    "categoryId": "63e87d54916c08c8ae166caf",
    "subCategoryId":"63e87d72916c08c8ae166cb5",
    "childCategoryId":"63e87d7f916c08c8ae166cbb", 
  }
  Authorisation: true            
  Return: JSON String
  ********************************************************/
  async getDefaultValuesOfProduct() {
    try {
      let data = this.req.body;
      const fieldsArray = ["categoryId"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
      }
      const checkCategory = await Categories.findOne({ _id: data.categoryId, type: "category", isDeleted: false });
      if (_.isEmpty(checkCategory)) {
        return this.res.send({ status: 0, message: "Category details not found" });
      }
      let query = { categoryId: data.categoryId }
      if (data.subCategoryId) {
        const checkSubCategory = await Categories.findOne({ _id: data.subCategoryId, type: "subCategory1", isDeleted: false });
        if (_.isEmpty(checkSubCategory)) {
          return this.res.send({ status: 0, message: "Sub-Category details not found" });
        }
        query = { ...query, subCategoryId: data.subCategoryId }
      }
      if (data.childCategoryId) {
        const checkChildCategory = await Categories.findOne({ _id: data.childCategoryId, type: "subCategory2", isDeleted: false });
        if (_.isEmpty(checkChildCategory)) {
          return this.res.send({ status: 0, message: "Child-Category details not found" });
        }
        query = { ...query, childCategoryId: data.childCategoryId }
      }
      query = { ...query, isDeleted: false }
      let brandFilter = [{}];
      if (data.searchText) {
        const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
        brandFilter.push({
          $or: [
            { name: regex }
          ]
        })
      }
      const brand = await Brands.find({ $and: brandFilter, ...query }, { name: 1 });
      const gst = await GSTCodes.findOne(query, { gst: 1, code: 1 });
      const commission = await Commissions.findOne(query, { commission: 1 });
      const attributes = await Attributes.findOne(query, { unitId: 1 }).populate('unitId', { name: 1, values: 1 });
      const transactionFee = await AdminSettings.findOne({ "isDeleted": false, }, { transactionFeeGlobal: 1, transactionFeeLocal: 1 })
      return this.res.send({ status: 1, data: { brand, gst, commission, attributes, transactionFee } });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Add and update product details
    Method: Post
    Authorisation: true
    Parameter:
    {
      "categoryIds": ["63e87d54916c08c8ae166caf","63e87d72916c08c8ae166cb5","63e87d7f916c08c8ae166cbb"],
      "brandId": "63fb03bafac9103ca0a28f78",
      "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
      "commissionId": "63fb2e51c05b36be844c4a5f",
      "length":22,
      "width": 21,
      "height": 20,
      "weight": 250,
      "hsnCode":"Testing",
      "name": "Oppo A74",
      "minPurchaseQty": 1,
      "maxPurchaseQty": 5,
      "barCode": "101102",
      "sku": "pro-sku-1",
      "unitPrice": 200,
      "otherTaxes": 5,
      "discountPoints": 10,
      "sponserCommission": 10,
      "discountDate": {
        "from": "22/03/2023",
        "to": "22/06/2023",
      },
      "discountType": "flat",
      "discount": 10,
      "attributes":  [
      {
        "colourId": "643a69b9d0731c1c4a9fafe1",
        "color": "Red",
        "gallaryImages": [
          {
            "imgSequence": 1,
            "imgLabel": "image-1",
            "imgName": "img1.jpg",
          },
        ],
        "values": [{
          "size": "S", "stock": 20, "price": 220,
        },{
          "size": "M", "stock": 20, "price": 240,
        }],
      },
      {
        "colourId": "643a69b9d0731c1c4a9fafe1",
        "color": "Green",
        "gallaryImages": [
          {
            "imgSequence": 1,
            "imgLabel": "image-1",
            "imgName": "img1.jpg",
          },
        ],
        "values": [{
          "size": "S", "stock": 20, "price": 220,
        },
      {
          "size": "L", "stock": 20, "price": 220,
        }],
      },
    ],
      "stock": 100,
      "stockWarning": true,
      "description": "product short description",
      "longDescription": "product long description",
      "shippingDays": 10,
      "returnAvailability": true,
      "returnTypes": ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "returnDays": 10,
      "replacementAvailability": true,
      'replacementTypes': ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "replacementDays": 10,
      "refundAvailability": true,
      "refundAmount": 80,
      "cancellationAvailability": true,
      "cancellationCharges":10,
      "productVideoUrl": "product.webm",
      "productPdf": "product.pdf",
      "productImage": "Product.png",
      "imageLabel": "Main image",
      "gallarygallaryImages": [
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
      "temporarygallaryImages": [{ "imgName": "image1.jpg" }],
      "metaTitle": "meta title",
      "metaKeywords": "meta keywords",
      "metaDescription": "meta description",
      "productType":"Simple",
      "productDataType":"Physical",
      "bestSeller": true,
      "newArrival": true,
      "featured": true,
      "todaysDeal": true,
      "salarChoice": true,
      "festiveOffers": true,
      "productId": "" //optional 
    }               
    Return: JSON String
********************************************************/
  async addAndUpdateProduct() {
    try {
      let data = this.req.body;
      data.sellerId = this.req.user;
      const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
      if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
      data.adminSettingsId = adminSettings._id;
      if (data.productId) {
        const fieldsArray = ["categoryIds", "brandId", "gstCodeId", "commissionId", "name",
          "minPurchaseQty", "maxPurchaseQty", "barCode", "unitPrice", "discountPoints",
          "sponserCommission", "stock", "description", "longDescription", "shippingDays",
          "metaTitle", "metaKeywords", "metaDescription", "productType", "productDataType",
          "length", "width", "height", "weight", "hsnCode"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const checkCategories = await Categories.find({ _id: { $in: data.categoryIds }, isDeleted: false }, { categoryName: 1 });
        if (_.isEmpty(checkCategories) || checkCategories.length != 3) {
          return this.res.send({ status: 0, message: "Category details not found" });
        }
        const checkBrand = await Brands.findOne({ _id: data.brandId, isDeleted: false });
        if (_.isEmpty(checkBrand)) {
          return this.res.send({ status: 0, message: "Brand details not found" });
        }
        const checkGSTCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false });
        if (_.isEmpty(checkGSTCode)) {
          return this.res.send({ status: 0, message: "GSTCode details not found" });
        }
        const checkCommission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false });
        if (_.isEmpty(checkCommission)) {
          return this.res.send({ status: 0, message: "Commission details not found" });
        }
      } else {
        if (!data.name) {
          return this.res.send({ status: 0, message: "Please send name" });
        }
      }
      if (data.productId) {
        const product1 = await Products.findOne({ _id: this.req.body.productId, sellerId: data.sellerId });
        if (_.isEmpty(product1)) { return this.res.send({ status: 0, message: "Product details not found" }); }

        data.sku = product1.sku;
        data.customUrl = product1.customUrl
        const checkName = await Products.findOne({ name: data.name, _id: { $nin: [data.productId] }, isDeleted: false });
        if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
        const updatedProduct = await Products.findByIdAndUpdate(data.productId, data, { new: true, upsert: true });
        return this.res.send({ status: 1, message: "Product updated successfully", data: updatedProduct });
      } else {
        const checkName = await Products.findOne({ name: data.name });
        if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
        const productDetails = await Products.find();
        let custom = "";
        let check = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-')
        for (let i = 0; i < productDetails.length; i++) {
          custom = await Products.find({ "customUrl": check })
          if (custom.length === 0) { break; }
          else { check = check + i }
        }
        data.customUrl = check;
        let middle = "";
        let check1 = await data.name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
        for (let i = 0; i < productDetails.length; i++) {
          custom = await Products.find({ "productId": check1 })
          if (custom.length === 0) { break; }
          else { check1 = check1 + i }
        }
        if (data.name.length > 4) { middle = data.name.substring(0, 3); }
        else { middle = data.name }
        let last = productDetails.length;
        data.sku = "sku" + "-" + middle + "-" + last;
        const newProduct = await new Model(Products).store(data);
        if (_.isEmpty(newProduct)) {
          return this.res.send({ status: 0, message: "Product details not saved" })
        }
        return this.res.send({ status: 1, message: "Product details added successfully", data: newProduct });
      }
    }
    catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }

  /********************************************************
 Purpose: Get Product Details
 Method: GET
 Authorisation: true            
 Return: JSON String
 ********************************************************/
  async getProductDetails() {
    try {
      const data = this.req.params;
      if (!data.productId) {
        return this.res.send({ status: 0, message: "Please send productId" });
      }
      const productDetails = await Products.findOne({ _id: data.productId, isDeleted: false }, { _v: 0 })
        .populate('categoryIds', { categoryName: 1, type: 1 })
        .populate('brandId', { name: 1 })
        .populate('gstCodeId', { gst: 1, price: 1 })
        .populate('commissionId', { commission: 1, price: 1 })
        .populate('sellerId', { fullName: 1 })
        .populate('returnTypes', { name: 1 })
        .populate('adminSettingsId', { transactionFeeGlobal: 1, transactionFeeLocal: 1 })
        .populate('replacementTypes', { name: 1 })
      if (_.isEmpty(productDetails)) {
        return this.res.send({ status: 0, message: "Product details not found" });
      }
      return this.res.send({ status: 1, data: productDetails });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: single and multiple change status
  Parameter:
  {
      "productIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
      "status":true,
      "isAdmin": true
  }
  Return: JSON String
  ********************************************************/
  async changeStatusOfProducts() {
    try {
      const sellerId = this.req.user;
      let msg = "Product status not updated";
      const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.productIds } } : { _id: { $in: this.req.body.productIds }, sellerId: ObjectID(sellerId) };
      const updatedProducts = await Products.updateMany(query, { $set: { status: this.req.body.status } });
      if (updatedProducts) {
        msg = updatedProducts.modifiedCount ? updatedProducts.modifiedCount + " Product updated" : updatedProducts.matchedCount == 0 ? "Product not exists" : msg;
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
     "productIds":["5c9df24382ddca1298d855bb"],
      "isAdmin": true
 }  
 Return: JSON String
 ********************************************************/
  async deleteProducts() {
    try {
      const sellerId = this.req.user;
      if (!this.req.body.productIds) {
        return this.res.send({ status: 0, message: "Please send productIds" });
      }
      let msg = 'Product not deleted.';
      let status = 1;
      const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.productIds }, isDeleted: false } : { _id: { $in: this.req.body.productIds }, sellerId: ObjectID(sellerId), isDeleted: false };

      const updatedProducts = await Products.updateMany(query, { $set: { isDeleted: true } });
      if (updatedProducts) {
        msg = updatedProducts.modifiedCount ? updatedProducts.modifiedCount + ' Product deleted.' : updatedProducts.matchedCount == 0 ? "Details not found" : msg;
        status = updatedProducts.matchedCount == 0 ? 0 : 1
      }
      return this.res.send({ status, message: msg });

    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Products Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2023-10-25",
        "searchText": "long",
        "productType":"Simple",
        "productDataType":"Physical",
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
  async productsListing() {
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
      if (data.productType) {
        query.push({ productType: data.productType })
      }
      if (data.productDataType) {
        query.push({ productDataType: data.productDataType })
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
            { name: regex }, { description: regex }, { hsnCode: regex }, { longDescription: regex },
            { productId: regex }, { productType: regex }, { productDataType: regex }, { 'category.categoryName': regex },
            { 'brand.name': regex }, { 'seller.fullName': regex }, { 'store.name': regex }
          ]
        })
      }
      const matchQuery = this.req.body.isAdmin ? {
        isDeleted: false, description: { $exists: true }
      } : { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };

      console.log(`query: ${JSON.stringify(query)}`)
      const result = await Products.aggregate([
        { $match: matchQuery },
        ...stages,
        { $match: { $and: query } },
        ...projection,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Products.aggregate([
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
        "productType":"Simple",
        "productDataType":"Physical",
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
        "filteredFields":["Date", "Product Name", "Product Image", "Product Id", "Product Type","Product Data Type", "Unit Price", "Stock", "Status", "Categories", "Brand", "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Total Price", "Updated Date"]
    }
   Return: JSON String
   ********************************************************/
  async downloadProductFiles() {
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
      if (data.productType) {
        query.push({ productType: data.productType })
      }
      if (data.productDataType) {
        query.push({ productDataType: data.productDataType })
      }
      if (data.status) {
        query.push({ status: data.status })
      }
      if (data.filter) {
        query.push({ ...data.filter })
      }
      data.filteredFields = data.filteredFields ? data.filteredFields :
        ["Date", "Product Name", "Product Image", "Product Id", "Product Type", "Product Data Type", "Unit Price", "Stock", "Status", "Categories", "Brand", "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Net Price", "Updated Date"]
      if (data.searchText) {
        const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
        query.push({
          $or: [
            { name: regex }, { description: regex }, { hsnCode: regex }, { longDescription: regex },
            { productId: regex }, { productType: regex }, { productDataType: regex }, { 'category.categoryName': regex },
            { 'brand.name': regex }, { 'seller.fullName': regex }, { 'store.name': regex }
          ]
        })
      }
      const matchQuery = this.req.body.isAdmin ? { isDeleted: false, description: { $exists: true } } :
        { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };

      data['model'] = Products;
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
          "Product Id": '$productId',
          "Product Type": "$productType",
          "Product Data Type": "$productDataType",
          "Unit Price": "$unitPrice",
          "Stock": "$stock",
          "Status": "$status",
          "Categories": "$categories.categoryName",
          "Brand": "$brand.name",
          "GST Percentage": "$gstCode.gst",
          "GST Amount": "$gstAmount",
          "Other Taxes": "$otherTaxes",
          "Commission Percentage": "$commission.commission",
          "Commission Amount": "$commissionAmount",
          "Seller Name": "$seller.fullName",
          "Store Name": "$store.name",
          "Sponser Commission": "$sponserCommission",
          "Final Price": "$finalPrice",
          "Total Price": "$totalPrice",
          "Updated Date": { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt", timezone: "Asia/Kolkata" } },
        }
      }];
      data['key'] = 'createdAt';
      data['query'] = matchQuery;
      data['filterQuery'] = {}
      data['fileName'] = 'products'

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
       "productId":"6402ed51f0c082f623a4683d",
       "ids":["6402ed58f0c082f623a4685a"]
   }
   Return: JSON String
   ********************************************************/
  async deleteRelatedProduct() {
    try {
      const details = await Products.findById({ _id: this.req.body.productId });
      const arr = details.relatedItems;
      const productIds = this.req.body.ids;
      for (let i = 0; i < productIds.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          if (arr[j].toString() === productIds[i]) { arr.splice(j, 1) }
        }
      }
      let data = {}
      data.relatedItems = arr;
      await Products.findByIdAndUpdate(this.req.body.productId, data)
      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: relatedProductsListing of product in admin
   Method: Post
   Authorisation: true
   Parameter:
   {
       "productId":"5cc922464e46c85a7261df96",
       "page":1,
       "pagesize":1,
       "sort":{
           "price":1
       }
   }
   Return: JSON String
   ********************************************************/
  async relatedProductsListing() {
    try {
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      const details = await Products.findById({ _id: this.req.body.productId });
      if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "Details not found" }); }
      const related = details.relatedItems;
      const result = await Products.aggregate([
        { $match: { isDeleted: false, _id: { $in: related } } },
        ...stages,
        ...projection,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Products.aggregate([
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
  Purpose: Delete additional gallaryImages of products
  Method: Post
  Authorisation: true
  Parameter:
  {
      "productId":"5d4d25364418020e6056fe6f",
      "imageId":"5d50ff28b380220f7240167e"
  }
  Return: JSON String
  ********************************************************/
  async deleteAdditionalGallaryImages() {
    try {
      const sellerId = this.req.user;
      const product = await Products.findOne({
        _id: ObjectID(this.req.body.productId),
        sellerId: ObjectID(sellerId), "tempImgArr._id": ObjectID(this.req.body.imageId)
      },
        { "tempImgArr": 1, sku: 1, productType: 1 });
      console.log(`product: ${JSON.stringify(product)}`)
      if (_.isEmpty(product)) {
        return this.res.send({ status: 0, message: "Product details not found" });
      }
      const tempImgArr = product.tempImgArr.find(key => {
        return key._id == this.req.body.imageId
      })
      console.log(`tempImgArr: ${JSON.stringify(tempImgArr)}`)
      const deleteImage = tempImgArr.imgName;
      let imagePath = '';
      const sku = product.sku;
      const img = deleteImage.split(sku);
      const ext = img[1].slice(0, -4);
      if (deleteImage != undefined) {
        for (let i = 1; i <= 3; i++) {
          if (i === 1)
            imagePath = 'public/products/upload/' + deleteImage
          if (i === 2)
            imagePath = 'public/products/upload/' + sku + ext + '-sm' + '.jpg'
          if (i === 3)
            imagePath = 'public/products/upload/' + sku + ext + '-th' + '.jpg'
          fs.unlink(imagePath, (err) => { if (err) throw err; });
        }
      }
      await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { tempImgArr: { _id: ObjectID(this.req.body.imageId) } } });
      if (product.productType == 'Simple') {
        const product1 = await Products.findOne({ _id: ObjectID(this.req.body.productId), "gallaryImages.imgName": deleteImage });
        if (!_.isEmpty(product1)) {
          await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { gallaryImages: { imgName: deleteImage } } });
        }
      } else {
        await Products.findOneAndUpdate({ _id: this.req.body.productId },
          { $pull: { "attributes.$[].values.$[].gallaryImages": { imgName: deleteImage } } });
      }

      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
  Purpose: Delete Main image of product
  Method: Get
  Return: JSON String
  ********************************************************/
  async deleteProductImage() {
    try {
      const sellerId = this.req.user;
      const product = await Products.findOne({ _id: this.req.params.productId, sellerId: ObjectID(sellerId), }, { productImage: 1, imageLabel: 1 });
      if (_.isEmpty(product)) { return this.res.send({ status: 0, message: "Details not found" }); }
      const deleteImage = (product.productImage) ? product.productImage : "";
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
      await Products.findOneAndUpdate({ _id: this.req.params.productId }, data);
      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Update product details by admin
    Method: Post
    Authorisation: true
    Parameter:
    {
      "categoryIds": ["63e87d54916c08c8ae166caf","63e87d72916c08c8ae166cb5","63e87d7f916c08c8ae166cbb"],
      "brandId": "63fb03bafac9103ca0a28f78",
      "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
      "commissionId": "63fb2e51c05b36be844c4a5f",
      "hsnCode":"Testing",
      "length":22,
      "width": 21,
      "height": 20,
      "weight": 250,
      "name": "Oppo A74",
      "minPurchaseQty": 1,
      "maxPurchaseQty": 5,
      "barCode": "101102",
      "sku": "pro-sku-1",
      "unitPrice": 200,
      "otherTaxes": 5,
      "discountPoints": 10,
      "sponserCommission": 10,
      "discountDate": {
        "from": "22/03/2023",
        "to": "22/06/2023",
      },
      "discountType": "flat",
      "discount": 10,
      "attributes": [{
        "unit": "63fb0d722ae4f74a0dfd0cd5",
        "type": "size",
        "value": ["S", "M"]
      }],
      "stock": 100,
      "stockWarning": true,
      "description": "product short description",
      "longDescription": "product long description",
      "shippingDays": 10,
      "returnAvailability": true,
      "returnTypes": ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "returnDays": 10,
      "replacementAvailability": true,
      'replacementTypes': ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "replacementDays": 10,
      "refundAvailability": true,
      "refundAmount": 80,
      "cancellationAvailability": true,
      "cancellationCharges":10,
      "productVideoUrl": "product.webm",
      "productPdf": "product.pdf",
      "productImage": "Product.png",
      "imageLabel": "Main image",
      "gallarygallaryImages": [
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
      "temporarygallaryImages": [{ "imgName": "image1.jpg" }],
      "metaTitle": "meta title",
      "metaKeywords": "meta keywords",
      "metaDescription": "meta description",
      "productType":"simple",
      "productDataType":"Physical",
      "bestSeller": true,
      "newArrival": true,
      "featured": true,
      "todaysDeal": true,
      "salarChoice": true,
      "festiveOffers": true
      "productId": "" //optional 
    }               
    Return: JSON String
********************************************************/
  async updateProductDetailsByAdmin() {
    try {
      let data = this.req.body;
      const fieldsArray = ["categoryIds", "brandId", "gstCodeId", "commissionId", "name",
        "minPurchaseQty", "maxPurchaseQty", "barCode", "unitPrice", "discountPoints",
        "sponserCommission", "stock", "description", "longDescription", "shippingDays",
        "productImage", "imageLabel", "metaTitle", "metaKeywords", "metaDescription", "productType",
        "productDataType", "productId", "length", "width", "height", "weight", "hsnCode"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
      }
      const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
      if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
      data.adminSettingsId = adminSettings._id;
      const checkCategories = await Categories.find({ _id: { $in: data.categoryIds }, isDeleted: false }, { categoryName: 1 });
      if (_.isEmpty(checkCategories) || checkCategories.length != 3) {
        return this.res.send({ status: 0, message: "Category details not found" });
      }
      const checkBrand = await Brands.findOne({ _id: data.brandId, isDeleted: false });
      if (_.isEmpty(checkBrand)) {
        return this.res.send({ status: 0, message: "Brand details not found" });
      }
      const checkGSTCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false });
      if (_.isEmpty(checkGSTCode)) {
        return this.res.send({ status: 0, message: "GSTCode details not found" });
      }
      const checkCommission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false });
      if (_.isEmpty(checkCommission)) {
        return this.res.send({ status: 0, message: "Commission details not found" });
      }
      const product1 = await Products.findById(this.req.body.productId);
      if (_.isEmpty(product1)) { return this.res.send({ status: 0, message: "Product details not found" }); }

      data.sku = product1.sku;
      data.customUrl = product1.customUrl
      const checkName = await Products.findOne({ name: data.name, _id: { $nin: [data.productId] }, isDeleted: false });
      if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
      await Products.findByIdAndUpdate(data.productId, data, { new: true, upsert: true });
      return this.res.send({ status: 1, message: "Product updated successfully" });
    }
    catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }

  /********************************************************
  Purpose:Getting Dropdowns For Filters In ProductListing In Admin
  Method: Post
  Authorisation: false
  Parameter:
  {
     "searchText":"",
     "categoryIds":[""],
     "sellerId": "",
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
  async productFieldsList() {
    try {
      const data = this.req.body;
      const sort = { _id: -1 };
      const limit = 20;
      const matchQuery = { isDeleted: false, description: { $exists: true } };
      let query = [matchQuery]
      if (data.searchText) {
        const regex = { $regex: `.*${data.searchText}.*`, $options: 'i' };
        query.push({ $or: [{ name: regex }, { sku: regex }] })
      }
      if (data.categoryIds && data.categoryIds.length > 0) {
        data.categoryIds = await data.categoryIds.map(res => {
          return ObjectID(res)
        })
        query.push({ categoryIds: { $in: data.categoryIds } })
      }
      if (data.sellerId) {
        query.push({ sellerId: ObjectID(data.sellerId) })
      }
      if (data.filter) {
        query.push({ ...data.filter })
      }
      console.log(`query: ${JSON.stringify(query)}`)
      const result = await Products.aggregate([
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
module.exports = ProductsController;
