const AllWebsitesettingsController = require('../../controller/common/websitesettings');

module.exports = (router, app) => {
    router.post('/common/addwebpages', (req, res, next) => {
        const addBlogS = (new AllWebsitesettingsController()).boot(req, res);
        return addBlogS.addPagesWebsites();
    });

     router.get('/common/getwebpages', (req, res, next) => {
        const addBlogS = (new AllWebsitesettingsController()).boot(req, res);
        return addBlogS.getPagesWebsites();
    });

    

}