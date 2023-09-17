const FoodProductController = require('../../controller/admin/foodProducts');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/seller/addAndUpdateFoodProduct', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.addAndUpdateFoodProduct();
    });

    router.get('/seller/getFoodProductDetails/:foodProductId', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.getFoodProductDetails();
    });

    router.post('/seller/changeStatusOfFoodProducts', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.changeStatusOfFoodProducts();
    });

    router.post('/seller/deleteFoodProducts', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.deleteFoodProducts();
    });

    router.post('/seller/foodProductsListing', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.foodProductsListing();
    });

    router.post('/seller/downloadFoodProductFiles', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.downloadFoodProductFiles();
    });

    router.post('/seller/deleteRelatedFoodProduct', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.deleteRelatedFoodProduct();
    });

    router.post('/seller/relatedFoodProductsListing', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.relatedFoodProductsListing();
    });

    router.delete('/seller/deleteFoodProductImage/:foodProductId', Authorization.isSellerAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.deleteFoodProductImage();
    });

    router.post('/foodProductFieldsList', (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.foodProductFieldsList();
    });

    router.post('/admin/updateFoodProductDetailsByAdmin', Authorization.isAdminAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.updateFoodProductDetailsByAdmin();
    });

    router.post('/admin/changeStatusOfFoodProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.changeStatusOfFoodProducts();
    });

    router.post('/admin/deleteFoodProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.deleteFoodProducts();
    });

    router.post('/admin/foodProductsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.foodProductsListing();
    });

    router.post('/admin/downloadFoodProductFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const foodProductObj = (new FoodProductController()).boot(req, res);
        return foodProductObj.downloadFoodProductFiles();
    });
}