const BusinessSegments = require('../../controller/admin/businessSegments');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateBusinessSegment', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.addAndUpdateBusinessSegment();
    });

    router.get('/admin/getBusinessSegmentDetails/:businessSegmentId', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.getBusinessSegmentDetails();
    });

    router.post('/admin/changeStatusOfBusinessSegments', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.changeStatusOfBusinessSegments();
    });

    router.post('/admin/deleteBusinessSegments', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.deleteBusinessSegments();
    });

    router.post('/admin/businessSegmentsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.businessSegmentsListing();
    });

    router.post('/admin/downloadBusinessSegmentFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.downloadBusinessSegmentFiles();
    });

    router.post('/businessSegmentsList', (req, res, next) => {
        const businessObj = (new BusinessSegments()).boot(req, res);
        return businessObj.businessSegmentsList();
    });
}