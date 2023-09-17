const CategoriesController = require('../../controller/seller/categories');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/sellerCategoryList', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.sellerCategoryList();
    });
}