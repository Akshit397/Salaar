/****************************
 FILE HANDLING OPERATIONS
 ****************************/
 const fs = require('fs');
 const path = require('path');
 const _ = require("lodash");
 const mv = require('mv');
 const Jimp = require('jimp');

 //  for aws cloud services
 const aws = require('aws-sdk');
 
 aws.config.update({
     secretAccessKey: '',
     accessKeyId: '',
     region: ''
 });
 
 const s3 = new aws.S3();
 
 class File {
 
     constructor(file, location) {
         this.file = file;
         this.location = location;
     }
 
     store() {
         return new Promise(async (resolve, reject) => {
             // Setting the path
             if (_.isEmpty(this.file.file)){
                return resolve({ status: 0, message: "Please send a file" });
             }
             const fileName = this.file.file[0].originalFilename;
             const filePath = path.join(__dirname, '..', 'public','products', 'upload', fileName);
             const uploadedFilePath = process.env.IMAGE_PATH + filePath;
             const fileObject = { "originalFilename": fileName, filePath: uploadedFilePath, filePartialPath: fileName}
             await mv(this.file.file[0].path, filePath, { mkdirp: true }, async (err, data) => {
                 if (err){
                    return resolve({ status: 0, message: "Internal server error" });
                 }
                 else { resolve(fileObject); }
             })
         });
     }
 
     readFile(filepath) {
         return new Promise((resolve, reject) => {
             fs.readFile(filepath, 'utf-8', (err, html) => {
                 if (err) { return reject({ message: err, status: 0 }); }
 
                 return resolve(html);
 
             });
         });
     }


    /********    code for saving three (normal, compressed and thumbnail) images begins **********/
    // Normal image of size 600*600
    saveImage(filePath, fields, i) {
        return new Promise(async (resolve, reject) => {
            await Jimp.read(filePath).then(async (image) => {
                let imageName;
                if (i) { imageName = fields + i + '.jpg'; }
                else { imageName = fields + '.jpg'; }
                const cFilePath = path.join(__dirname, '../public/products/upload', imageName);
                const createAndStorecImage = await image.scaleToFit(600, 600).write(cFilePath);
                if (createAndStorecImage) {
                    const FilePathToPush = imageName
                    return resolve(FilePathToPush);
                }
            }).catch(err => {
                resolve(JSON.stringify(err))
            });
        });
    }
    // Compressed image of size 300*300
    imageCompression(filePath, fields, i) {
        return new Promise(async (resolve, reject) => {
            await Jimp.read(filePath).then(async (image) => {
                let cImageName;
                if (i) { cImageName = fields + i + "-sm.jpg"; }
                else { cImageName = fields + "-sm.jpg"; }
                const cFilePath = path.join(__dirname, '../public/products/upload', cImageName);
                const createAndStorecImage = await image.quality(20).scaleToFit(300, 300).write(cFilePath);
                if (createAndStorecImage) {
                    const FilePathToPush = cImageName
                    return resolve(FilePathToPush);
                }
            }).catch(err => {
                resolve(JSON.stringify(err))
            });
        });
    }
    // Thumbnail Image of size 64*64
    generateThumbnail(filePath, fields, i) {
        return new Promise(async (resolve, reject) => {
            await Jimp.read(filePath).then(async (image) => {
                let tImageName;
                if (i) { tImageName = fields + i + "-th.jpg"; }
                else { tImageName = fields + "-th.jpg"; }
                const cFilePath = path.join(__dirname, '../public/products/upload', tImageName);
                const createAndStorecImage = await image.scaleToFit(64, 64).write(cFilePath);
                if (createAndStorecImage) {
                    const FilePathToPush = tImageName
                    return resolve(FilePathToPush);
                }
            }).catch(err => {
                resolve(JSON.stringify(err))
            });
        });
    }
    /********    code for saving three (normal, compressed and thumbnail) images ends **********/

    // for aws server
    uploadFileOnS3(file) {
        // console.log(file)
        const fileName = file.originalFilename.split(".");
        const newFileName = fileName[0] + Date.now().toString() + '.' + fileName[1];
        return new Promise((resolve, reject) => {

            s3.createBucket(() => {
                const params = {
                    Bucket: 'cosmic.camera',
                    Key: newFileName,
                    Body: fs.createReadStream(file.path),
                    ACL: "public-read",
                }
                s3.upload(params, function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
            });
        });
    }
 }
 
 module.exports = File;