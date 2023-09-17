const TravelTypesController = require('../../controller/admin/travelTypes');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateTravelType', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.addAndUpdateTravelType();
    });

    router.get('/admin/getTravelTypeDetails/:travelTypeId', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.getTravelTypeDetails();
    });

    router.post('/admin/changeStatusOfTravelTypes', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.changeStatusOfTravelTypes();
    });

    router.post('/admin/deleteTravelTypes', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.deleteTravelTypes();
    });

    router.post('/admin/travelTypesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.travelTypesListing();
    });

    router.post('/admin/downloadTravelTypeFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const travelObj = (new TravelTypesController()).boot(req, res);
        return travelObj.downloadTravelTypeFiles();
    });
}