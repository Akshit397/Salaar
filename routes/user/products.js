const ProductsController = require('../../controller/user/products');

module.exports = (router, app) => {
    router.post('/website/homePage', (req, res, next) => {
        const productsObj = (new ProductsController()).boot(req, res);
        return productsObj.homePage();
    });

    router.get('/website/getProductDetails/:customUrl', (req, res, next) => {
        const productsObj = (new ProductsController()).boot(req, res);
        return productsObj.getProductDetails();
    });

    router.post('/website/searchProduct', (req, res, next) => {
        const productsObj = (new ProductsController()).boot(req, res);
        return productsObj.searchProduct();
    });

    router.post('/website/productFilter', (req, res, next) => {
        const productsObj = (new ProductsController()).boot(req, res);
        return productsObj.productFilter();
    });
}