const _ = require("lodash");

const Controller = require("../base");
const { BusinessSubSegments } = require('../../models/s_business_sub_segments');
const { BusinessSegments } = require('../../models/s_business_segments');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');
const RequestBody = require("../../utilities/requestBody");

const businessSegmentStages = [
    { $lookup: { from: "business_segments", localField: "businessSegmentId", foreignField: "_id", as: "businessSegment" } },
    { $unwind: { "path": "$businessSegment", "preserveNullAndEmptyArrays": true } },
]
class BusinessSubSegmentsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Business Sub Segment details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "Testing",
          "businessSegmentId": "640c676a1fec4c7a6785b350",
          "businessSubSegmentId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateBusinessSubSegment() {
        try {
            let data = this.req.body;
            const fieldsArray = ["name", "businessSegmentId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const businessSegment = await BusinessSegments.findOne({ _id: data.businessSegmentId, isDeleted: false });
            if (_.isEmpty(businessSegment)) { return this.res.send({ status: 0, message: "Business segment details are not found" }); }
            if (data.businessSubSegmentId) {
                const checkName = await BusinessSubSegments.findOne({ name: data.name, businessSegmentId: data.businessSegmentId, _id: { $nin: [data.businessSubSegmentId] }, isDeleted: false });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                await BusinessSubSegments.findByIdAndUpdate(data.businessSubSegmentId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Business sub segment details updated successfully" });
            } else {
                const checkName = await BusinessSubSegments.findOne({ name: data.name, businessSegmentId: data.businessSegmentId, });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newBusinessSegment = await new Model(BusinessSubSegments).store(data);
                if (_.isEmpty(newBusinessSegment)) {
                    return this.res.send({ status: 0, message: "Business sub segment details not saved" })
                }
                return this.res.send({ status: 1, message: "Business sub segment details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Get Business sub Segment Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getBusinessSubSegmentDetails() {
        try {
            const data = this.req.params;
            if (!data.businessSubSegmentId) {
                return this.res.send({ status: 0, message: "Please send businessSubSegmentId" });
            }
            const businessSegment = await BusinessSubSegments.findOne({ _id: data.businessSubSegmentId, isDeleted: false }, { _v: 0 }).populate('businessSegmentId', { name: 1 });
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
 Purpose: single and multiple BusinessSubSegments change status
 Parameter:
 {
    "businessSubSegmentIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfBusinessSubSegments() {
        try {
            let msg = "Business Sub Segment status not updated";
            const updatedBusinessSubSegments = await BusinessSubSegments.updateMany({ _id: { $in: this.req.body.businessSubSegmentIds } }, { $set: { status: this.req.body.status } });
            if (updatedBusinessSubSegments) {
                msg = updatedBusinessSubSegments.modifiedCount ? updatedBusinessSubSegments.modifiedCount + " business sub segment updated" : updatedBusinessSubSegments.matchedCount == 0 ? "Business Sub Segment not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete BusinessSubSegment details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "businessSubSegmentIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteBusinessSubSegments() {
        try {
            if (!this.req.body.businessSubSegmentIds) {
                return this.res.send({ status: 0, message: "Please send businessSubSegmentIds" });
            }
            let msg = 'Business Sub Segment not deleted.';
            let status = 1;
            const updatedBusinessSubSegments = await BusinessSubSegments.updateMany({ _id: { $in: this.req.body.businessSubSegmentIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedBusinessSubSegments) {
                msg = updatedBusinessSubSegments.modifiedCount ? updatedBusinessSubSegments.modifiedCount + ' business sub segment deleted.' : updatedBusinessSubSegments.matchedCount == 0 ? "Details not found" : msg;
                status = updatedBusinessSubSegments.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Business sub segments Listing In Admin
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
    async businessSubSegmentsListing() {
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
                query.push({ $or: [{ name: regex, "businessSegment.name": regex }] })
            }
            const result = await BusinessSubSegments.aggregate([
                { $match: { isDeleted: false } },
                ...businessSegmentStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, name: 1, "businessSegment._id": 1, "businessSegment.name": 1, status: 1
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await BusinessSubSegments.aggregate([
                { $match: { isDeleted: false } },
                ...businessSegmentStages,
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
          "endDate":"2023-09-25",
          "searchText": "",
          "filteredFields": ["Date", "Business Sub Segment Name", "Business Segment Name", "Status"] 
      }
     Return: JSON String
     ********************************************************/
    async downloadBusinessSubSegmentFiles() {
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
                ["Date", "Business Sub Segment Name", "Business Segment Name"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            data['model'] = BusinessSubSegments;
            data['stages'] = businessSegmentStages;
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Business Sub Segment Name": "$name",
                    "Business Segment Name": "$businessSegment.name",
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'business-sub-segments'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose:Getting Dropdowns values for business sub segment
  Method: Post
  Authorisation: true
  {
      "searchText":"as",
      "businessSegmentId":""
  }
  Return: JSON String
  ********************************************************/
    async businessSubSegmentsList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            if (!data.businessSegmentId) {
                return this.res.send({ status: 0, message: "Please send businessSegmentId" });
            }
            let query = [{ isDeleted: false, businessSegmentId: data.businessSegmentId }]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            const result = await BusinessSubSegments.find({ $and: query }, { name: 1 }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = BusinessSubSegmentsController;