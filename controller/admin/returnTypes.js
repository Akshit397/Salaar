const _ = require("lodash");

const Controller = require("../base");
const { ReturnTypes } = require('../../models/s_return_types');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');


class ReturnTypesController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Add and update ReturnType details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "Damaged Product,",
          "returnTypeId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateReturnType() {
        try {
            let data = this.req.body;
            if (!data.name) {
                return this.res.send({ status: 0, message: "Please send name." })
            }
            if (data.returnTypeId) {
                const checkName = await ReturnTypes.findOne({ name: data.name, _id: { $nin: [data.returnTypeId] }, isDeleted: false });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                await ReturnTypes.findByIdAndUpdate(data.returnTypeId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "ReturnType updated successfully" });
            } else {
                const checkName = await ReturnTypes.findOne({ name: data.name });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                const newReturnType = await new Model(ReturnTypes).store(data);
                if (_.isEmpty(newReturnType)) {
                    return this.res.send({ status: 0, message: "Return type details not saved" })
                }
                return this.res.send({ status: 1, message: "Return type details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get ReturnType Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getReturnTypeDetails() {
        try {
            const data = this.req.params;
            if (!data.returnTypeId) {
                return this.res.send({ status: 0, message: "Please send returnTypeId" });
            }
            const ReturnType = await ReturnTypes.findOne({ _id: data.returnTypeId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(ReturnType)) {
                return this.res.send({ status: 0, message: "Return type details not found" });
            }
            return this.res.send({ status: 1, data: ReturnType });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple ReturnType change status
    Parameter:
    {
        "returnTypeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfReturnTypes() {
        try {
            let msg = "ReturnType status not updated";
            const updatedReturnTypes = await ReturnTypes.updateMany({ _id: { $in: this.req.body.returnTypeIds } }, { $set: { status: this.req.body.status } });
            if (updatedReturnTypes) {
                msg = updatedReturnTypes.modifiedCount ? updatedReturnTypes.modifiedCount + " ReturnType updated" : updatedReturnTypes.matchedCount == 0 ? "ReturnType not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete ReturnType details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "returnTypeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteReturnTypes() {
        try {
            if (!this.req.body.returnTypeIds) {
                return this.res.send({ status: 0, message: "Please send returnTypeIds" });
            }
            let msg = 'ReturnType not deleted.';
            let status = 1;
            const updatedReturnTypes = await ReturnTypes.updateMany({ _id: { $in: this.req.body.returnTypeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedReturnTypes) {
                msg = updatedReturnTypes.modifiedCount ? updatedReturnTypes.modifiedCount + ' ReturnType deleted.' : updatedReturnTypes.matchedCount == 0 ? "Details not found" : msg;
                status = updatedReturnTypes.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: ReturnTypes Listing In Admin
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
    async returnTypesListing() {
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
            const result = await ReturnTypes.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { createdAt: 1, name: 1, status: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await ReturnTypes.aggregate([
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
    async downloadReturnTypeFiles() {
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
            data['model'] = ReturnTypes;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, Name: "$name", Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'return-types'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns For return types In Admin
    Method: Post
    Authorisation: true
    {
        "searchText":"as",
    }
    Return: JSON String
    ********************************************************/
    async returnTypesList() {
        try {
            const skip = 0;
            const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }];
            if (data.searchText) {
                const regex = {
                    $regex: `.*${this.req.body.searchText}.*`,
                    $options: "i",
                };
                query.push({
                    $or: [
                        { name: regex },
                    ],
                });
            }
            const result = await ReturnTypes.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { name: 1 } },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
            ]);
            return this.res.send({
                status: 1,
                message: "Details are: ",
                data: result,
            });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = ReturnTypesController;