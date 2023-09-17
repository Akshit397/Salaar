const _ = require("lodash");

const Controller = require("../base");
const { BusinessSegments } = require('../../models/s_business_segments');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');


class BusinessSegmentsController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Add and update Business Segment details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "Testing",
          "businessSegmentId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateBusinessSegment() {
        try {
            let data = this.req.body;
            if (!data.name) {
                return this.res.send({ status: 0, message: "Please send business segment name." })
            }
            if (data.businessSegmentId) {
                const checkName = await BusinessSegments.findOne({ name: data.name, _id: { $nin: [data.businessSegmentId] }, isDeleted: false });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                await BusinessSegments.findByIdAndUpdate(data.businessSegmentId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Business segment details updated successfully" });
            } else {
                const checkName = await BusinessSegments.findOne({ name: data.name });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newBusinessSegment = await new Model(BusinessSegments).store(data);
                if (_.isEmpty(newBusinessSegment)) {
                    return this.res.send({ status: 0, message: "Business segment details not saved" })
                }
                return this.res.send({ status: 1, message: "Business segment details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Business Segment Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getBusinessSegmentDetails() {
        try {
            const data = this.req.params;
            if (!data.businessSegmentId) {
                return this.res.send({ status: 0, message: "Please send businessSegmentId" });
            }
            const businessSegment = await BusinessSegments.findOne({ _id: data.businessSegmentId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(businessSegment)) {
                return this.res.send({ status: 0, message: "Business segment details not found" });
            }
            return this.res.send({ status: 1, data: businessSegment });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple BusinessSegments change status
 Parameter:
 {
    "businessSegmentIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfBusinessSegments() {
        try {
            let msg = "Business Segment status not updated";
            const updatedBusinessSegments = await BusinessSegments.updateMany({ _id: { $in: this.req.body.businessSegmentIds } }, { $set: { status: this.req.body.status } });
            if (updatedBusinessSegments) {
                msg = updatedBusinessSegments.modifiedCount ? updatedBusinessSegments.modifiedCount + " business segment updated" : updatedBusinessSegments.matchedCount == 0 ? "BusinessSegment not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete BusinessSegment details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "businessSegmentIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteBusinessSegments() {
        try {
            if (!this.req.body.businessSegmentIds) {
                return this.res.send({ status: 0, message: "Please send businessSegmentIds" });
            }
            let msg = 'Business Segment not deleted.';
            let status = 1;
            const updatedBusinessSegments = await BusinessSegments.updateMany({ _id: { $in: this.req.body.businessSegmentIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedBusinessSegments) {
                msg = updatedBusinessSegments.modifiedCount ? updatedBusinessSegments.modifiedCount + ' business segment deleted.' : updatedBusinessSegments.matchedCount == 0 ? "Details not found" : msg;
                status = updatedBusinessSegments.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Business segments Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
    async businessSegmentsListing() {
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
            const result = await BusinessSegments.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { createdAt: 1, name: 1, status: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await BusinessSegments.aggregate([
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
    async downloadBusinessSegmentFiles() {
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
            data['model'] = BusinessSegments;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, Name: "$name", Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'business-segments'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose:Getting Dropdowns For Filters In CategoryListing In Admin
  Method: Post
  Authorisation: true
  {
      "searchText":"as"
  }
  Return: JSON String
  ********************************************************/
    async businessSegmentsList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            const result = await BusinessSegments.find({ $and: query }, { name: 1 }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = BusinessSegmentsController;