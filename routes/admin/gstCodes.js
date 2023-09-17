const GSTCodesController = require('../../controller/admin/gstCodes');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateGstCode', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.addAndUpdateGstCode();
    });

    router.get('/admin/getGstCodeDetails/:gstCodeId', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.getGstCodeDetails();
    });

    router.post('/admin/changeStatusOfGstCodes', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.changeStatusOfGstCodes();
    });

    router.post('/admin/deleteGstCodes', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.deleteGstCodes();
    });

    router.post('/admin/gstCodesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.gstCodesListing();
    });

    router.post('/admin/downloadGstCodeFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.downloadGstCodeFiles();
    });

    router.post('/gstCodesList', (req, res, next) => {
        const codesObj = (new GSTCodesController()).boot(req, res);
        return codesObj.gstCodesList();
    });
}