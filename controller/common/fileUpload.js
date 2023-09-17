const _ = require("lodash");
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');

const Controller = require("../base");
const Form = require("../../utilities/form");
const File = require("../../utilities/file");
const { Products } = require('../../models/s_products');
const { FoodProducts } = require('../../models/s_food_products');
const { GameProducts } = require('../../models/s_game_product');

class FileUploadController extends Controller {
    constructor() {
        super();
    }


    /********************************************************
      Purpose: Single File uploading
      Parameter:
      {
          "file":
      }
      Return: JSON String
  ********************************************************/
    async fileUpload() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files))
                    return this.res.send({ status: 0, message: "Please send a file" });
                const file = new File(formObject.files);
                const fileObject = await file.store();
                const filepath = fileObject.filePartialPath;
                const data = { filepath }
                this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error- ", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
    Purpose: fileUploadForProduct For Product While Adding Individual In Admin
    Method: Post
    Authorisation: true
    Parameter:
    form-data:productId(text):5cc2b6c8ebb52016963673a8
    file:select-image
    productId(text):5cc2b6c8ebb52016963673a8
    Return: JSON String
    ********************************************************/
    async fileUploadForProduct() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files && formObject.fields.productId))
                    return this.res.send({ status: 0, message: "Please send a file with productId" });
                const product = await Products.findOne({ _id: formObject.fields.productId[0] });
                if (_.isEmpty(product))
                    return this.res.send({ status: 0, message: "Product details not found" });
                const filesData = new File(formObject.files);
                let filePath = "";
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const path = formObject.files.file[0].path;
                    // saving thumbnail image
                    await filesData.generateThumbnail(path, product.sku);
                    // saving compressed image
                    await filesData.imageCompression(path, product.sku);
                    // saving normal image
                    filePath = await filesData.saveImage(filesData.file.file[0].path, product.sku);
                }
                const data = { filePath }
                return this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error- ", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
   Purpose: fileUploadForGameProduct For Product While Adding Individual In Admin
   Method: Post
   Authorisation: true
   Parameter:
   form-data:gameProductId(text):5cc2b6c8ebb52016963673a8
   file:select-image
   gameProductId(text):5cc2b6c8ebb52016963673a8
   Return: JSON String
   ********************************************************/
    async fileUploadForGameProduct() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files && formObject.fields.gameProductId))
                    return this.res.send({ status: 0, message: "Please send a file with gameProductId" });
                const gameProduct = await GameProducts.findOne({ _id: formObject.fields.gameProductId[0] });
                if (_.isEmpty(gameProduct)) { return this.res.send({ status: 0, message: "Product details not found" }); }
                const filesData = new File(formObject.files);
                let filePath = "";
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const path = formObject.files.file[0].path;
                    // saving thumbnail image
                    await filesData.generateThumbnail(path, gameProduct.sku);
                    // saving compressed image
                    await filesData.imageCompression(path, gameProduct.sku);
                    // saving normal image
                    filePath = await filesData.saveImage(filesData.file.file[0].path, gameProduct.sku);
                }
                const data = { filePath }
                return this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error- ", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
 Purpose: fileUploadForFoodProduct For Product While Adding Individual In Admin
 Method: Post
 Authorisation: true
 Parameter:
 form-data:foodProductId(text):5cc2b6c8ebb52016963673a8
 file:select-image
 foodProductId(text):5cc2b6c8ebb52016963673a8
 Return: JSON String
 ********************************************************/
    async fileUploadForFoodProduct() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files && formObject.fields.foodProductId))
                    return this.res.send({ status: 0, message: "Please send a file with foodProductId" });
                const foodProduct = await FoodProducts.findOne({ _id: formObject.fields.foodProductId[0] });
                if (_.isEmpty(foodProduct))
                    return this.res.send({ status: 0, message: "Product details not found" });
                const filesData = new File(formObject.files);
                let filePath = "";
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const path = formObject.files.file[0].path;
                    // saving thumbnail image
                    await filesData.generateThumbnail(path, foodProduct.sku);
                    // saving compressed image
                    await filesData.imageCompression(path, foodProduct.sku);
                    // saving normal image
                    filePath = await filesData.saveImage(filesData.file.file[0].path, foodProduct.sku);
                }
                const data = { filePath }
                return this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error- ", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
    Purpose: UploadBulkMultipleImages For Adding Additional Images Of Product While Doing Bulk Uploads In Admin
    Method: Post
    Authorisation: true
    Parameter:
    form-data
    file: send multiple files
    Return: JSON String
    ********************************************************/
    async uploadBulkMultipleImages() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files))
                    return this.res.send({ status: 0, message: "Please send files" });
                const filesData = new File(formObject.files);
                // const filepaths = [];
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const count = formObject.files.file.length;
                    for (let i = 0; i < count; i++) {
                        let saveImage = "";
                        const data1 = {};
                        const path = formObject.files.file[i].path;
                        const name = formObject.files.file[i].originalFilename;
                        let originalFilename = "";
                        const fileName = name.split(".");
                        const ext = fileName[fileName.length - 1];
                        const fileName1 = name.length;
                        if (ext === "jpg" || ext === "png") {
                            originalFilename = name.substring(0, fileName1 - 4)
                        }
                        if (ext === "jpeg") {
                            originalFilename = name.substring(0, fileName1 - 5)
                        }
                        // saving thumbnail image
                        await filesData.generateThumbnail(path, originalFilename);
                        // saving compressed image
                        await filesData.imageCompression(path, originalFilename);
                        // saving normal image
                        saveImage = await filesData.saveImage(filesData.file.file[i].path, originalFilename);
                        data1.normalImage = saveImage;

                        data1.label = originalFilename
                        // filepaths.push(data1);
                    }
                    return this.res.send({ status: 1, message: "File uploaded successfully" });
                }
            }
            catch (error) {
                console.log("error- ", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
    Purpose: uploadMultipleImages For Adding Additional Images Of Product While Adding Individual In Admin
    Method: Post
    Authorisation: true
    Parameter:
    form-data
    file:select-image
    productId(text):5cc2b6c8ebb52016963673a8
    Return: JSON String
    ********************************************************/
    async uploadMultipleImages() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files && formObject.fields.productId))
                    return this.res.send({ status: 0, message: "Please send a file with productId" });
                const product = await Products.findOne({ _id: formObject.fields.productId[0] });
                if (_.isEmpty(product))
                    return this.res.send({ status: 0, message: "Product details not found" });
                const filesData = new File(formObject.files);
                const dataToUpdate = [];
                // const dataArray = [];
                const filepaths = [];
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const count = formObject.files.file.length;
                    for (let i = 0; i < count; i++) {
                        let saveImage = "";
                        const data1 = {};
                        const path = formObject.files.file[i].path;
                        const length = (product.gallaryImages && product.temporaryImages) ? product.gallaryImages.length + product.temporaryImages.length : 0;
                        // saving thumbnail image
                        await filesData.generateThumbnail(path, product.sku, (length + i + 1));
                        // saving compressed image
                        await filesData.imageCompression(path, product.sku, (length + i + 1));
                        // saving normal image
                        saveImage = await filesData.saveImage(filesData.file.file[i].path, product.sku, (length + i + 1));
                        data1.imgName = saveImage;
                        data1.imgLabel = product.sku + (length + i + 1);
                        data1.imgSequence = length + i + 1
                        filepaths.push(data1);
                        const data2 = {}
                        data2.imgName = saveImage;
                        data2.imgLabel = product.sku + (length + i + 1)
                        data2.imgSequence = length + i + 1
                        const data3 = {}
                        data3.imgName = saveImage;
                        dataToUpdate.push(data3)
                    }
                }
                const finalArray = product.temporaryImages.concat(dataToUpdate);
                let final = []
                if (_.isEmpty(product.gallaryImages)) {
                    if (_.isEmpty(product.tempImgArr)) { final = filepaths; }
                    else { final = product.tempImgArr.concat(filepaths); }
                }
                else { final = product.gallaryImages.concat(filepaths) }
                const value = {}
                value.tempImgArr = final;
                value.temporaryImages = finalArray
                await Products.findOneAndUpdate({ _id: formObject.fields.productId[0] }, { tempImgArr: final, temporaryImages: finalArray });
                const products = await Products.findOne({ _id: formObject.fields.productId[0] }, { tempImgArr: 1 });
                const data = { productPics: products.tempImgArr }
                return this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error", error)
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
    Purpose: uploadMultipleImages for game products For Adding Additional Images Of Product While Adding Individual In Admin
    Method: Post
    Authorisation: true
    Parameter:
    form-data
    file:select-image
    gameProductId(text):5cc2b6c8ebb52016963673a8
    Return: JSON String
    ********************************************************/
    async uploadMultipleImagesForGameProducts() {
        return new Promise(async (resolve, reject) => {
            try {
                const form = new Form(this.req);
                const formObject = await form.parse();
                if (_.isEmpty(formObject.files && formObject.fields.gameProductId))
                    return this.res.send({ status: 0, message: "Please send a file with gameProductId" });
                const gameProduct = await GameProducts.findOne({ _id: formObject.fields.gameProductId[0] });
                if (_.isEmpty(gameProduct))
                    return this.res.send({ status: 0, message: "Game product details not found" });
                const filesData = new File(formObject.files);
                const dataToUpdate = [];
                // const dataArray = [];
                const filepaths = [];
                if (process.env.s3upload && process.env.s3upload == 'true') {
                    // need to change logic based on cloud service used for image upload
                    filesData.uploadFileOnS3(formObject.files.file[0])
                }
                else {
                    const count = formObject.files.file.length;
                    for (let i = 0; i < count; i++) {
                        let saveImage = "";
                        const data1 = {};
                        const path = formObject.files.file[i].path;
                        const length = (gameProduct.gallaryImages && gameProduct.temporaryImages) ? gameProduct.gallaryImages.length + gameProduct.temporaryImages.length : 0;
                        // saving thumbnail image
                        await filesData.generateThumbnail(path, gameProduct.sku, (length + i + 1));
                        // saving compressed image
                        await filesData.imageCompression(path, gameProduct.sku, (length + i + 1));
                        // saving normal image
                        saveImage = await filesData.saveImage(filesData.file.file[i].path, gameProduct.sku, (length + i + 1));
                        data1.imgName = saveImage;
                        data1.imgLabel = gameProduct.sku + (length + i + 1);
                        data1.imgSequence = length + i + 1
                        filepaths.push(data1);
                        const data2 = {}
                        data2.imgName = saveImage;
                        data2.imgLabel = gameProduct.sku + (length + i + 1)
                        data2.imgSequence = length + i + 1
                        const data3 = {}
                        data3.imgName = saveImage;
                        dataToUpdate.push(data3)
                    }
                }
                const finalArray = gameProduct.temporaryImages.concat(dataToUpdate);
                let final = []
                if (_.isEmpty(gameProduct.gallaryImages)) {
                    if (_.isEmpty(gameProduct.tempImgArr)) { final = filepaths; }
                    else { final = gameProduct.tempImgArr.concat(filepaths); }
                }
                else { final = gameProduct.gallaryImages.concat(filepaths) }
                const value = {}
                value.tempImgArr = final;
                value.temporaryImages = finalArray
                await GameProducts.findOneAndUpdate({ _id: formObject.fields.gameProductId[0] }, { tempImgArr: final, temporaryImages: finalArray });
                const gameProducts = await GameProducts.findOne({ _id: formObject.fields.gameProductId[0] }, { tempImgArr: 1 });
                const data = { gameProductPics: gameProducts.tempImgArr }
                return this.res.send({ status: 1, message: "File uploaded successfully", data });
            }
            catch (error) {
                console.log("error", error)
                this.res.send({ status: 0, message: error });
            }
        });
    }

    /********************************************************
    Purpose: Delete gallary_images of products
    Method: Post
    Authorisation: true
    Parameter:
    {
        "productId":"5d4d25364418020e6056fe6f",
        "imageId":"5d50ff28b380220f7240167e"
    }
    Return: JSON String
    ********************************************************/
    async deleteGalleryImages() {
        try {
            const product = await Products.findOne({ _id: ObjectId(this.req.body.productId), "tempImgArr._id": ObjectId(this.req.body.imageId) }, { "tempImgArr.$": 1, sku: 1 });
            const deleteImage = product.tempImgArr[0].imgName;
            let imagePath = '';
            const sku = product.sku;
            const img = deleteImage.split(sku);
            const ext = img[1].slice(0, -4);
            if (deleteImage != undefined) {
                for (let i = 1; i <= 3; i++) {
                    if (i === 1)
                        imagePath = 'public/products/upload/' + deleteImage
                    if (i === 2)
                        imagePath = 'public/products/upload/' + sku + ext + '-sm' + '.jpg'
                    if (i === 3)
                        imagePath = 'public/products/upload/' + sku + ext + '-th' + '.jpg'
                    fs.unlink(imagePath, (err) => { if (err) throw err; });
                }
            }
            await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { tempImgArr: { _id: ObjectId(this.req.body.imageId) } } });
            const product1 = await Products.findOne({ _id: ObjectId(this.req.body.productId), "gallary_images.imgName": deleteImage });
            if (!_.isEmpty(product1)) {
                await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { gallary_images: { imgName: deleteImage } } });
            }
            return this.res.send({ status: 1, message: "Image deleted successfully" });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Delete gallaryImages of game products
   Method: Post
   Authorisation: true
   Parameter:
   {
       "gameProductId":"5d4d25364418020e6056fe6f",
       "imageId":"5d50ff28b380220f7240167e"
   }
   Return: JSON String
   ********************************************************/
    async deleteGalleryImagesOfGameProduct() {
        try {
            const gameProduct = await GameProducts.findOne({ _id: ObjectId(this.req.body.gameProductId), "tempImgArr._id": ObjectId(this.req.body.imageId) }, { "tempImgArr.$": 1, sku: 1 });
            const deleteImage = gameProduct.tempImgArr[0].imgName;
            let imagePath = '';
            const sku = gameProduct.sku;
            const img = deleteImage.split(sku);
            const ext = img[1].slice(0, -4);
            if (deleteImage != undefined) {
                for (let i = 1; i <= 3; i++) {
                    if (i === 1)
                        imagePath = 'public/products/upload/' + deleteImage
                    if (i === 2)
                        imagePath = 'public/products/upload/' + sku + ext + '-sm' + '.jpg'
                    if (i === 3)
                        imagePath = 'public/products/upload/' + sku + ext + '-th' + '.jpg'
                    fs.unlink(imagePath, (err) => { if (err) throw err; });
                }
            }
            await GameProducts.findOneAndUpdate({ _id: this.req.body.gameProductId }, { $pull: { tempImgArr: { _id: ObjectId(this.req.body.imageId) } } });
            const gameProduct1 = await GameProducts.findOne({ _id: ObjectId(this.req.body.gameProductId), "gallaryImages.imgName": deleteImage });
            if (!_.isEmpty(gameProduct1)) {
                await GameProducts.findOneAndUpdate({ _id: this.req.body.gameProductId }, { $pull: { gallaryImages: { imgName: deleteImage } } });
            }
            return this.res.send({ status: 1, message: "Image deleted successfully" });
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


}
module.exports = FileUploadController;