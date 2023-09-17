const UnitsController = require('../../controller/admin/units');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateUnit', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.addAndUpdateUnit();
    });

    router.get('/admin/getUnitDetails/:unitId', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.getUnitDetails();
    });

    router.post('/admin/changeStatusOfUnits', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.changeStatusOfUnits();
    });

    router.post('/admin/deleteUnits', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.deleteUnits();
    });

    router.post('/admin/unitsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.unitsListing();
    });

    router.post('/admin/downloadUnitFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.downloadUnitFiles();
    });

    router.post('/unitsList', (req, res, next) => {
        const unitObj = (new UnitsController()).boot(req, res);
        return unitObj.unitsList();
    });
}