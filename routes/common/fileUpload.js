/** @format */

const FileUploadController = require("../../controller/common/fileUpload");
module.exports = (router, app) => {
  router.post("/fileUpload", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.fileUpload();
  });
  router.post("/fileUploadForProduct", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.fileUploadForProduct();
  });

  router.post("/fileUploadForFoodProduct", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.fileUploadForFoodProduct();
  });

  router.post("/fileUploadForGameProduct", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.fileUploadForGameProduct();
  });

  router.post("/uploadBulkMultipleImages", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.uploadBulkMultipleImages();
  });
  router.post("/uploadMultipleImages", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.uploadMultipleImages();
  });

  router.post("/uploadMultipleImagesForGameProducts", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.uploadMultipleImagesForGameProducts();
  });

  router.post("/deleteGalleryImages", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.deleteGalleryImages();
  });

  router.post("/deleteGalleryImagesOfGameProduct", (req, res, next) => {
    const fileObj = new FileUploadController().boot(req, res);
    return fileObj.deleteGalleryImagesOfGameProduct();
  });
};
