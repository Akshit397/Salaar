const _ = require("lodash");

const Controller = require("../base");
const { Categories } = require('../../models/s_category');
const { SellerBrands } = require('../../models/s_seller_brands');
const { Brands } = require('../../models/s_brand');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');


const lookupStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category" } },
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory" } },
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory" } },
    { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
    { $unwind: { "path": "$brand" } },
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller" } },
]

const sellerBrandsListingStages = [
    ...lookupStages,
    {
        $project: {
            _id: 1, createdAt: 1, registerId: 1, categoryId: 1, categoryName: "$category.categoryName",
            subCategoryId: 1, subCategoryName: "$subCategory.categoryName", childCategoryId: 1, childCategoryName: "$childCategory.categoryName", brandName: "$brand.name",
            approvalStatus: 1, brand: 1, image: 1, status: 1, sellerName: "$seller.fullName"
        }
    }
]

class SellerBrandsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update SellerBrands details
      Method: Post
      Authorisation: true
      Parameter:
      {
              "categoryId":"63170e9a48fa0416e046d087",
              "subCategoryId": "631e2f3799549f026bf52533", 
              "childCategoryId": "6317105f48fa0416e046d09d", 
              "stock":1,
              "brandId":"",
              "sellerBrandId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateSellerBrands() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryId", "subCategoryId", "childCategoryId", "brandId", "stock"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const category = await Categories.findOne({ _id: data.categoryId, status: 1 }, { _id: 1 })
            if (_.isEmpty(category)) {
                return this.res.send({ status: 0, message: "Category not found" });
            }
            const subCategory = await Categories.findOne({ _id: data.subCategoryId, status: 1 }, { _id: 1 })
            if (_.isEmpty(subCategory)) {
                return this.res.send({ status: 0, message: "SubCategory not found" });
            }
            const childCategory = await Categories.findOne({ _id: data.childCategoryId, status: 1 }, { _id: 1 })
            if (_.isEmpty(childCategory)) {
                return this.res.send({ status: 0, message: "ChildCategory not found" });
            }

            const brand = await Brands.findOne({ _id: data.brandId, status: 1 }, { _id: 1 })
            if (_.isEmpty(brand)) {
                return this.res.send({ status: 0, message: "Brand not found" });
            }
            if (data.sellerBrandId) {
                await SellerBrands.findByIdAndUpdate(data.sellerBrandId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "SellerBrands details updated successfully" });
            } else {
                data.sellerId = this.req.user;
                let count = await SellerBrands.count();
                if (count <= 8) {
                    count = '0' + (count + 1);
                }
                const randomText = (await this.commonService.randomGenerator(2, 'number') + await this.commonService.randomGenerator(1, 'capital') + await this.commonService.randomGenerator(2, 'number'))
                data['registerId'] = 'SB' + randomText + count
                const newSellerBrands = await new Model(SellerBrands).store(data);
                if (_.isEmpty(newSellerBrands)) {
                    return this.res.send({ status: 0, message: "SellerBrands details not saved" })
                }
                return this.res.send({ status: 1, message: "SellerBrands details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get SellerBrands Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getSellerBrands() {
        try {
            const data = this.req.params;
            if (!data.sellerBrandId) {
                return this.res.send({ status: 0, message: "Please send sellerBrandId" });
            }
            const sellerBrands = await SellerBrands.findOne({ _id: data.sellerBrandId, isDeleted: false }, { _v: 0 })
                .populate('categoryId', { categoryName: 1, _id: 1 })
                .populate('subCategoryId', { categoryName: 1, _id: 1 })
                .populate('childCategoryId', { categoryName: 1, _id: 1 })
                .populate('sellerId', { fullName: 1, _id: 1 })
                .populate('brandId');
            if (_.isEmpty(sellerBrands)) {
                return this.res.send({ status: 0, message: "SellerBrands details not found" });
            }
            return this.res.send({ status: 1, data: sellerBrands });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple sellerBrands change status
 Parameter:
 {
    "sellerBrandIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfSellerBrands() {
        try {
            let msg = "SellerBrands status not updated";
            const updatedSellerBrands = await SellerBrands.updateMany({ _id: { $in: this.req.body.sellerBrandIds } }, { $set: { status: this.req.body.status } });
            if (updatedSellerBrands) {
                msg = updatedSellerBrands.modifiedCount ? updatedSellerBrands.modifiedCount + " seller brands updated" : updatedSellerBrands.matchedCount == 0 ? "SellerBrands not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete SellerBrands details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "sellerBrandIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteSellerBrands() {
        try {
            if (!this.req.body.sellerBrandIds) {
                return this.res.send({ status: 0, message: "Please send sellerBrandIds" });
            }
            let msg = 'SellerBrands not deleted.';
            let status = 1;
            const updatedSellerBrands = await SellerBrands.updateMany({ _id: { $in: this.req.body.sellerBrandIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedSellerBrands) {
                msg = updatedSellerBrands.modifiedCount ? updatedSellerBrands.modifiedCount + ' seller brands deleted.' : updatedSellerBrands.matchedCount == 0 ? "Details not found" : msg;
                status = updatedSellerBrands.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: sellerBrands Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-09-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
    async sellerBrandsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ categoryName: regex }, { subCategoryName: regex }, { childCategoryName: regex },
                    { approvalStatus: regex }, { brandName: regex }, { sellerName: regex }]
                })
            }
            const result = await SellerBrands.aggregate([
                { $match: { isDeleted: false } },
                ...sellerBrandsListingStages,
                { $match: { $and: query } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await SellerBrands.aggregate([
                { $match: { isDeleted: false } },
                ...sellerBrandsListingStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = SellerBrandsController;