const CmsController = require('../../controller/common/cms');
module.exports = (router, app) => {
    router.get('/getCmsDetailsByPageName/:pageName',  (req, res, next) => {
        const cmsObj = (new CmsController()).boot(req, res);
        return cmsObj.getCmsDetailsByPageName();
    });
}