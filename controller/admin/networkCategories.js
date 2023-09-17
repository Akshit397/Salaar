const _ = require("lodash");

const Controller = require("../base");
const { NetworkCategories } = require('../../models/s_network_category_settings');
const { Categories } = require('../../models/s_category');
const { Commissions } = require('../../models/s_category_commission');
const { TravelTypes } = require('../../models/s_travel_types');
const { Recharges } = require('../../models/s_recharges');
const { TeamLevels } = require('../../models/s_team_levels');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');

const ecomFoodStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "commissions", localField: "commissionId", foreignField: "_id", as: "commission" } },
    { $unwind: { "path": "$commission", "preserveNullAndEmptyArrays": true } },
];
const travelStages = [
    { $lookup: { from: "traveltypes", localField: "travelCategoryId", foreignField: "_id", as: "travelCategory" } },
    { $unwind: { "path": "$travelCategory", "preserveNullAndEmptyArrays": true } },
];
const billStages = [
    { $lookup: { from: "recharges", localField: "billCategoryId", foreignField: "_id", as: "billCategory" } },
    { $unwind: { "path": "$billCategory", "preserveNullAndEmptyArrays": true } },
];

class NetworkCategoriesController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
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
    async getCommissionOfCategories() {
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
            const commission = await Commissions.find(query, { commission: 1, price: 1 });
            return this.res.send({ status: 1, data: commission });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Add and update Network Category details
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
        "convenienceFee": 100,
        "isEcommerce":true (or) "isFood": true
        "networkCategoryId": "" //optional 
    }    
     For travel network categories
    {
        "type":"Normal",
        "travelCategoryId":"64049000158fb064e8a24807",
        "travelType":"ALL" 
        "price":{
            "from":0,
            "to":1000
        },
        "commissionPercentage": 10,
        "teamIncomePercentage": 50,
        "ulDownlinePercentage": 50,
        "convenienceFee": 100,
        "sponserCommission": 100
        "isTravel":true, 
        "networkCategoryId": "" //optional 
    }     
    For bill network categories
    {
        "type":"Normal",
        "billCategoryId":"6404909411a34e74b4dbe390",
        "brand":"Airtel"
        "price":{
            "from":0,
            "to":1000
        },
        "commissionPercentage": 10,
        "teamIncomePercentage": 50,
        "ulDownlinePercentage": 50,
        "convenienceFee": 100,
        "sponserCommission": 100
        "isBill":true ,
        "networkCategoryId": "" //optional 
    }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateNetworkCategory() {
        try {
            let data = this.req.body;
            const fieldsArray = ["type", "price", "teamIncomePercentage", "ulDownlinePercentage", "convenienceFee"];
            const finalFieldsArray = data.isEcommerce || data.isFood ? [...fieldsArray, "commissionId", "categoryId"] :
                (data.isTravel ? [...fieldsArray, "travelCategoryId", "travelType", "sponserCommission", "commissionPercentage"] :
                    [...fieldsArray, "billCategoryId", "brand", "sponserCommission", "commissionPercentage"])
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, finalFieldsArray);

            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }

            if (data.isEcommerce || data.isFood) {
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
            }
            if (data.isTravel) {
                const checkTravel = await TravelTypes.findOne({ _id: data.travelCategoryId, isDeleted: false });
                if (_.isEmpty(checkTravel)) {
                    return this.res.send({ status: 0, message: "Travel type details not found" });
                }
            }
            if (data.isBill) {
                const checkRecharge = await Recharges.findOne({ _id: data.billCategoryId, isDeleted: false });
                if (_.isEmpty(checkRecharge)) {
                    return this.res.send({ status: 0, message: "Recharge details not found" });
                }
            }
            if (data.networkCategoryId) {
                await NetworkCategories.findByIdAndUpdate(data.networkCategoryId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Network Category details updated successfully" });
            } else {
                // Generating NCNumber
                const randomText =
                    (await this.commonService.randomGenerator(2, "number")) +
                    (await this.commonService.randomGenerator(1, "capital")) +
                    (await this.commonService.randomGenerator(2, "number"));
                let count = await NetworkCategories.count();
                if (count <= 8) {
                    count = "0" + (count + 1);
                }
                data["NCNumber"] = "NC" + randomText + count;
                const newNetworkCategory = await new Model(NetworkCategories).store(data);
                if (_.isEmpty(newNetworkCategory)) {
                    return this.res.send({ status: 0, message: "Network Category details not saved" })
                }
                return this.res.send({ status: 1, message: "Network Category details added successfully" });
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
    async getNetworkCategoryDetails() {
        try {
            const data = this.req.params;
            if (!data.networkCategoryId) {
                return this.res.send({ status: 0, message: "Please send networkCategoryId" });
            }
            const networkCategory = await NetworkCategories.findOne({ _id: data.networkCategoryId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('subCategoryId', { categoryName: 1 })
                .populate('childCategoryId', { categoryName: 1 })
                .populate('travelCategoryId', { name: 1 })
                .populate('billCategoryId', { name: 1 })
                .populate('commissionId', { commission: 1, price: 1 })
            if (_.isEmpty(networkCategory)) {
                return this.res.send({ status: 0, message: "Network Category details not found" });
            }
            return this.res.send({ status: 1, data: networkCategory });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple NetworkCategories change status
 Parameter:
 {
    "networkCategoryIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfNetworkCategories() {
        try {
            let msg = "Network Category status not updated";
            const updatedNetworkCategories = await NetworkCategories.updateMany({ _id: { $in: this.req.body.networkCategoryIds } }, { $set: { status: this.req.body.status } });
            if (updatedNetworkCategories) {
                msg = updatedNetworkCategories.modifiedCount ? updatedNetworkCategories.modifiedCount + " Network Category updated" : updatedNetworkCategories.matchedCount == 0 ? "Network Category not exists" : msg;
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
       "networkCategoryIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteNetworkCategories() {
        try {
            if (!this.req.body.networkCategoryIds) {
                return this.res.send({ status: 0, message: "Please send networkCategoryIds" });
            }
            let msg = 'Network Category not deleted.';
            let status = 1;
            const updatedNetworkCategories = await NetworkCategories.updateMany({ _id: { $in: this.req.body.networkCategoryIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedNetworkCategories) {
                msg = updatedNetworkCategories.modifiedCount ? updatedNetworkCategories.modifiedCount + ' Network Category deleted.' : updatedNetworkCategories.matchedCount == 0 ? "Details not found" : msg;
                status = updatedNetworkCategories.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: NetworkCategories Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-10-25",
          "searchText": "",
           "filter":{
                "isFood": false,
                "isEcommerce": true,
                "isTravel": false,
                "isBill": false
            },
      }
      Return: JSON String
      ********************************************************/
    async networkCategoriesListing() {
        try {
            const data = this.req.body;
            if (!data.filter) {
                return this.res.send({ status: 0, message: "Please send filter details" });
            }
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            let teamLevels = await TeamLevels.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(teamLevels)) {
                teamLevels.depth = 1;
                teamLevels.width = 1;
            }
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }

            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                const array = data.filter.isEcommerce || data.filter.isFood ?
                    [{ "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }] :
                    (data.filter.isTravel ?
                        [{ travelType: regex }, { "travelCategory.name": regex }] :
                        [{ brand: regex }, { "billCategory.name": regex }])
                query.push({ $or: [{ NCNumber: regex }, { type: regex }, ...array] })
            }
            const stages = data.filter.isEcommerce || data.filter.isFood ? ecomFoodStages :
                data.filter.isTravel ? travelStages : billStages;
            const ecomFoodProjection = [
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "commissionPercentage": "$commission.commission",
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
                        teamIncomePercentage: 1,
                        teamIncomeAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$teamIncomePercentage", 100]
                                }, "$commissionAmount.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$teamIncomePercentage", 100]
                                }, "$commissionAmount.to"]
                            },
                        },
                        ulDownlinePercentage: 1, convenienceFee: 1
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: {
                            from: { $divide: ["$teamIncomeAmount.from", teamLevels.depth] },
                            to: { $divide: ["$teamIncomeAmount.to", teamLevels.depth] }
                        },
                        leftAmount: {
                            from: { $subtract: ["$commissionAmount.from", "$teamIncomeAmount.from"] },
                            to: { $subtract: ["$commissionAmount.to", "$teamIncomeAmount.to"] }
                        },
                        ulDownlinePercentage: 1,
                        convenienceFee: 1
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
                        ulDownlinePercentage: 1, convenienceFee: 1,
                        ulDownlineAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$ulDownlinePercentage", 100]
                                }, "$leftAmount.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$ulDownlinePercentage", 100]
                                }, "$leftAmount.to"]
                            },
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
                        ulDownlinePercentage: 1, convenienceFee: 1,
                        ulDownlineAmount: 1,
                        ulDownlinePerPerson: {
                            from: { $divide: ["$ulDownlineAmount.from", teamLevels.width] },
                            to: { $divide: ["$ulDownlineAmount.to", teamLevels.width] }
                        },
                        remainingAmount: {
                            from: { $subtract: ["$leftAmount.from", "$ulDownlineAmount.from"] },
                            to: { $subtract: ["$leftAmount.to", "$ulDownlineAmount.to"] }
                        },
                    }
                }
            ]
            const travelProjection = [
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1, "travelCategory._id": "$travelCategory._id", "travelCategory.name": "$travelCategory.name",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1,
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.to"]
                            },
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$sponserCommission"]

                        },

                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", teamLevels.depth] },
                        leftAmount: { $subtract: ["$sponserCommission", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlineAmount: {
                            $multiply: [{
                                $divide: ["$ulDownlinePercentage", 100]
                            }, "$leftAmount"]
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlineAmount: 1,
                        ulDownlinePerPerson: { $divide: ["$ulDownlineAmount", teamLevels.width] },
                        remainingAmount: { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            const billProjection = [
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, "billCategory._id": "$billCategory._id", "billCategory.name": "$billCategory.name",

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1,
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.to"]
                            },
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$sponserCommission"]

                        },

                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", teamLevels.depth] },
                        leftAmount: { $subtract: ["$sponserCommission", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlineAmount: {
                            $multiply: [{
                                $divide: ["$ulDownlinePercentage", 100]
                            }, "$leftAmount"]
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
                        ulDownlineAmount: 1,
                        ulDownlinePerPerson: { $divide: ["$ulDownlineAmount", teamLevels.width] },
                        remainingAmount: { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            const projection = data.filter.isEcommerce || data.filter.isFood ? ecomFoodProjection :
                data.filter.isTravel ? travelProjection : billProjection;
            const result = await NetworkCategories.aggregate([
                { $match: { isDeleted: false, ...data.filter } },
                ...stages,
                { $match: { $and: query } },
                ...projection,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await NetworkCategories.aggregate([
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
            "isEcommerce": true
          }
      }
     Return: JSON String
     ********************************************************/
    async downloadNetworkCategoryFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            if (!data.filter) {
                return this.res.send({ status: 0, message: "Please send filter details" });
            }
            let query = [{}];
            let teamLevels = await TeamLevels.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(teamLevels)) {
                teamLevels.depth = 1;
                teamLevels.width = 1;
            }
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            const fields = data.filter.isEcommerce || data.filter.isFood ? ["Date", "NCNumber", "Type", "Price", "Category Name", "Sub-Category Name", "Child-Category Name",
                "Commission Percentage", "Commission Amount", "Team Income Percentage", "Team Income Amount",
                "Team Income Per Person", "Left Amount", "UL Downline Percentage", "UL Downline Amount", "UL Downline Per Person",
                "Convenience Fee", "Remaining Amount"] : data.filter.isTravel ?
                ["Date", "NCNumber", "Type", "Price", "Travel Name", "Travel Type", "Sponser Commission",
                    "Commission Percentage", "Commission Amount", "Team Income Percentage", "Team Income Amount",
                    "Team Income Per Person", "Left Amount", "UL Downline Percentage", "UL Downline Amount", "UL Downline Per Person",
                    "Convenience Fee", "Remaining Amount"
                ] : ["Date", "NCNumber", "Type", "Price", "Bill Category Name", "Brand", "Sponser Commission",
                    "Commission Percentage", "Commission Amount", "Team Income Percentage", "Team Income Amount",
                    "Team Income Per Person", "Left Amount", "UL Downline Percentage", "UL Downline Amount", "UL Downline Per Person",
                    "Convenience Fee", "Remaining Amount"
                ]
            data.filteredFields = data.filteredFields ? data.filteredFields : fields
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                const array = data.filter.isEcommerce || data.filter.isFood ?
                    [{ "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }] :
                    (data.filter.isTravel ?
                        [{ travelType: regex }, { "travelCategory.name": regex }] :
                        [{ brand: regex }, { "billCategory.name": regex }])
                query.push({ $or: [{ NCNumber: regex }, { type: regex }, ...array] })
            }
            const ecomFoodProjection = [
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "commissionPercentage": "$commission.commission",
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
                        teamIncomePercentage: 1,
                        teamIncomeAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$teamIncomePercentage", 100]
                                }, "$commissionAmount.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$teamIncomePercentage", 100]
                                }, "$commissionAmount.to"]
                            },
                        },
                        ulDownlinePercentage: 1, convenienceFee: 1
                    }
                },
                {
                    $project: {
                        createdAt: 1, NCNumber: 1, type: 1, price: 1, category: 1, subCategory: 1, childCategory: 1,
                        commissionPercentage: 1,
                        commissionAmount: 1,
                        teamIncomePercentage: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: {
                            from: { $divide: ["$teamIncomeAmount.from", teamLevels.depth] },
                            to: { $divide: ["$teamIncomeAmount.to", teamLevels.depth] }
                        },
                        leftAmount: {
                            from: { $subtract: ["$commissionAmount.from", "$teamIncomeAmount.from"] },
                            to: { $subtract: ["$commissionAmount.to", "$teamIncomeAmount.to"] }
                        },
                        ulDownlinePercentage: 1,
                        convenienceFee: 1
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
                        ulDownlinePercentage: 1, convenienceFee: 1,
                        ulDownlineAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$ulDownlinePercentage", 100]
                                }, "$leftAmount.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$ulDownlinePercentage", 100]
                                }, "$leftAmount.to"]
                            },
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
                        "Commission Percentage": "$commissionPercentage",
                        "Commission Amount": "$commissionAmount",
                        "Team Income Percentage": "$teamIncomePercentage",
                        "Team Income Amount": "$teamIncomeAmount",
                        "Team Income Per Person": "$teamIncomePerPerson",
                        "Left Amount": "$leftAmount",
                        "UL Downline Percentage": "$ulDownlinePercentage",
                        "UL Downline Amount": "$ulDownlineAmount",
                        "UL Downline Per Person": {
                            from: { $divide: ["$ulDownlineAmount.from", teamLevels.width] },
                            to: { $divide: ["$ulDownlineAmount.to", teamLevels.width] }
                        },
                        "Convenience Fee": "$convenienceFee",
                        "Remaining Amount": {
                            from: { $subtract: ["$leftAmount.from", "$ulDownlineAmount.from"] },
                            to: { $subtract: ["$leftAmount.to", "$ulDownlineAmount.to"] }
                        },
                    }
                }
            ]
            const travelProjection = [
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1, "travelCategory._id": "$travelCategory._id", "travelCategory.name": "$travelCategory.name",
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1,
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.to"]
                            },
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$sponserCommission"]

                        },

                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", teamLevels.depth] },
                        leftAmount: { $subtract: ["$sponserCommission", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, travelType: 1, NCNumber: 1, type: 1,
                        travelCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
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
                        "Travel Name": "$travelCategory.name",
                        "Travel Type": "$travelType",
                        "Sponser Commission": "$sponserCommission",
                        "Commission Percentage": "$commissionPercentage",
                        "Commission Amount": "$commissionAmount",
                        "Team Income Percentage": "$teamIncomePercentage",
                        "Team Income Amount": "$teamIncomeAmount",
                        "Team Income Per Person": "$teamIncomePerPerson",
                        "Left Amount": "$leftAmount",
                        "UL Downline Percentage": "$ulDownlinePercentage",
                        "UL Downline Amount": "$ulDownlineAmount",
                        "UL Downline Per Person": { $divide: ["$ulDownlineAmount", teamLevels.width] },
                        "Convenience Fee": "$convenienceFee",
                        "Remaining Amount": { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            const billProjection = [
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, "billCategory._id": "$billCategory._id", "billCategory.name": "$billCategory.name",

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1,
                        commissionAmount: {
                            from: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.from"]
                            },
                            to: {
                                $multiply: [{
                                    $divide: ["$commissionPercentage", 100]
                                }, "$price.to"]
                            },
                        },
                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,
                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: {
                            $multiply: [{
                                $divide: ["$teamIncomePercentage", 100]
                            }, "$sponserCommission"]

                        },

                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: { $divide: ["$teamIncomeAmount", teamLevels.depth] },
                        leftAmount: { $subtract: ["$sponserCommission", "$teamIncomeAmount"] },
                    }
                },
                {
                    $project: {
                        createdAt: 1, brand: 1, NCNumber: 1, type: 1, billCategory: 1,

                        "teamIncomePercentage": 1,
                        "ulDownlinePercentage": 1,
                        "convenienceFee": 1, "sponserCommission": 1, "commissionPercentage": 1, "price": 1, ulDownlinePercentage: 1, convenienceFee: 1,
                        commissionAmount: 1,
                        teamIncomeAmount: 1,
                        teamIncomePerPerson: 1,
                        leftAmount: 1,
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
                        "Bill Category Name": "$billCategory.name",
                        "Brand": "$brand",
                        "Sponser Commission": "$sponserCommission",
                        "Commission Percentage": "$commissionPercentage",
                        "Commission Amount": "$commissionAmount",
                        "Team Income Percentage": "$teamIncomePercentage",
                        "Team Income Amount": "$teamIncomeAmount",
                        "Team Income Per Person": "$teamIncomePerPerson",
                        "Left Amount": "$leftAmount",
                        "UL Downline Percentage": "$ulDownlinePercentage",
                        "UL Downline Amount": "$ulDownlineAmount",
                        "UL Downline Per Person": { $divide: ["$ulDownlineAmount", teamLevels.width] },
                        "Convenience Fee": "$convenienceFee",
                        "Remaining Amount": { $subtract: ["$leftAmount", "$ulDownlineAmount"] },
                    }
                }
            ]
            const stages = data.filter.isEcommerce || data.filter.isFood ? ecomFoodStages :
                data.filter.isTravel ? travelStages : billStages;
            const projection = data.filter.isEcommerce || data.filter.isFood ? ecomFoodProjection :
                data.filter.isTravel ? travelProjection : billProjection;
            data['model'] = NetworkCategories;
            data['stages'] = [...stages, { $match: { $and: query } },];
            data['projectData'] = projection;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, ...data.filter };
            data['filterQuery'] = {}
            data['fileName'] = 'network-categories'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = NetworkCategoriesController;