const _ = require("lodash");

const Controller = require("../base");
const { Recharges } = require('../../models/s_recharges');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');


class RechargesController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Add and update Recharge details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "PostPaid",
          "rechargeId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateRecharge() {
        try {
            let data = this.req.body;
            if (!data.name) {
                return this.res.send({ status: 0, message: "Please send recharge name." })
            }
            if (data.rechargeId) {
                const checkName = await Recharges.findOne({ name: data.name, _id: { $nin: [data.rechargeId] }, isDeleted: false });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                await Recharges.findByIdAndUpdate(data.rechargeId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Recharge updated successfully" });
            } else {
                const checkName = await Recharges.findOne({ name: data.name });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newRecharge = await new Model(Recharges).store(data);
                if (_.isEmpty(newRecharge)) {
                    return this.res.send({ status: 0, message: "Recharge details not saved" })
                }
                return this.res.send({ status: 1, message: "Recharge details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Recharge Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getRechargeDetails() {
        try {
            const data = this.req.params;
            if (!data.rechargeId) {
                return this.res.send({ status: 0, message: "Please send rechargeId" });
            }
            const recharge = await Recharges.findOne({ _id: data.rechargeId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(recharge)) {
                return this.res.send({ status: 0, message: "Recharge details not found" });
            }
            return this.res.send({ status: 1, data: recharge });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple recharge change status
    Parameter:
    {
        "rechargeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfRecharges() {
        try {
            let msg = "Recharge status not updated";
            const updatedRecharges = await Recharges.updateMany({ _id: { $in: this.req.body.rechargeIds } }, { $set: { status: this.req.body.status } });
            if (updatedRecharges) {
                msg = updatedRecharges.modifiedCount ? updatedRecharges.modifiedCount + " recharge updated" : updatedRecharges.matchedCount == 0 ? "Recharge not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Recharge details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "rechargeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteRecharges() {
        try {
            if (!this.req.body.rechargeIds) {
                return this.res.send({ status: 0, message: "Please send rechargeIds" });
            }
            let msg = 'Recharge not deleted.';
            let status = 1;
            const updatedRecharges = await Recharges.updateMany({ _id: { $in: this.req.body.rechargeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedRecharges) {
                msg = updatedRecharges.modifiedCount ? updatedRecharges.modifiedCount + ' recharge deleted.' : updatedRecharges.matchedCount == 0 ? "Details not found" : msg;
                status = updatedRecharges.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Recharges Listing In Admin
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
    async rechargesListing() {
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
            const result = await Recharges.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { createdAt: 1, name: 1, status: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Recharges.aggregate([
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
          "filteredFields": ["Date", "Name", "Status"] 
      }
     Return: JSON String
     ********************************************************/
    async downloadRechargeFiles() {
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
                ["Date", "Name", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            data['model'] = Recharges;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, Name: "$name", Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'recharges'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = RechargesController;