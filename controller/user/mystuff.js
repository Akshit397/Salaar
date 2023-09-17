/** @format */

const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const { GameOrdersTracking, GamesMLM } = require('../../models/s_game_mlm')
const DownloadsController = require('../common/downloads');


class MyStuffController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }
  /********************************************************
      Purpose: listing points in users
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
  async pointsListingInUser() {
    try {
      if (!this.req.body.page || !this.req.body.pagesize) {
        return this.res.send({ status: 0, message: "Please send proper params" });
      }
      const user = this.req.user;
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
        console.log(`query: ${JSON.stringify(query)}`)
      }
      const result = await GameOrdersTracking.aggregate([
        { $match: { userId: ObjectID(user), points: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            pointsValidity: 1, points: 1, purchasedType: "$orders.orderType", finalPrice: "$orders.totalAmount",
            productName: "$orders.products.productName",
            orderNo: "$orders.orderId",
            productType: {
              $cond: { if: { $eq: ["$orders.type", "isGame"] }, then: "Digital", else: "Physical" }
            },
            dateOfPurchase: "$orders.createdAt", pointsCreditedDate: "$createdAt", pointsType: 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await GameOrdersTracking.aggregate([
        { $match: { userId: ObjectID(user), points: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        { $project: { _id: 1 } }
      ])
      return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
      Purpose: listing salar coins in users
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
  async salarCoinsListingInUser() {
    try {
      if (!this.req.body.page || !this.req.body.pagesize) {
        return this.res.send({ status: 0, message: "Please send proper params" });
      }
      const user = this.req.user;
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
        console.log(`query: ${JSON.stringify(query)}`)
      }
      const result = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), salarCoins: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            dateOfPurchase: "$orders.createdAt",
            productType: {
              $cond: { if: { $eq: ["$orders.type", "isGame"] }, then: "Digital", else: "Physical" }
            },
            orderNo: "$orders.orderId",
            productName: "$orders.products.productName",
            finalPrice: "$orders.totalAmount",
            purchasedType: "$orders.orderType",
            level: 1, salarCoins: 1, achievedDate: "$createdAt",
            type: 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), salarCoins: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        { $project: { _id: 1 } }
      ])
      return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
      Purpose: listing shoppingAmount in users
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
  async shoppingAmountListingInUser() {
    try {
      if (!this.req.body.page || !this.req.body.pagesize) {
        return this.res.send({ status: 0, message: "Please send proper params" });
      }
      const user = this.req.user;
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
        console.log(`query: ${JSON.stringify(query)}`)
      }
      const result = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), shoppingAmount: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            dateOfPurchase: "$orders.createdAt",
            productType: {
              $cond: { if: { $eq: ["$orders.type", "isGame"] }, then: "Digital", else: "Physical" }
            },
            orderNo: "$orders.orderId",
            productName: "$orders.products.productName",
            finalPrice: "$orders.totalAmount",
            purchasedType: "$orders.orderType",
            level: 1, shoppingAmount: 1, achievedDate: "$createdAt",
            type: 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), shoppingAmount: { $exists: true }, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        { $project: { _id: 1 } }
      ])
      return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

}

module.exports = MyStuffController;
