const _ = require("lodash");

const Controller = require("../base");
const { TravelTypes } = require('../../models/s_travel_types');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');


class TravelTypesController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Add and update TravelType details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "Bus",
          "travelTypeId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateTravelType() {
        try {
            let data = this.req.body;
            if (!data.name) {
                return this.res.send({ status: 0, message: "Please send travel name." })
            }
            if (data.travelTypeId) {
                const checkName = await TravelTypes.findOne({ name: data.name, _id: { $nin: [data.travelTypeId] }, isDeleted: false });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                await TravelTypes.findByIdAndUpdate(data.travelTypeId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Travel type details updated successfully" });
            } else {
                const checkName = await TravelTypes.findOne({ name: data.name });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newTravelType = await new Model(TravelTypes).store(data);
                if (_.isEmpty(newTravelType)) {
                    return this.res.send({ status: 0, message: "Travel type details not saved" })
                }
                return this.res.send({ status: 1, message: "Travel type details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get TravelType Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getTravelTypeDetails() {
        try {
            const data = this.req.params;
            if (!data.travelTypeId) {
                return this.res.send({ status: 0, message: "Please send travelTypeId" });
            }
            const travelType = await TravelTypes.findOne({ _id: data.travelTypeId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(travelType)) {
                return this.res.send({ status: 0, message: "TravelType details not found" });
            }
            return this.res.send({ status: 1, data: travelType });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple travelTypes change status
 Parameter:
 {
    "travelTypeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfTravelTypes() {
        try {
            let msg = "TravelType status not updated";
            const updatedTravelTypes = await TravelTypes.updateMany({ _id: { $in: this.req.body.travelTypeIds } }, { $set: { status: this.req.body.status } });
            if (updatedTravelTypes) {
                msg = updatedTravelTypes.modifiedCount ? updatedTravelTypes.modifiedCount + " travel type updated" : updatedTravelTypes.matchedCount == 0 ? "TravelType not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete TravelType details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "travelTypeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteTravelTypes() {
        try {
            if (!this.req.body.travelTypeIds) {
                return this.res.send({ status: 0, message: "Please send travelTypeIds" });
            }
            let msg = 'TravelType not deleted.';
            let status = 1;
            const updatedTravelTypes = await TravelTypes.updateMany({ _id: { $in: this.req.body.travelTypeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedTravelTypes) {
                msg = updatedTravelTypes.modifiedCount ? updatedTravelTypes.modifiedCount + ' travel type deleted.' : updatedTravelTypes.matchedCount == 0 ? "Details not found" : msg;
                status = updatedTravelTypes.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Travel types Listing In Admin
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
    async travelTypesListing() {
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
            const result = await TravelTypes.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { createdAt: 1, name: 1, status: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await TravelTypes.aggregate([
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
    async downloadTravelTypeFiles() {
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
            data['model'] = TravelTypes;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, Name: "$name", Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'travelTypes'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = TravelTypesController;