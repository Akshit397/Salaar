const mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

const roleSchema = new mongoose.Schema({
    role: { type: String },
    permissionIds: [{ type: Schema.Types.ObjectId, ref: 'permissions' }],
    addedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Roles = mongoose.model('roles', roleSchema);

const permissionSchema = new mongoose.Schema({
    permission: { type: String },
    permissionKey: { type: String, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'departments' },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Permissions = mongoose.model('permissions', permissionSchema);

const departmentSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Departments = mongoose.model('departments', departmentSchema);

module.exports = {
    Permissions,
    Roles,
    Departments
}