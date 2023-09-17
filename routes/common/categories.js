const CategoriesController = require('../../controller/common/categories');

module.exports = (router, app) => {
    router.post('/common/getCategories', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.getCategories();
    });

    router.post('/common/getPortFolioCategories', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.getPortFolioCategories();
    });
}