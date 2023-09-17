const _ = require("lodash");

const Controller = require("../base");
const { Admin } = require('../../models/s_admin');
const { Country } = require('../../models/s_country');
const { Roles } = require('../../models/s_roles');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');
const Services = require("../../utilities/index");
const { truncate } = require("fs");


const countriesStages = [
    { $lookup: { from: "countries", localField: "countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
]

const rolesStages = [
    { $lookup: { from: "roles", localField: "roleId", foreignField: "_id", as: "roles" } },
    { $unwind: { "path": "$roles", "preserveNullAndEmptyArrays": true } },
]

const permissionStages = [
    { $lookup: { from: "permissions", localField: "roles.permissionIds", foreignField: "_id", as: "permissions" } },
    { $unwind: { "path": "$permissions", "preserveNullAndEmptyArrays": true } },
]

const deparmentStages = [
    { $lookup: { from: "departments", localField: "permissions.departmentId", foreignField: "_id", as: "departments" } },
    { $unwind: { "path": "$departments", "preserveNullAndEmptyArrays": true } },
]

class StaffManagementController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Staff details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "fullName": "Staff 1",
          "gender": "female",
          "dob": "09/29/1996"
          "email": "staff1@gmail.com",
          "mobileNo":"7207334583",
          "image": "image.png",
          "addressLine1":"Address line 1",
          "addressLine2":"Address line 2",
          "city": "Rajahmundry",
          "state": "Andhra Pradesh",
          "pinCode": "533287"
          "countryId":"630f516684310d4d2a98baf2",
          "roleId": "642c42ca96191a74d2f03588"
          "staffId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateStaff() {
        try {
            let data = this.req.body;
            const fieldsArray = ["image", "fullName",
                "gender", "dob", "email", "mobileNo", "addressLine1", "addressLine2",
                "city", "pinCode", "state", "countryId", "roleId",
            ];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            data.dob = new Date(data.dob);
            const validateCountry = await Country.findOne({ _id: this.req.body.countryId, status: truncate });
            if (_.isEmpty(validateCountry)) {
                return this.res.send({ status: 0, message: "Country details not found" });
            }
            const validateRole = await Roles.findOne({ _id: this.req.body.roleId, status: true });
            if (_.isEmpty(validateRole)) {
                return this.res.send({ status: 0, message: "Country details not found" });
            }
            const validateEmail = await this.commonService.emailIdValidation(this.req.body.emailId);
            if (!validateEmail) {
                return this.res.send({ status: 0, message: "Please send proper emailId" });
            }
            const validateMobileNo = await this.commonService.mobileNoValidation(this.req.body.mobileNo);
            if (!validateMobileNo) {
                return this.res.send({ status: 0, message: "Mobile number should have 10 digits" });
            }
            if (data.staffId) {
                await Admin.findByIdAndUpdate(data.staffId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Staff details updated successfully" });
            } else {
                const password = await this.commonService.randomGenerator(8, 'capital');
                data.password = await this.commonService.ecryptPassword({
                    password: password,
                });
                data.role = 'staff';
                let staffCount = await Admin.count({ role: 'staff' });
                if (staffCount <= 8) {
                    staffCount = "0" + (
                        staffCount + 1
                    );
                }
                const randomText = (await this.commonService.randomGenerator(2, "number")) + (await this.commonService.randomGenerator(1, "capital")) + (await this.commonService.randomGenerator(2, "number"));
                data["registerId"] = "S" + randomText + staffCount;
                const newStaff = await new Model(Admin).store(data);
                if (_.isEmpty(newStaff)) {
                    return this.res.send({ status: 0, message: "Staff details not saved" })
                } else {
                    const message = `<html><body>
                    <p> Dear Staff,</p> 
                    <p>Welcome to www.salar.in,</p>
                    <p>Your registered Staff ID is <strong>${newStaff.registerId}</strong></p>
                    <p>Your Password is<strong> ${password}</strong></p>
                    <p>Regards Sworld solutions pvt ltd</p>`
                    // Sending email
                    await this.services.sendEmail(newStaff.emailId, "Salar", newStaff.fullName, message);
                    // Sending message
                    if (validateCountry.name == "India" && newStaff.mobileNo) {
                        let messageResponse = await this.services.sendSignupConfirmation(newStaff.mobileNo, message);
                        let msg = "";
                        if (messageResponse.result.data) {
                            msg = messageResponse.result.data;
                        }
                    }
                    return this.res.send({ status: 1, message: "Staff details added successfully" });
                }
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Staff Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getStaffDetails() {
        try {
            const data = this.req.params;
            if (!data.staffId) {
                return this.res.send({ status: 0, message: "Please send staffId" });
            }
            const staff = await Admin.findOne({ _id: data.staffId, isDeleted: false }, { _v: 0 })
                .populate('countryId', { name: 1 })
                .populate('roleId', { role: 1 });
            if (_.isEmpty(staff)) {
                return this.res.send({ status: 0, message: "Staff details not found" });
            }
            return this.res.send({ status: 1, data: staff });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple staff change status
    Parameter:
    {
        "staffIds":["64ed7727a67ceccb374fa469","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfStaff() {
        try {
            let msg = "Staff status not updated";
            const updatedStaff = await Admin.updateMany({ _id: { $in: this.req.body.staffIds } }, { $set: { status: this.req.body.status } });
            if (updatedStaff) {
                msg = updatedStaff.modifiedCount ? updatedStaff.modifiedCount + " staff updated" : updatedStaff.matchedCount == 0 ? "Staff not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Staff details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "staffIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteStaff() {
        try {
            if (!this.req.body.staffIds) {
                return this.res.send({ status: 0, message: "Please send staffIds" });
            }
            let msg = 'Staff not deleted.';
            let status = 1;
            const updatedStaff = await Admin.updateMany({ _id: { $in: this.req.body.staffIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedStaff) {
                msg = updatedStaff.modifiedCount ? updatedStaff.modifiedCount + ' staff deleted.' : updatedStaff.matchedCount == 0 ? "Details not found" : msg;
                status = updatedStaff.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: staff Listing In Admin
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
    async staffListing() {
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
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ fullName: regex }, { email: regex }, { mobileNo: regex },
                    { city: regex }, { state: regex }, { pinCode: regex }, { "country.name": regex }, { "roles.role": regex }]
                })
            }
            const result = await Admin.aggregate([
                { $match: { isDeleted: false, role: "staff" } },
                ...countriesStages,
                ...rolesStages,
                ...permissionStages,
                ...deparmentStages,
                { $match: { $and: query } },
                {
                    $project: {
                        fullName: 1, gender: 1, dob: 1, email: 1, mobileNo: 1, createdAt: 1,
                        registerId: 1, addressLine1: 1, addressLine2: 1, city: 1, state: 1, pinCode: 1,
                        "countries.name": 1, "countries._id": 1, "roles.role": 1, "roles._id": 1, status: 1,
                        "permissions._id": 1, "permissions.permission": 1, "permissions.permissionKey": 1,
                        "departments._id": 1, "departments.name": 1,
                        // kyc: 1 // Need clarity on kyc details where to get from suraj garu
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        fullName: { $first: "$fullName" }, gender: { $first: "$gender" }, dob: { $first: "$dob" }, email: { $first: "$email" }, mobileNo: { $first: "$mobileNo" }, createdAt: { $first: "$createdAt" },
                        registerId: { $first: "$registerId" }, addressLine1: { $first: "$addressLine1" }, addressLine2: { $first: "$addressLine2" }, city: { $first: "$city" }, state: { $first: "$state" }, pinCode: { $first: "$pinCode" },
                        countries: { $first: "$countries" },
                        roles: { $first: "$roles" },
                        status: { $first: "$status" },
                        departments: { $first: "$departments" },
                        permissions: { $push: "$permissions" }
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Admin.aggregate([
                { $match: { isDeleted: false, role: "staff" } },
                ...countriesStages,
                ...rolesStages,
                ...permissionStages,
                ...deparmentStages,
                { $match: { $and: query } },
                {
                    $project: {
                        fullName: 1, gender: 1, dob: 1, email: 1, mobileNo: 1, createdAt: 1,
                        registerId: 1, addressLine1: 1, addressLine2: 1, city: 1, state: 1, pinCode: 1,
                        "countries.name": 1, "countries._id": 1, "roles.role": 1, "roles._id": 1, status: 1,
                        "permissions._id": 1, "permissions.permission": 1, "permissions.permissionKey": 1,
                        "departments._id": 1, "departments.name": 1,
                        // kyc: 1 // Need clarity on kyc details where to get from suraj garu
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        fullName: { $first: "$fullName" }, gender: { $first: "$gender" }, dob: { $first: "$dob" }, email: { $first: "$email" }, mobileNo: { $first: "$mobileNo" }, createdAt: { $first: "$createdAt" },
                        registerId: { $first: "$registerId" }, addressLine1: { $first: "$addressLine1" }, addressLine2: { $first: "$addressLine2" }, city: { $first: "$city" }, state: { $first: "$state" }, pinCode: { $first: "$pinCode" },
                        countries: { $first: "$countries" },
                        roles: { $first: "$roles" },
                        status: { $first: "$status" },
                        departments: { $first: "$departments" },
                        permissions: { $push: "$permissions" }
                    }
                },
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
            "filteredFields": ["Date", "Staff ID", "Staff Name", "Gender", "Age", "Address", "Mobile No",
        "Email", "Role", "Permissions", "Departments", "KYC", "Account Status"] 
        }
       Return: JSON String
       ********************************************************/
    async downloadStaffFiles() {
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
                ["Date", "Staff ID", "Staff Name", "Gender", "Age", "Address", "Mobile No",
                    "Email", "Role", "Permissions", "Departments", "KYC", "Account Status"]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ staffCode: regex }] })
            }
            data['model'] = Admin;
            data['stages'] = [
                { $match: { isDeleted: false, role: "staff" } },
                ...countriesStages,
                ...rolesStages,
                ...permissionStages,
                ...deparmentStages,
                { $match: { $and: query } },
                {
                    $project: {
                        fullName: 1, gender: 1, dob: 1, email: 1, mobileNo: 1, createdAt: 1,
                        registerId: 1, addressLine1: 1, addressLine2: 1, city: 1, state: 1, pinCode: 1,
                        "countries.name": 1, "countries._id": 1, "roles.role": 1, "roles._id": 1, status: 1,
                        "permissions._id": 1, "permissions.permission": 1, "permissions.permissionKey": 1,
                        "departments._id": 1, "departments.name": 1,
                        // kyc: 1 // Need clarity on kyc details where to get from suraj garu
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        fullName: { $first: "$fullName" }, gender: { $first: "$gender" }, dob: { $first: "$dob" }, email: { $first: "$email" }, mobileNo: { $first: "$mobileNo" }, createdAt: { $first: "$createdAt" },
                        registerId: { $first: "$registerId" }, addressLine1: { $first: "$addressLine1" }, addressLine2: { $first: "$addressLine2" }, city: { $first: "$city" }, state: { $first: "$state" }, pinCode: { $first: "$pinCode" },
                        countries: { $first: "$countries" },
                        roles: { $first: "$roles" },
                        status: { $first: "$status" },
                        departments: { $first: "$departments" },
                        permissions: { $push: "$permissions" }
                    }
                },
            ];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Staff ID": "$registerId",
                    "Staff Name": "$fullName",
                    "Gender": "$gender",
                    "Age": {
                        $divide: [{ $subtract: [new Date(), "$dob"] },
                        (365 * 24 * 60 * 60 * 1000)]
                    },
                    "Address": { $concat: ["$addressLine1", ", ", "$addressLine2", ", ", "$city", ", ", "$state", ", ", "$pinCode"] },
                    "Mobile No": "$mobileNo",
                    "Email": "$email",
                    "Role": "$roles.role",
                    "Permissions": "$permissions.permission",
                    "Departments": "$departments.name",
                    "KYC": "Kyc details", // Need clarity on kyc details where to get from suraj garu
                    "Account Status": "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'staffs'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


    /********************************************************
     Purpose: List of staff
    Method: Post
    Authorisation: true
    Parameter:
    {
        "searchText":""
    }
    Return: JSON String
    ********************************************************/
    async staffFieldsList() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            const matchQuery = { roleId: { $exists: true }, isDeleted: false };
            let query = [matchQuery]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ fullName: regex }, { email: regex }] })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Admin.aggregate([
                { $match: { $and: query } },
                { $project: { fullName: 1 } },
                { $sort: sort },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result });

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal Server Error" });
        }
    }
}
module.exports = StaffManagementController;