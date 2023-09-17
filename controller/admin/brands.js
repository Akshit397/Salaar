const _ = require("lodash");

const Controller = require("../base");
const { Brands } = require('../../models/s_brand');
const { Categories } = require('../../models/s_category');
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads');
const RequestBody = require("../../utilities/requestBody");

const categoriesStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];

const subCategoriesStages = [
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory", "preserveNullAndEmptyArrays": true } },
];

const childCategoriesStages = [
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory", "preserveNullAndEmptyArrays": true } },
];


class BrandsController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Brand details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryId": "63e87d54916c08c8ae166caf",
        "subCategoryId":"63e87d72916c08c8ae166cb5",
        "childCategoryId":"63e87d7f916c08c8ae166cbb", 
        "name": "Levi's",
        "website":"www.levis.com",
        "image": "levis.jpg",
        "topBrand": true,
        "status": true,
        "isFood": false,
        "isVegetables":false,
        "isEcommerce": true,
        "isGame": false
        "brandId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateBrand() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryId", "subCategoryId", "childCategoryId", "name", "website", 'image'];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const checkCategory = await Categories.findOne({ _id: data.categoryId, type: "category", isDeleted: false });
            if (_.isEmpty(checkCategory)) {
                return this.res.send({ status: 0, message: "Category details not found" });
            }
            const checkSubCategory = await Categories.findOne({ _id: data.subCategoryId, type: "subCategory1", isDeleted: false });
            if (_.isEmpty(checkSubCategory)) {
                return this.res.send({ status: 0, message: "Sub-Category details not found" });
            }
            const checkChildCategory = await Categories.findOne({ _id: data.childCategoryId, type: "subCategory2", isDeleted: false });
            if (_.isEmpty(checkChildCategory)) {
                return this.res.send({ status: 0, message: "Child-Category details not found" });
            }
            if (data.brandId) {
                const checkName = await Brands.findOne({ name: data.name, _id: { $nin: [data.brandId] }, isDeleted: false });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                await Brands.findByIdAndUpdate(data.brandId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Brand updated successfully" });
            } else {
                const checkName = await Brands.findOne({ name: data.name });
                if (!_.isEmpty(checkName))
                    return this.res.send({ status: 0, message: "Name already exists" });
                const newBrand = await new Model(Brands).store(data);
                if (_.isEmpty(newBrand)) {
                    return this.res.send({ status: 0, message: "Brand details not saved" })
                }
                return this.res.send({ status: 1, message: "Brand details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Brand Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getBrandDetails() {
        try {
            const data = this.req.params;
            if (!data.brandId) {
                return this.res.send({ status: 0, message: "Please send brandId" });
            }
            const brand = await Brands.findOne({ _id: data.brandId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1 })
                .populate('subCategoryId', { categoryName: 1 })
                .populate('childCategoryId', { categoryName: 1 });
            if (_.isEmpty(brand)) {
                return this.res.send({ status: 0, message: "Brand details not found" });
            }
            return this.res.send({ status: 1, data: brand });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: single and multiple Brand change status
    Parameter:
    {
        "brandIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfBrands() {
        try {
            let msg = "Brand status not updated";
            const updatedBrands = await Brands.updateMany({ _id: { $in: this.req.body.brandIds } }, { $set: { status: this.req.body.status } });
            if (updatedBrands) {
                msg = updatedBrands.modifiedCount ? updatedBrands.modifiedCount + " Brand updated" : updatedBrands.matchedCount == 0 ? "Brand not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Brand details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "brandIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteBrands() {
        try {
            if (!this.req.body.brandIds) {
                return this.res.send({ status: 0, message: "Please send brandIds" });
            }
            let msg = 'Brand not deleted.';
            let status = 1;
            const updatedBrands = await Brands.updateMany({ _id: { $in: this.req.body.brandIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedBrands) {
                msg = updatedBrands.modifiedCount ? updatedBrands.modifiedCount + ' Brand deleted.' : updatedBrands.matchedCount == 0 ? "Details not found" : msg;
                status = updatedBrands.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Brands Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-10-25",
          "searchText": "",
           "filter":{
                "isFood": false,
                "isVegetables":false,
                "isEcommerce": true,
                "isGame": false
            },
      }
      Return: JSON String
      ********************************************************/
    async brandsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ name: regex }, { website: regex },
                    { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            const result = await Brands.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, name: 1, status: 1, website: 1, image: 1, topBrand: 1,
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Brands.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: Download csv and excel files
     Method: Post
     Authorisation: true
     Parameter:
     {
        "type":"csv" or "excel",
        "startDate":"2022-09-20",
        "endDate":"2023-09-25",
        "searchText": "",
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false
        },
        "filteredFields":  ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Brand Name", "Website", "Image", "Top Brand", "Status"]
     }
     Return: JSON String
     ********************************************************/
    async downloadBrandFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Brand Name", "Website", "Image", "Top Brand", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ name: regex }, { website: regex },
                    { "category.categoryName": regex }, { "subCategory.categoryName": regex }, { "childCategory.categoryName": regex }]
                })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            data['model'] = Brands;
            data['stages'] = [
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                { $match: { $and: query } },];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Category Name": "$category.categoryName",
                    "Sub-Category Name": "$subCategory.categoryName",
                    "Child-Category Name": "$childCategory.categoryName",
                    "Brand Name": "$name",
                    Website: "$website",
                    Image: '$image',
                    "Top Brand": '$topBrand',
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'brands'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose:Getting Dropdowns For Brands In Admin
   Method: Post
   Authorisation: true
   {
       "searchText":"as",
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false
        },
   }
   Return: JSON String
   ********************************************************/
    async brandsList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            const result = await Brands.find({ $and: query }, { name: 1 }).sort({ _id: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = BrandsController;