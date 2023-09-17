const _ = require("lodash");

const Controller = require("../base");
const { Plans } = require('../../models/s_plan_game');
const { GameProducts } = require('../../models/s_game_product');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');
const RequestBody = require("../../utilities/requestBody");


class PlansController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Plan details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "PostPaid",
          "width":5,
          "depth": 10,
          "status": true,
          "planId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdatePlan() {
        try {
            let data = this.req.body;
            const fieldsArray = ["name", "width", 'depth'];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            if (data.planId) {
                const games = await GameProducts.findOne({ isDeleted: false, planId: data.planId });
                if (!_.isEmpty(games)) { return this.res.send({ status: 0, message: "You can not update this plan details" }); }
                const checkName = await Plans.findOne({ name: data.name, _id: { $nin: [data.planId] }, isDeleted: false });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                await Plans.findByIdAndUpdate(data.planId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Plan updated successfully" });
            } else {
                const checkName = await Plans.findOne({ name: data.name });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newPlan = await new Model(Plans).store(data);
                if (_.isEmpty(newPlan)) {
                    return this.res.send({ status: 0, message: "Plan details not saved" })
                }
                return this.res.send({ status: 1, message: "Plan details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Plan Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getPlanDetails() {
        try {
            const data = this.req.params;
            if (!data.planId) {
                return this.res.send({ status: 0, message: "Please send planId" });
            }
            const plan = await Plans.findOne({ _id: data.planId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(plan)) {
                return this.res.send({ status: 0, message: "Plan details not found" });
            }
            return this.res.send({ status: 1, data: plan });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple Plan change status
    Parameter:
    {
        "planIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfPlans() {
        try {
            let msg = "Plan status not updated";
            const updatedPlans = await Plans.updateMany({ _id: { $in: this.req.body.planIds } }, { $set: { status: this.req.body.status } });
            if (updatedPlans) {
                msg = updatedPlans.modifiedCount ? updatedPlans.modifiedCount + " Plan updated" : updatedPlans.matchedCount == 0 ? "Plan not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Plan details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "planIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deletePlans() {
        try {
            if (!this.req.body.planIds) {
                return this.res.send({ status: 0, message: "Please send planIds" });
            }
            let msg = 'Plan not deleted.';
            let status = 1;
            const games = await GameProducts.findOne({ isDeleted: false, planId: { $in: this.req.body.planIds } });
            if (!_.isEmpty(games)) { return this.res.send({ status: 0, message: "You can not delete this plan details" }); }
            const updatedPlans = await Plans.updateMany({ _id: { $in: this.req.body.planIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedPlans) {
                msg = updatedPlans.modifiedCount ? updatedPlans.modifiedCount + ' Plan deleted.' : updatedPlans.matchedCount == 0 ? "Details not found" : msg;
                status = updatedPlans.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Plans Listing In Admin
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
    async plansListing() {
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
                query.push({ $or: [{ name: regex }] })
            }
            const result = await Plans.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { createdAt: 1, name: 1, status: 1, width: 1, depth: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Plans.aggregate([
                { $match: { isDeleted: false, $and: query } },
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
          "filteredFields": ["Date", "Name", "Width", "Depth", "Status"] 
      }
     Return: JSON String
     ********************************************************/
    async downloadPlanFiles() {
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
                ["Date", "Name", "Width", "Depth", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            data['model'] = Plans;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    Name: "$name",
                    Width: "$width",
                    Depth: '$depth',
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'plans'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose:Getting Dropdowns For plans In Admin
   Method: Post
   Authorisation: true
   {
       "searchText":"as",
   }
   Return: JSON String
   ********************************************************/
    async plansList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            const result = await Plans.find({ $and: query }, { name: 1 }).sort({ _id: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = PlansController;