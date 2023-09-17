const _ = require("lodash");
const { ObjectID } = require("mongodb");
const Controller = require("../base");
const { SellerCategories } = require("../../models/s_seller_categories");
const RequestBody = require("../../utilities/requestBody");

const categoryStages = [
  {
    $lookup: {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];
const subCategoryStages = [
  {
    $lookup: {
      from: "categories",
      localField: "subCategoryId",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];
const childCategoryStages = [
  {
    $lookup: {
      from: "categories",
      localField: "childCategoryId",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
];
class CategoriesController extends Controller {
  constructor() {
    super();
    this.requestBody = new RequestBody();
  }

  /********************************************************
   Purpose:Getting Dropdowns For Filters In CategoryListing In Admin
   Method: Post
   Authorisation: true
   {
       "type":"subCategory1",
       "sellerId":""
       "parentCategory":"5ccc4c8e5a16ae2b47ced986",
       "searchText":"as",
       "filter":{
           "category.isFood": false,
           "category.isVegetables":false,
           "category.isEcommerce": true,
           "category.isGame": false
       },
   }
   Return: JSON String
   ********************************************************/
  async sellerCategoryList() {
    try {
      const skip = 0;
      const limit = 20;
      const currentSellerId = this.req.body.sellerId;
      let data = this.req.body;
      data.sellerId = currentSellerId;
      if (!data.type || !data.sellerId) {
        return this.res.send({
          status: 0,
          message: "Please send proper request params",
        });
      }
      let query = [{}];
      if (data.parentCategory) {
        query.push({
          "category.parentCategory": ObjectID(data.parentCategory),
        });
      }
      if (data.searchText) {
        let regex = {
          $regex: `.*${this.req.body.searchText}.*`,
          $options: "i",
        };
        query.push({ $or: [{ "category.categoryName": regex }] });
      }
      if (data.filter) {
        query.push(data.filter);
      }
      console.log(query);
      const stages =
        data.type == "category"
          ? categoryStages
          : data.type == "subCategory1"
            ? subCategoryStages
            : childCategoryStages;
      const result = await SellerCategories.aggregate([
        {
          $match: {
            sellerId: ObjectID(currentSellerId),
            approvalStatus: "Approved",
            isDeleted: false,
          },
        },
        ...stages,
        // { $match: { $and: query } },
        {
          $project: {
            _id: "$category._id",
            categoryName: "$category.categoryName",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
      return this.res.send({
        status: 1,
        message: "Details are: ",
        data: result,
      });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
}
module.exports = CategoriesController;
