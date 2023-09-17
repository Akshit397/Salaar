const StaffManagementController = require('../../controller/admin/staffManagement');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateStaff', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.addAndUpdateStaff();
    });

    router.get('/admin/getStaffDetails/:staffId', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.getStaffDetails();
    });

    router.post('/admin/changeStatusOfStaff', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.changeStatusOfStaff();
    });

    router.post('/admin/deleteStaff', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.deleteStaff();
    });

    router.post('/admin/staffListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.staffListing();
    });

    router.post('/admin/downloadStaffFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.downloadStaffFiles();
    });

    router.post('/admin/staffFieldsList', Authorization.isAdminAuthorised, (req, res, next) => {
        const staffObj = (new StaffManagementController()).boot(req, res);
        return staffObj.staffFieldsList();
    });
}