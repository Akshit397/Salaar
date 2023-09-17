const BusinessSubSegmentsController = require('../../controller/admin/businessSubSegments');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateBusinessSubSegment', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.addAndUpdateBusinessSubSegment();
    });

    router.get('/admin/getBusinessSubSegmentDetails/:businessSubSegmentId', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.getBusinessSubSegmentDetails();
    });

    router.post('/admin/changeStatusOfBusinessSubSegments', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.changeStatusOfBusinessSubSegments();
    });

    router.post('/admin/deleteBusinessSubSegments', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.deleteBusinessSubSegments();
    });

    router.post('/admin/businessSubSegmentsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.businessSubSegmentsListing();
    });

    router.post('/admin/downloadBusinessSubSegmentFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.downloadBusinessSubSegmentFiles();
    });

    router.post('/businessSubSegmentsList', (req, res, next) => {
        const businessObj = (new BusinessSubSegmentsController()).boot(req, res);
        return businessObj.businessSubSegmentsList();
    });
}