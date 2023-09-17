const _ = require("lodash");

const Controller = require("../base");
const { SellerNetworkCategories } = require('../../models/s_seller_network_category_settings');
const { Categories } = require('../../models/s_category');
const { Commissions } = require('../../models/s_category_commission');
const { SellerNetworkSettings } = require('../../models/s_seller_network_settings');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');

const stages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "commissions", localField: "commissionId", foreignField: "_id", as: "commission" } },
    { $unwind: { "path": "$commission", "preserveNullAndEmptyArrays": true } },
];

class SellerNetworkCategoriesController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add and update Seller network category details
    Method: Post
    Authorisation: true
    Parameter:
    For ecommerce and food network categories
    {
        "type":"Normal",
        "categoryId": "63e87d54916c08c8ae166caf",
        "subCategoryId":"63e87d72916c08c8ae166cb5",
        "childCategoryId":"63e87d7f916c08c8ae166cbb", 
        "price":{
            "from":0,
            "to":1000
        },
        "commissionId": "63fb2e51c05b36be844c4a5f",
        "teamIncomePercentage": 50,
        "ulDownlinePercentage": 50,
        "otherTaxes": 100,
        "isEcommerce":true (or) "isFood": true
        "sellerNetworkCategoryId": "" //optional 
    }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateSellerNetworkCategory() {
        try {
            let data = this.req.body;
            const fieldsArray = ["type", "price", "teamIncomePercentage", "ulDownlinePercentage",
                "otherTaxes", "commissionId", "categoryId"]

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
            const checkCommissions = await Commissions.findOne({ ...query, _id: data.commissionId, isDeleted: false });
            if (_.isEmpty(checkCommissions)) {
                return this.res.send({ status: 0, message: "Commission details not found" });
            }
            if (data.sellerNetworkCategoryId) {
                await SellerNetworkCategories.findByIdAndUpdate(data.sellerNetworkCategoryId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Seller network category details updated successfully" });
            } else {
                // Generating NCNumber
                const randomText =
                    (await this.commonService.randomGenerator(2, "number")) +
                    (await this.commonService.randomGenerator(1, "capital")) +
                    (await this.commonService.randomGenerator(2, "number"));
                let count = await SellerNetworkCategories.count();
                if (count <= 8) {
                    count = "0" + (count + 1);
                }
                data["NCNumber"] = "SNC" + randomText + count;
                const newNetworkCategory = await new Model(SellerNetworkCategories).store(data);
                if (_.isEmpty(newNetworkCategory)) {
                    return this.res.send({ status: 0, message: "Seller network category details not saved" })
                }
                return this.res.send({ status: 1, message: "Seller network category details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get NetworkCategory Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getSellerNetworkCategoryDetails() {
        try {
            const data = this.req.params;
            if (!data.sellerNetworkCategoryId) {
                return this.res.send({ status: 0, message: "Please send sellerNetworkCategoryId" });
            }
            const networkCategory = await SellerNetworkCategories.findOne({ _id: data.sellerNetworkCategoryId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('subCategoryId', { categoryName: 1 })
                .populate('childCategoryId', { categoryName: 1 })
                .populate('commissionId', { commission: 1, price: 1 })
            if (_.isEmpty(networkCategory)) {
                return this.res.send({ status: 0, message: "Seller network category details not found" });
            }
            return this.res.send({ status: 1, data: networkCategory });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple SellerNetworkCategories change status
 Parameter:
 {
    "sellerNetworkCategoryIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfSellerNetworkCategories() {
        try {
            let msg = "Seller network category status not updated";
            const updatedSellerNetworkCategories = await SellerNetworkCategories.updateMany({ _id: { $in: this.req.body.sellerNetworkCategoryIds } }, { $set: { status: this.req.body.status } });
            if (updatedSellerNetworkCategories) {
                msg = updatedSellerNetworkCategories.modifiedCount ? updatedSellerNetworkCategories.modifiedCount + " Seller network category updated" : updatedSellerNetworkCategories.matchedCount == 0 ? "Seller network category not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete NetworkCategory details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "sellerNetworkCategoryIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteSellerNetworkCategories() {
        try {
            if (!this.req.body.sellerNetworkCategoryIds) {
                return this.res.send({ status: 0, message: "Please send sellerNetworkCategoryIds" });
            }
            let msg = 'Seller network category not deleted.';
            let status = 1;
            const updatedSellerNetworkCategories = await SellerNetworkCategories.updateMany({ _id: { $in: this.req.body.sellerNetworkCategoryIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedSellerNetworkCategories) {
                msg = updatedSellerNetworkCategories.modifiedCount ? updatedSellerNetworkCategories.modifiedCount + ' Seller network category deleted.' : updatedSellerNetworkCategories.matchedCount == 0 ? "Details not found" : msg;
                status = updatedSellerNetworkCategories.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: SellerNetworkCategories Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": "",
           "filter":{
                "isFood": false,
                "isEcommerce": true
            },
      }
      Return: JSON String
      ********************************************************/
    async sellerNetworkCategoriesListing() {
        try {
            const data = this.req.body;
            if (!data.filter) {
                return this.res.send({ status: 0, message: "Please send filter details" });
            }
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }

            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ type: regex }, { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }] })
            }
            const projection = [
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "otherTaxes": 1, "commissionPercentage": "$commission.commission",
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commission.commission", 100]
                                }, "$commission.price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commission.commission", 100]
                                }, "$commission.price.to"]
                            },
                        },
                        "price": "$commission.price"

                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1, ulDownlinePercentage: 1, otherTaxes: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$otherTaxes"]

                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        ulDownlinePercentage: 1,
                        otherTaxes: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", sellerNetworkSettings.depth] },
                        leftAmount: { $subtract: ["$otherTaxes", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlinePercentage: 1, otherTaxes: 1,
                        ulDownlineAmount: {
                            $multiply: [{
                                $divide: ["$ulDownlinePercentage", 100]
                            }, "$leftAmount"]
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlinePercentage: 1, otherTaxes: 1,
                        ulDownlineAmount: 1,
                        ulDownlinePerPerson: { $divide: ["$ulDownlineAmount", sellerNetworkSettings.width] },
                        remainingAmount: { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            const result = await SellerNetworkCategories.aggregate([
                { $match: { isDeleted: false, ...data.filter } },
                ...stages,
                { $match: { $and: query } },
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await SellerNetworkCategories.aggregate([
                { $match: { isDeleted: false, ...data.filter } },
                ...stages,
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
          "filteredFields": [] ,
          "filter":{
            "isEcommerce": true,
            "isFood": false
          }
      }
     Return: JSON String
     ********************************************************/
    async downloadSellerNetworkCategoryFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            if (!data.filter) {
                return this.res.send({ status: 0, message: "Please send filter details" });
            }
            let query = [{}];
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            const fields = ["Date", "NCNumber", "Type", "Price", "Category Name", "Sub-Category Name", "Child-Category Name",
                "Company Commission Percentage", "Company Commission Amount", "Other Taxes", "Seller Team Income Percentage",
                "Seller Team Income Amount", "Seller Team Income Per Person", "Left Amount",
                "Seller UL Downline Percentage", "Seller UL Downline Amount", "Seller UL Downline Per Person", "Remaining Amount"]
            data.filteredFields = data.filteredFields ? data.filteredFields : fields
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ type: regex }, { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }] })
            }
            const projection = [
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "otherTaxes": 1, "commissionPercentage": "$commission.commission",
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commission.commission", 100]
                                }, "$commission.price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commission.commission", 100]
                                }, "$commission.price.to"]
                            },
                        },
                        "price": "$commission.price"

                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1, ulDownlinePercentage: 1, otherTaxes: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$otherTaxes"]

                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        ulDownlinePercentage: 1,
                        otherTaxes: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", sellerNetworkSettings.depth] },
                        leftAmount: { $subtract: ["$otherTaxes", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlinePercentage: 1, otherTaxes: 1,
                        ulDownlineAmount: {
                            $multiply: [{
                                $divide: ["$ulDownlinePercentage", 100]
                            }, "$leftAmount"]
                        },
                    }
                },
                {
                    $project: {
                        Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        NCNumber: 1,
                        "Type": "$type",
                        "Price": "$price",
                        "Category Name": "$category.categoryName",
                        "Sub-Category Name": "$subCategory.categoryName",
                        "Child-Category Name": "$childCategory.categoryName",
                        "Company Commission Percentage": "$commissionPercentage",
                        "Company Commission Amount": "$commissionAmount",
                        "Other Taxes": "$otherTaxes",
                        "Seller Team Income Percentage": "$teamIncomePercentage",
                        "Seller Team Income Amount": "$teamIncomeAmount",
                        "Seller Team Income Per Person": "$teamIncomePerPerson",
                        "Left Amount": "$leftAmount",
                        "Seller UL Downline Percentage": "$ulDownlinePercentage",
                        "Seller UL Downline Amount": "$ulDownlineAmount",
                        "Seller UL Downline Per Person": { $divide: ["$ulDownlineAmount", sellerNetworkSettings.width] },
                        "Remaining Amount": { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            data['model'] = SellerNetworkCategories;
            data['stages'] = [...stages, { $match: { $and: query } },];
            data['projectData'] = projection;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, ...data.filter };
            data['filterQuery'] = {}
            data['fileName'] = 'seller-network-categories'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = SellerNetworkCategoriesController;