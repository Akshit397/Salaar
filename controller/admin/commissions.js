const _ = require("lodash");

const Controller = require("../base");
const { Commissions } = require('../../models/s_category_commission');
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


class CommissionsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Commission details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryId": "63e87d54916c08c8ae166caf",
        "subCategoryId":"63e87d72916c08c8ae166cb5",
        "childCategoryId":"63e87d7f916c08c8ae166cbb", 
        "commission": 18,
        "price":{
            "from":0,
            "to":1000
        },
        "commissionId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateCommission() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryId", "commission", "price"];
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
            if (data.commissionId) {
                await Commissions.findByIdAndUpdate(data.commissionId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Commission updated successfully" });
            } else {
                const newCommission = await new Model(Commissions).store(data);
                if (_.isEmpty(newCommission)) {
                    return this.res.send({ status: 0, message: "Commission details not saved" })
                }
                return this.res.send({ status: 1, message: "Commission details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Commission Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getCommissionDetails() {
        try {
            const data = this.req.params;
            if (!data.commissionId) {
                return this.res.send({ status: 0, message: "Please send commissionId" });
            }
            const Commission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('subCategoryId', { categoryName: 1 })
                .populate('childCategoryId', { categoryName: 1 });
            if (_.isEmpty(Commission)) {
                return this.res.send({ status: 0, message: "Commission details not found" });
            }
            return this.res.send({ status: 1, data: Commission });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple Commission change status
    Parameter:
    {
        "commissionIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfCommissions() {
        try {
            let msg = "Commission status not updated";
            const updatedCommissions = await Commissions.updateMany({ _id: { $in: this.req.body.commissionIds } }, { $set: { status: this.req.body.status } });
            if (updatedCommissions) {
                msg = updatedCommissions.modifiedCount ? updatedCommissions.modifiedCount + " Commission updated" : updatedCommissions.matchedCount == 0 ? "Commission not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Commission details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "commissionIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteCommissions() {
        try {
            if (!this.req.body.commissionIds) {
                return this.res.send({ status: 0, message: "Please send commissionIds" });
            }
            let msg = 'Commission not deleted.';
            let status = 1;
            const updatedCommissions = await Commissions.updateMany({ _id: { $in: this.req.body.commissionIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedCommissions) {
                msg = updatedCommissions.modifiedCount ? updatedCommissions.modifiedCount + ' Commission deleted.' : updatedCommissions.matchedCount == 0 ? "Details not found" : msg;
                status = updatedCommissions.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Commissions Listing In Admin
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
    async commissionsListing() {
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
                    $or: [{ "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            const result = await Commissions.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, status: 1, commission: 1, price: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Commissions.aggregate([
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
        "filteredFields":  ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Commission", "Price From", "Price To", "Status"]
     }
     Return: JSON String
     ********************************************************/
    async downloadCommissionFiles() {
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
                ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Commission", "Price From", "Price To", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            data['model'] = Commissions
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
                    "Commission": "$commission",
                    "Price From": '$price.from',
                    "Price To": '$price.to',
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'Commissions'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose: Getting commissions list for specific categories
  Method: POST
     {
        "categoryId" : "6464c6954f9f83367f5ba1d9",
        "subCategoryId" : "6474d241387dca4f2eeb854d",
        "childCategoryId" : "6474d252387dca4f2eeb8553",
    } 
  Authorisation: true            
  Return: JSON String
  ********************************************************/
    async commissionsList() {
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
            const commission = await Commissions.find(query, { commission: 1 });
            return this.res.send({ status: 1, data: commission });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = CommissionsController;