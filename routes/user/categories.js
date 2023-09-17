const CategoriesController = require('../../controller/user/categories');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/website/getCategories', (req, res, next) => {
        const categoriesObj = (new CategoriesController()).boot(req, res);
        return categoriesObj.getCategories();
    });

    router.post('/website/getSubCategories', (req, res, next) => {
        const categoriesObj = (new CategoriesController()).boot(req, res);
        return categoriesObj.getSubCategories();
    });
}