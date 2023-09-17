const _ = require("lodash");
const { ObjectID } = require('mongodb');
const Controller = require("../base");
const { Roles, Permissions, Departments } = require('../../models/s_roles');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');

const departmentStages = [
    { $lookup: { from: "departments", localField: "departmentId", foreignField: "_id", as: "department" } },
    { $unwind: { "path": "$department", "preserveNullAndEmptyArrays": true } },
];

const adminStages = [
    { $lookup: { from: "admins", localField: "addedBy", foreignField: "_id", as: "admin" } },
    { $unwind: { "path": "$admin", "preserveNullAndEmptyArrays": true } },
];

class RolesController extends Controller {

    constructor() {
        super();
    }

    /********************************************************
    Purpose: Permission Department add /update
    Parameter:
    {
        "name": "Admin Users",
        "departmentId": "" // optional
    }
    Return: JSON String
    ********************************************************/
    async addAndUpdateDepartment() {
        try {
            const data = this.req.body;
            if (!data.name) {
                return this.res.send({ status: 0, message: "Please enter name" });
            }
            const filter = data.departmentId ?
                { isDeleted: false, name: data.name, _id: { $ne: data.departmentId } } :
                { isDeleted: false, name: data.name };
            const departmentExist = await Departments.findOne(filter);
            if (departmentExist) {
                return this.res.send({ status: 0, message: "Department details already exists" });
            }
            if (data.departmentId) {
                const updatedDetails = await Departments.findOneAndUpdate({ _id: data.departmentId }, { name: data.name }, { new: true });
                return this.res.send({ status: 1, message: "Department details updated successfully", data: updatedDetails });
            } else {
                const name = await new Model(Departments).store({ name: data.name });
                return this.res.send({ status: 1, message: "Department details saved successfully", data: name });
            }
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Department Details
    Method: GET
    Authorisation: true            
    Return: JSON String
    ********************************************************/
    async getDepartmentDetails() {
        try {
            const data = this.req.params;
            if (!data.departmentId) {
                return this.res.send({ status: 0, message: "Please send departmentId" });
            }
            const department = await Departments.findOne({ _id: data.departmentId, isDeleted: false }, { _v: 0 });
            if (_.isEmpty(department)) {
                return this.res.send({ status: 0, message: "Department details not found" });
            }
            return this.res.send({ status: 1, message: "Details are: ", data: department });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple departments change status
 Parameter:
 {
    "departmentIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfDepartments() {
        try {
            let msg = "Department status not updated";
            const updatedDepartments = await Departments.updateMany({ _id: { $in: this.req.body.departmentIds } }, { $set: { status: this.req.body.status } });
            if (updatedDepartments) {
                msg = updatedDepartments.modifiedCount ? updatedDepartments.modifiedCount + " department updated" : updatedDepartments.matchedCount == 0 ? "Department not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Department details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "departmentIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteDepartments() {
        try {
            if (!this.req.body.departmentIds) {
                return this.res.send({ status: 0, message: "Please send departmentIds" });
            }
            let msg = 'Department not deleted.';
            let status = 1;
            const updatedDepartments = await Departments.updateMany({ _id: { $in: this.req.body.departmentIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedDepartments) {
                msg = updatedDepartments.modifiedCount ? updatedDepartments.modifiedCount + ' department deleted.' : updatedDepartments.matchedCount == 0 ? "Details not found" : msg;
                status = updatedDepartments.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: departments Listing In Admin
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
    async departmentsListing() {
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
                query.push({ $or: [{ name: regex }] })
            }
            const result = await Departments.aggregate([
                { $match: { isDeleted: false, $and: query } },
                {
                    $project: {
                        name: 1, status: 1, createdAt: 1
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Departments.aggregate([
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
          "endDate":"2023-09-25",
          "searchText": "",
          "filteredFields": ["Date","Name","Status"] 
      }
     Return: JSON String
     ********************************************************/
    async downloadDepartmentFiles() {
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
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            data['model'] = Departments;
            data['stages'] = [];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Name": "$name", Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'departments'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: List of departments
    Method: Post
    Authorisation: true
    Parameter:
    {
        "searchText":""
    }
    Return: JSON String
    ********************************************************/
    async departmentsFieldsList() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            const matchQuery = { isDeleted: false };
            let query = [matchQuery]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }

            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Departments.aggregate([
                { $match: { $and: query } },
                { $project: { name: 1 } },
                { $sort: sort },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result });

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal Server Error" });
        }
    }

    /********************************************************
    Purpose:Role permissions add /update
    Parameter:
    {
        "departmentId": "5d25ecdf31f21b0f0ae96ba3",
        "permission": "view",
        "permissionId":"" // optional
    }
    Return: JSON String
    ********************************************************/
    async addAndUpdatePermissions() {
        try {
            const data = this.req.body;
            if (!data.permission && !data.departmentId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const isDepartmentExist = await Departments.findOne({ _id: data.departmentId });
            if (isDepartmentExist) {
                const filter = data.permissionId ?
                    { departmentId: data.departmentId, permission: data.permission, _id: { $ne: data.permissionId } } :
                    { departmentId: data.departmentId, permission: data.permission };
                const isPermissionExist = await Permissions.findOne(filter);
                if (isPermissionExist) {
                    return this.res.send({ status: 0, message: "Permission for this department is already exists" });
                }
                data['permissionKey'] = isDepartmentExist.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() + '_' + data['permission'].replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                if (data.permissionId) {
                    console.log(`1`)
                    const updatedPermission = await Permissions.findOneAndUpdate({ _id: data.permissionId, departmentId: data.departmentId }, data, { new: true });
                    console.log(`updatedPermission: ${JSON.stringify(updatedPermission)}`)
                    if (!updatedPermission) {
                        return this.res.send({ status: 0, message: "Permission details not updated" });
                    }
                    return this.res.send({ status: 1, message: "Permission details are: ", data: updatedPermission });
                } else {
                    const newPermission = await new Model(Permissions).store(data);
                    return this.res.send({ status: 1, message: "Permission details are: ", data: newPermission });
                }
            } else {
                return this.res.send({ status: 0, message: "Department details are not found" });
            }
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Get Permission Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getPermissionDetails() {
        try {
            const data = this.req.params;
            if (!data.permissionId) {
                return this.res.send({ status: 0, message: "Please send permissionId" });
            }
            const permission = await Permissions.findOne({ _id: data.permissionId, isDeleted: false }, { _v: 0 }).populate('departmentId', { name: 1 });
            if (_.isEmpty(permission)) {
                return this.res.send({ status: 0, message: "Permission details not found" });
            }
            return this.res.send({ status: 1, message: "Details are: ", data: permission });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple permissions change status
 Parameter:
 {
    "permissionIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfPermissions() {
        try {
            let msg = "Permission status not updated";
            const updatedPermissions = await Permissions.updateMany({ _id: { $in: this.req.body.permissionIds } }, { $set: { status: this.req.body.status } });
            if (updatedPermissions) {
                msg = updatedPermissions.modifiedCount ? updatedPermissions.modifiedCount + " permission updated" : updatedPermissions.matchedCount == 0 ? "Permission not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Permission details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "permissionIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deletePermissions() {
        try {
            if (!this.req.body.permissionIds) {
                return this.res.send({ status: 0, message: "Please send permissionIds" });
            }
            let msg = 'Permission not deleted.';
            let status = 1;
            const updatedPermissions = await Permissions.updateMany({ _id: { $in: this.req.body.permissionIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedPermissions) {
                msg = updatedPermissions.modifiedCount ? updatedPermissions.modifiedCount + ' permission deleted.' : updatedPermissions.matchedCount == 0 ? "Details not found" : msg;
                status = updatedPermissions.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: permissions Listing In Admin
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
    async permissionsListing() {
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
                query.push({ $or: [{ permission: regex }, { permissionKey: regex }, { "department.name": regex }] })
            }
            const result = await Permissions.aggregate([
                { $match: { isDeleted: false } },
                ...departmentStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, permission: 1, permissionKey: 1, status: 1, "department._id": "$department._id",
                        "department.name": "$department.name"
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Permissions.aggregate([
                { $match: { isDeleted: false } },
                ...departmentStages,
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
            "filteredFields": [ "Date","Permission", "Permission Key", "Department Name", "Status"] 
        }
       Return: JSON String
       ********************************************************/
    async downloadPermissionFiles() {
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
                ["Date", "Permission", "Permission Key", "Department Name", "Status"]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ permission: regex }, { permissionKey: regex }, { "department.name": regex }] })
            }
            data['model'] = Permissions;
            data['stages'] = [
                ...departmentStages,
                { $match: { $and: query } },
            ];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    Permission: "$permission",
                    "Permission Key": "$permissionKey",
                    "Department Name": "$department.name",
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'permissions'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: List of permissions
  Method: Post
  Authorisation: true
  Parameter:
  {
      "searchText":""
  }
  Return: JSON String
  ********************************************************/
    async permissionFieldsList() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            const matchQuery = { isDeleted: false };
            let query = [matchQuery]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ permission: regex }] })
            }

            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Permissions.aggregate([
                { $match: { $and: query } },
                { $project: { permission: 1 } },
                { $sort: sort },
                { $limit: limit },
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result });

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal Server Error" });
        }
    }

    /********************************************************
    Purpose: Get All Role permissions
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    async getAllPermissions() {
        try {
            const stages = await this.permissionAggregationStages();
            const permissions = await Permissions.aggregate(stages);
            return this.res.send({ status: 1, message: "All permissions are: ", data: permissions });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    async permissionAggregationStages() {
        return new Promise((resolve, reject) => {
            try {
                const stages = [
                    { $lookup: { from: "departments", localField: "departmentId", foreignField: "_id", as: "department" } },
                    { $unwind: { "path": "$department", "preserveNullAndEmptyArrays": true } },
                    { $match: { "department.status": true, "department.isDeleted": false, "status": true, isDeleted: false } },
                    {
                        $group: {
                            _id: "$department._id", permissions: { $push: { permission: "$permission", permissionKey: "$permissionKey", _id: "$_id" } },
                            departmentName: { $first: "$department.name" }
                        }
                    },
                    { $project: { permissions: 1, departmentName: 1 } }
                ];
                return resolve(stages);
            } catch (error) {
                return reject(error);
            }
        });
    }

    /********************************************************
   Purpose:Role add /update
   Parameter:
   {
       "role": "Email Manager",
       "permissionIds": ["5d5654c1a8fe610d46c68a42","5d5654c1a8fe610d46c68a42"],
       "roleId":"" // optional
   }
   Return: JSON String
   ********************************************************/
    async addAndUpdateRole() {
        try {
            let data = this.req.body;
            /**** adding addedBy in role creation ********/
            data.addedBy = this.req.user;
            if (!data.role && !data.permissionIds) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const filter = data.roleId ? { role: data.role, _id: { $ne: data.roleId }, addedBy: data.addedBy } : { role: data.role, addedBy: data.addedBy };
            const roleExist = await Roles.findOne(filter);
            if (roleExist) {
                return this.res.send({ status: 0, message: "Role already exists" });
            }
            let role = {};
            if (data.roleId) {
                role = await Roles.findOneAndUpdate({ _id: data.roleId }, data, { new: true, upsert: true });
                if (!role) {
                    return this.res.send({ status: 0, message: "Role details not found" });
                }
            } else {
                role = await new Model(Roles).store(data);
            }
            return this.res.send({ status: 1, message: "Details are: ", data: role });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose: Get Role Details
  Method: GET
  Authorisation: true            
  Return: JSON String
  ********************************************************/
    async getRoleDetails() {
        try {
            const data = this.req.params;
            if (!data.roleId) {
                return this.res.send({ status: 0, message: "Please send roleId" });
            }
            const role = await Roles.aggregate([
                { $match: { _id: ObjectID(data.roleId), isDeleted: false } },
                { $lookup: { from: "permissions", localField: "permissionIds", foreignField: "_id", as: "permission" } },
                { $unwind: { "path": "$permission", "preserveNullAndEmptyArrays": true } },
                { $lookup: { from: "departments", localField: "permission.departmentId", foreignField: "_id", as: "department" } },
                { $unwind: { "path": "$department", "preserveNullAndEmptyArrays": true } },
                {
                    $match: {
                        "department.status": true, "department.isDeleted": false,
                        "permission.status": true, "permission.isDeleted": false
                    }
                },
                {
                    $group: {
                        _id: "$department._id",
                        permissions: {
                            $push: {
                                permission: "$permission.permission", permissionKey: "$permission.permissionKey",
                                _id: "$permission._id"
                            }
                        },
                        departmentName: { $first: "$department.name" }, departmentId: { $first: "$department._id" },
                        role: { $first: "$role" }, roleId: { $first: "$_id" }
                    }
                },
                {
                    $group: {
                        _id: "$roleId",
                        role: { $first: "$role" },
                        departments: { $push: { name: "$departmentName", _id: "$departmentId", permissions: "$permissions" } }
                    }
                },
            ])
            if (_.isEmpty(role)) {
                return this.res.send({ status: 0, message: "Role details not found" });
            }
            return this.res.send({ status: 1, data: role });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple roles change status
 Parameter:
 {
    "roleIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfRoles() {
        try {
            let msg = "Role status not updated";
            const updatedRoles = await Roles.updateMany({ _id: { $in: this.req.body.roleIds } }, { $set: { status: this.req.body.status } });
            if (updatedRoles) {
                msg = updatedRoles.modifiedCount ? updatedRoles.modifiedCount + " role updated" : updatedRoles.matchedCount == 0 ? "Role not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Role details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "roleIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteRoles() {
        try {
            if (!this.req.body.roleIds) {
                return this.res.send({ status: 0, message: "Please send roleIds" });
            }
            let msg = 'Role not deleted.';
            let status = 1;
            const updatedRoles = await Roles.updateMany({ _id: { $in: this.req.body.roleIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedRoles) {
                msg = updatedRoles.modifiedCount ? updatedRoles.modifiedCount + ' role deleted.' : updatedRoles.matchedCount == 0 ? "Details not found" : msg;
                status = updatedRoles.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: roles Listing In Admin
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
    async rolesListing() {
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
                query.push({ $or: [{ role: regex }, { "permissions.permission": regex }, { "admin.fullName": regex }] })
            }
            const listingStages = [
                { $match: { isDeleted: false } },
                ...adminStages,
                { $lookup: { from: "permissions", localField: "permissionIds", foreignField: "_id", as: "permission" } },
                { $unwind: { "path": "$permission", "preserveNullAndEmptyArrays": true } },
                { $lookup: { from: "departments", localField: "permission.departmentId", foreignField: "_id", as: "department" } },
                { $unwind: { "path": "$department", "preserveNullAndEmptyArrays": true } },
                {
                    $match: {
                        "department.status": true, "department.isDeleted": false,
                        "permission.status": true, "permission.isDeleted": false
                    }
                },
                { $match: { $and: query } },
                {
                    $group: {
                        _id: "$_id",
                        permissions: {
                            $push: {
                                permission: "$permission.permission", permissionKey: "$permission.permissionKey",
                                _id: "$permission._id", departmentName: "$department.name", "departmentId": "$department._id"
                            }
                        },
                        role: { $first: "$role" }, createdAt: { $first: "$createdAt" },
                        status: { $first: "$status" }, addedBy: { $first: "$admin.fullName" }
                    }
                },
            ]
            const result = await Roles.aggregate([
                ...listingStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Roles.aggregate([
                ...listingStages,
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
            "filteredFields": ["Date","Role","Permissions","Status", "AddedBy"] 
        }
       Return: JSON String
       ********************************************************/
    async downloadRoleFiles() {
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
                ["Date", "Role", "Permissions", "Status", "AddedBy"]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ role: regex }] })
            }
            data['model'] = Roles;
            data['stages'] = [
                { $match: { isDeleted: false } },
                ...adminStages,
                { $lookup: { from: "permissions", localField: "permissionIds", foreignField: "_id", as: "permission" } },
                { $unwind: { "path": "$permission", "preserveNullAndEmptyArrays": true } },
                { $lookup: { from: "departments", localField: "permission.departmentId", foreignField: "_id", as: "department" } },
                { $unwind: { "path": "$department", "preserveNullAndEmptyArrays": true } },
                {
                    $match: {
                        "department.status": true, "department.isDeleted": false,
                        "permission.status": true, "permission.isDeleted": false
                    }
                },
                { $match: { $and: query } },
                {
                    $group: {
                        _id: "$_id",
                        permissions: {
                            $push: {
                                permission: "$permission.permission", permissionKey: "$permission.permissionKey",
                                _id: "$permission._id", departmentName: "$department.name", "departmentId": "$department._id"
                            }
                        },
                        role: { $first: "$role" },
                        createdAt: { $first: "$createdAt" },
                        status: { $first: "$status" },
                        addedBy: { $first: "$admin.fullName" }
                    }
                },
            ];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    Role: "$role",
                    Permissions: "$permissions", Status: "$status", AddedBy: "$addedBy"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'roles'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: List of roles
    Method: Post
    Authorisation: true
    Parameter:
    {
        "searchText":""
    }
    Return: JSON String
    ********************************************************/
    async rolesFieldsList() {
        try {
            const sort = { _id: -1 };
            const limit = 20;
            const matchQuery = { isDeleted: false };
            let query = [matchQuery]
            if (this.req.body.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ role: regex }] })
            }

            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Roles.aggregate([
                { $match: { $and: query } },
                { $project: { role: 1 } },
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
module.exports = RolesController;