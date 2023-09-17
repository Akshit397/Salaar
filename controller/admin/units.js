/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Units } = require("../../models/s_unit");
const Model = require("../../utilities/model");
const DownloadsController = require("../common/downloads");
const RequestBody = require("../../utilities/requestBody");

class UnitsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
        Purpose: Add and update Unit details
        Method: Post
        Authorisation: true
        Parameter:
        {
            "name": "Weight",
            "values": ["kg","gm"],
            "unitId": "" //optional 
        }               
        Return: JSON String
    ********************************************************/
    async addAndUpdateUnit() {
        try {
            let data = this.req.body;
            const fieldsArray = ["name", "values"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray,);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required.", });
            }
            if (data.unitId) {
                const checkName = await Units.findOne({ name: data.name, _id: { $nin: [data.unitId] }, isDeleted: false, });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                await Units.findByIdAndUpdate(data.unitId, data, { new: true, upsert: true, });
                return this.res.send({ status: 1, message: "Unit updated successfully", });
            } else {
                const checkName = await Units.findOne({ name: data.name });
                if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
                const newUnit = await new Model(Units).store(data);
                if (_.isEmpty(newUnit)) {
                    return this.res.send({ status: 0, message: "Unit details not saved", });
                }
                return this.res.send({ status: 1, message: "Unit details added successfully", });
            }
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: Get Unit Details
     Method: GET
     Authorisation: true            
     Return: JSON String
     ********************************************************/
    async getUnitDetails() {
        try {
            const data = this.req.params;
            if (!data.unitId) {
                return this.res.send({ status: 0, message: "Please send unitId" });
            }
            const unit = await Units.findOne(
                { _id: data.unitId, isDeleted: false },
                { _v: 0 },
            );
            if (_.isEmpty(unit)) {
                return this.res.send({ status: 0, message: "Unit details not found" });
            }
            return this.res.send({ status: 1, data: unit });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: single and multiple Unit change status
      Parameter:
      {
          "unitIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
          "status":true
      }
      Return: JSON String
      ********************************************************/
    async changeStatusOfUnits() {
        try {
            let msg = "Unit status not updated";
            const updatedUnits = await Units.updateMany(
                { _id: { $in: this.req.body.unitIds } },
                { $set: { status: this.req.body.status } },
            );
            if (updatedUnits) {
                msg = updatedUnits.modifiedCount
                    ? updatedUnits.modifiedCount + " Unit updated"
                    : updatedUnits.matchedCount == 0
                        ? "Unit not exists"
                        : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: Delete Unit details
     Method: Post
     Authorisation: true
     Parameter:
     {
         "unitIds":["5c9df24382ddca1298d855bb"]
     }  
     Return: JSON String
     ********************************************************/
    async deleteUnits() {
        try {
            if (!this.req.body.unitIds) {
                return this.res.send({ status: 0, message: "Please send unitIds" });
            }
            let msg = "Unit not deleted.";
            let status = 1;
            const updatedUnits = await Units.updateMany(
                { _id: { $in: this.req.body.unitIds }, isDeleted: false },
                { $set: { isDeleted: true } },
            );
            if (updatedUnits) {
                msg = updatedUnits.modifiedCount
                    ? updatedUnits.modifiedCount + " Unit deleted."
                    : updatedUnits.matchedCount == 0
                        ? "Details not found"
                        : msg;
                status = updatedUnits.matchedCount == 0 ? 0 : 1;
            }
            return this.res.send({ status, message: msg });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
        Purpose: Units Listing In Admin
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
    async unitsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({
                    key: "createdAt",
                    startDate: data.startDate,
                    endDate: data.endDate,
                });
                console.log(`query: ${JSON.stringify(query)}`);
            }
            if (data.searchText) {
                const regex = {
                    $regex: `.*${this.req.body.searchText}.*`,
                    $options: "i",
                };
                query.push({ $or: [{ name: regex }] });
            }
            const result = await Units.aggregate([
                { $match: { isDeleted: false, $and: query } },
                {
                    $project: {
                        createdAt: 1,
                        name: 1,
                        values: 1,
                        status: 1,
                    },
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Units.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { _id: 1 } },
            ]);
            return this.res.send({
                status: 1,
                message: "Listing details are: ",
                data: result,
                page: data.page,
                pagesize: data.pagesize,
                total: total.length,
            });
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
            "filteredFields":  ["Date", "Unit Name","Manage values", "Status"]
        }
       Return: JSON String
       ********************************************************/
    async downloadUnitFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({
                    status: 0,
                    message: "Please send type of the file to download",
                });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({
                    key: "createdAt",
                    startDate: data.startDate,
                    endDate: data.endDate,
                });
                console.log(`query: ${JSON.stringify(query)}`);
            }
            data.filteredFields = data.filteredFields
                ? data.filteredFields
                : ["Date", "Unit Name", "Manage values", "Status"];
            if (data.searchText) {
                const regex = {
                    $regex: `.*${this.req.body.searchText}.*`,
                    $options: "i",
                };
                query.push({ $or: [{ name: regex }] });
            }
            data["model"] = Units;
            data["stages"] = [];
            data["projectData"] = [
                {
                    $project: {
                        Date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                                timezone: "Asia/Kolkata",
                            },
                        },
                        "Unit Name": "$name",
                        "Manage values": "$values",
                        Status: "$status",
                    },
                },
            ];
            data["key"] = "createdAt";
            data["query"] = { isDeleted: false, $and: query };
            data["filterQuery"] = {};
            data["fileName"] = "units";

            const download = await new DownloadsController().downloadFiles(data);
            return this.res.send({
                status: 1,
                message: `${data.type.toUpperCase()} downloaded successfully`,
                data: download,
            });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose:Getting Dropdowns For Units In Admin
      Method: Post
      Authorisation: true
      {
          "searchText":"as",
      }
      Return: JSON String
      ********************************************************/
    async unitsList() {
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
            const result = await Units.aggregate([
                { $match: { isDeleted: false, $and: query } },
                { $project: { name: 1, values: 1 } },
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
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = UnitsController;
