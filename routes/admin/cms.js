const CmsController = require('../../controller/admin/cms');
const Authorization = require('../../middleware/auth');
module.exports = (router, app) => {
    // admin authorised routes
    router.post('/addCms',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.addCms();
    });

    router.get('/getCmsDetails/:cmsId',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.getCmsDetails();
    });

    router.post('/cmsListing',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.cmsListing();
    });

    router.post('/changeCmsStatus',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.changeCmsStatus();
    });

    router.post('/downloadCmsFile',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.downloadCmsFile();
    });

    router.post('/deleteCms',  Authorization.isAdminAuthorised, (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.deleteCms();
    });
    

}