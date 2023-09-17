const RolesController = require('../../controller/admin/roles');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateDepartment', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.addAndUpdateDepartment();
    });

    router.get('/admin/getDepartmentDetails/:departmentId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.getDepartmentDetails();
    });

    router.post('/admin/changeStatusOfDepartments', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.changeStatusOfDepartments();
    });

    router.post('/admin/deleteDepartments', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.deleteDepartments();
    });

    router.post('/admin/departmentsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.departmentsListing();
    });

    router.post('/admin/downloadDepartmentFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.downloadDepartmentFiles();
    });

    router.post('/admin/departmentsFieldsList', (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.departmentsFieldsList();
    });

    router.post('/admin/addAndUpdatePermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.addAndUpdatePermissions();
    });

    router.get('/admin/getPermissionDetails/:permissionId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.getPermissionDetails();
    });

    router.post('/admin/changeStatusOfPermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.changeStatusOfPermissions();
    });

    router.post('/admin/deletePermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.deletePermissions();
    });

    router.post('/admin/permissionsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.permissionsListing();
    });

    router.post('/admin/downloadPermissionFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.downloadPermissionFiles();
    });

    router.post('/admin/permissionFieldsList', (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.permissionFieldsList();
    });

    router.get('/admin/getAllPermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.getAllPermissions();
    });

    router.post('/admin/addAndUpdateRole', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.addAndUpdateRole();
    });

    router.get('/admin/getRoleDetails/:roleId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.getRoleDetails();
    });

    router.post('/admin/changeStatusOfRoles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.changeStatusOfRoles();
    });

    router.post('/admin/deleteRoles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.deleteRoles();
    });

    router.post('/admin/rolesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.rolesListing();
    });

    router.post('/admin/downloadRoleFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.downloadRoleFiles();
    });

    router.post('/admin/rolesFieldsList', (req, res, next) => {
        const rolesObj = (new RolesController()).boot(req, res);
        return rolesObj.rolesFieldsList();
    });
}