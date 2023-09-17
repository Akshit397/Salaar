const _ = require("lodash");

const Controller = require("../base");
const { GSTCodes } = require('../../models/s_gov_and_gst_code');
const { Categories } = require('../../models/s_category');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');
const RequestBody = require("../../utilities/requestBody");

const categoriesStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];

const subCategoriesStages = [
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory", "preserveNullAndEmptyArrays": true } },
];

const childCategoriesStages = [
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory", "preserveNullAndEmptyArrays": true } },
];


class GSTCodesController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update GstCode details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryId": "63e87d54916c08c8ae166caf",
        "subCategoryId":"63e87d72916c08c8ae166cb5",
        "childCategoryId":"63e87d7f916c08c8ae166cbb", 
        "gst": 18,
        "price":{
            "from":0,
            "to":1000
        },
        "code": "TEST"
        "gstCodeId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateGstCode() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryId", "gst", "price", 'code'];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const checkCategory = await Categories.findOne({ _id: data.categoryId, type: "category", isDeleted: false });
            if (_.isEmpty(checkCategory)) {
                return this.res.send({ status: 0, message: "Category details not found" });
            }
            if (data.subCategoryId) {
                const checkSubCategory = await Categories.findOne({ _id: data.subCategoryId, type: "subCategory1", isDeleted: false });
                if (_.isEmpty(checkSubCategory)) {
                    return this.res.send({ status: 0, message: "Sub-Category details not found" });
                }
            }
            if (data.childCategoryId) {
                const checkChildCategory = await Categories.findOne({ _id: data.childCategoryId, type: "subCategory2", isDeleted: false });
                if (_.isEmpty(checkChildCategory)) {
                    return this.res.send({ status: 0, message: "Child-Category details not found" });
                }
            }
            if (data.gstCodeId) {
                const checkCode = await GSTCodes.findOne({ code: data.code, _id: { $nin: [data.gstCodeId] }, isDeleted: false });
                if (!_.isEmpty(checkCode)) { return this.res.send({ status: 0, message: "Code already exists" }); }
                await GSTCodes.findByIdAndUpdate(data.gstCodeId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "GstCode updated successfully" });
            } else {
                const checkCode = await GSTCodes.findOne({ code: data.code });
                if (!_.isEmpty(checkCode)) { return this.res.send({ status: 0, message: "Code already exists" }); }
                const newGstCode = await new Model(GSTCodes).store(data);
                if (_.isEmpty(newGstCode)) {
                    return this.res.send({ status: 0, message: "GstCode details not saved" })
                }
                return this.res.send({ status: 1, message: "GstCode details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get GstCode Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getGstCodeDetails() {
        try {
            const data = this.req.params;
            if (!data.gstCodeId) {
                return this.res.send({ status: 0, message: "Please send gstCodeId" });
            }
            const GstCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('subCategoryId', { categoryName: 1 })
                .populate('childCategoryId', { categoryName: 1 });
            if (_.isEmpty(GstCode)) {
                return this.res.send({ status: 0, message: "GstCode details not found" });
            }
            return this.res.send({ status: 1, data: GstCode });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple GstCode change status
    Parameter:
    {
        "gstCodeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfGstCodes() {
        try {
            let msg = "GstCode status not updated";
            const updatedGstCodes = await GSTCodes.updateMany({ _id: { $in: this.req.body.gstCodeIds } }, { $set: { status: this.req.body.status } });
            if (updatedGstCodes) {
                msg = updatedGstCodes.modifiedCount ? updatedGstCodes.modifiedCount + " GstCode updated" : updatedGstCodes.matchedCount == 0 ? "GstCode not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete GstCode details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "gstCodeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteGstCodes() {
        try {
            if (!this.req.body.gstCodeIds) {
                return this.res.send({ status: 0, message: "Please send gstCodeIds" });
            }
            let msg = 'GstCode not deleted.';
            let status = 1;
            const updatedGstCodes = await GSTCodes.updateMany({ _id: { $in: this.req.body.gstCodeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedGstCodes) {
                msg = updatedGstCodes.modifiedCount ? updatedGstCodes.modifiedCount + ' GstCode deleted.' : updatedGstCodes.matchedCount == 0 ? "Details not found" : msg;
                status = updatedGstCodes.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: GstCodes Listing In Admin
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
    async gstCodesListing() {
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
                    $or: [{ code: regex }, { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            const result = await GSTCodes.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, code: 1, status: 1, gst: 1, price: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await GSTCodes.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
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
        "filteredFields":  ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "GST Code", "Price From", "Price To", "GST", "Status"]
     }
     Return: JSON String
     ********************************************************/
    async downloadGstCodeFiles() {
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
                ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "GST Code", "Price From", "Price To", "GST", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ code: regex }, { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            data['model'] = GSTCodes
            data['stages'] = [
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Category Name": "$category.categoryName",
                    "Sub-Category Name": "$subCategory.categoryName",
                    "Child-Category Name": "$childCategory.categoryName",
                    "GST Code": "$code",
                    GST: "$gst",
                    "Price From": '$price.from',
                    "Price To": '$price.to',
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'gstCodes'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose:Getting Dropdowns For GstCodes In Admin
   Method: Post
   Authorisation: true
   {
       "searchText":"as",
   }
   Return: JSON String
   ********************************************************/
    async gstCodesList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ code: regex }] })
            }
            const result = await GSTCodes.find({ $and: query }, { code: 1 }).sort({ _id: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = GSTCodesController;