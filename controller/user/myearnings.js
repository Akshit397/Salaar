/** @format */

const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const { GamesMLM, MLM } = require('../../models/s_game_mlm')
const { Orders } = require('../../models/s_orders')
const DownloadsController = require('../common/downloads');

class MyEarningsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }
  /********************************************************
       Purpose: listing sponser commission in users
       Method: Post
       Authorisation: true
       Parameter:
       {
           "page":1,
           "pagesize":3,
           "startDate":"2022-09-20",
           "endDate":"2023-10-25",
       }
       Return: JSON String
       ********************************************************/
  async sponsorCommissionListingInUser() {
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
        {
          $match: {
            userId: ObjectID(user),
            sponserCommission: { $exists: true },
            "isAutoRepurchase": false, $and: query
          }
        },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            dateOfPurchase: "$orders.createdAt",
            productType: {
              $cond: { if: { $eq: ["$orders.type", "isGame"] }, then: "Digital", else: "Physical" }
            },
            registerId: 1,
            sponserCommission: 1,
            type: 1, achievedDate: "$createdAt"
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), sponserCommission: { $exists: true }, "isAutoRepurchase": false, $and: query } },
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
       Purpose: listing auto repurchase commission in users
       Method: Post
       Authorisation: true
       Parameter:
       {
           "page":1,
           "pagesize":3,
           "startDate":"2022-09-20",
           "endDate":"2023-10-25",
       }
       Return: JSON String
       ********************************************************/
  async aurListingInUser() {
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
        { $match: { userId: ObjectID(user), sponserCommission: { $exists: true }, "isAutoRepurchase": true, $and: query } },
        { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
        { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            dateOfPurchase: "$orders.createdAt",
            productType: {
              $cond: { if: { $eq: ["$orders.type", "isGame"] }, then: "Digital", else: "Physical" }
            },
            registerId: 1,
            sponserCommission: 1,
            type: 1
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await GamesMLM.aggregate([
        { $match: { userId: ObjectID(user), sponserCommission: { $exists: true }, "isAutoRepurchase": true, $and: query } },
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
       Purpose: listing game commission in users
       Method: Post
       Authorisation: true
       Parameter:
       {
           "page":1,
           "pagesize":3,
           "startDate":"2022-09-20",
           "endDate":"2023-10-25",
       }
       Return: JSON String
       ********************************************************/
  async gameCommissionListingInUser() {
    try {
      if (!this.req.body.page || !this.req.body.pagesize) {
        return this.res.send({ status: 0, message: "Please send proper params" });
      }
      const user = this.req.user;
      const data = this.req.body;
      console.log(`user: ${user}`)
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
        console.log(`query: ${JSON.stringify(query)}`)
      }
      const result = await Orders.aggregate([
        { $match: { userId: ObjectID(user), "orderStatus": "paid", "status": "completed", $and: query } },
        { $lookup: { from: "mlms", localField: "_id", foreignField: "orderId", as: "mlms" } },
        { $unwind: { "path": "$mlms", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            dateOfPurchase: "$createdAt",
            productType: { $cond: { if: { $eq: ["$type", "isGame"] }, then: "Digital", else: "Physical" } },
            productName: "$products.productName",
            orderNo: "$orderId",
            genCode: "$mlms.uplinerId",
            status: { $cond: { if: { $eq: ["$mlms.autoRepurchase", true] }, then: "Completed", else: "Pending" } },
            joinedUsersCount: "$mlms.usersCount",
            requiredUsersCount: "$mlms.requiredUsersCount",
            pendingUsersCount: { $subtract: ["$mlms.requiredUsersCount", "$mlms.usersCount"] },
            commissionAmountReceived: "$mlms.commissionAmountReceived"
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Orders.aggregate([
        { $match: { userId: ObjectID(user), "orderStatus": "paid", "status": "completed", $and: query } },
        { $lookup: { from: "mlms", localField: "_id", foreignField: "orderId", as: "mlms" } },
        { $unwind: { "path": "$mlms", "preserveNullAndEmptyArrays": true } },
        { $project: { _id: 1 } }
      ])
      return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
      Purpose: Getting game tree details
      Method: GET
      Authorisation: true
      Return: JSON String
      ********************************************************/
  async getGameTreeDetails() {
    try {
      if (!this.req.params.orderId) {
        return this.res.send({ status: 0, message: "Please send proper params" });
      }
      const user = this.req.user;
      const mlmDetails = await MLM.findOne({ orderId: this.req.params.orderId, userId: user },
        { width: 1, depth: 1, gameProductId: 1, registerId: 1 }).lean()
      if (_.isEmpty(mlmDetails)) {
        return this.res.send({ status: 0, message: "MLM details not found" });
      }
      const gameTeamMembers = await MLM.aggregate([
        { $match: { "orderId": ObjectID(this.req.params.orderId), userId: ObjectID(user) } },
        {
          $graphLookup: {
            from: "mlms",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parentMlmId",
            as: "mlms",
            maxDepth: mlmDetails.depth - 1,
            restrictSearchWithMatch: { "gameProductId": ObjectID(mlmDetails.gameProductId) },
          },
        },
        { $unwind: { path: "$mlms", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "users", localField: "mlms.userId", foreignField: "_id", as: "users" } },
        { $unwind: { "path": "$users", "preserveNullAndEmptyArrays": true } },
        {
          $project: {
            _id: "$users._id",
            uplinerId: "$mlms.uplinerId",
            registerId: "$users.registerId",
            emailId: "$users.emailId",
            fullName: "$users.fullName",
          },
        },
        {
          $group: {
            _id: "$uplinerId",
            users: {
              $push: {
                registerId: "$registerId",
                emailId: "$emailId",
                fullName: "$fullName",
                _id: "$_id",
              },
            },
          },
        },
        {
          $project: {
            uplinerId: "$_id",
            users: 1,
            usersAvailable: { $size: "$users" },
            usersPending: {
              $subtract: [mlmDetails.width, { $size: "$users" }],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { uplinerId: "$uplinerId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$registerId", "$$uplinerId"] },
                },
              },
            ],
            as: "parentUser",
          },
        },
        { $unwind: { path: "$parentUser", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            uplinerId: "$_id",
            users: 1,
            usersAvailable: 1,
            usersPending: 1,
            "mainUser._id": "$parentUser._id",
            "mainUser.fullName": "$parentUser.fullName",
            "mainUser.emailId": "$parentUser.emailId",
            "mainUser.registerId": "$parentUser.registerId",
          },
        },
      ]);
      console.log(`gameTeamMembers:${JSON.stringify(gameTeamMembers)}`)
      let level = 1;
      let mainObject = {};
      let levels = [];
      if (gameTeamMembers && gameTeamMembers.length > 0 && gameTeamMembers[0]._id != null) {
        await gameTeamMembers.map((users, index) => {
          console.log(`users:${JSON.stringify(users.uplinerId)} and registerId: ${mlmDetails.registerId}`)
          if (users.uplinerId == mlmDetails.registerId) {
            console.log(`satya`)
            mainObject = (gameTeamMembers.splice(index, 1))[0];
            const { mainUser, users, usersAvailable } = mainObject;
            const status =
              mlmDetails.width - usersAvailable == 0 ? "Completed" : "Pending";
            let usersArray = [];
            for (let k = 0; k < users.length; k++) {
              usersArray.push({ ...users[k], mainUser });
            }
            levels.push({
              level,
              requiredMembers: mlmDetails.width,
              joinedMembers: usersAvailable,
              status,
              users: usersArray,
            });
            level++;
          }
        });
        while (gameTeamMembers.length > 0) {
          levels = await this.getGameTeamMembers({
            level,
            users: mainObject.users,
            gameTeamMembers,
            levels,
            width: mlmDetails.width,
          });
        }
      } else {
        levels = [];
      }
      return this.res.send({ status: 1, data: levels });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getGameTeamMembers({ level, users, gameTeamMembers, levels, width }) {
    let totalUsers = [];
    let usersArray = [];
    let joinedMembers = 0;
    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        await gameTeamMembers.map(async (user, index) => {
          if (user.uplinerId == users[i].registerId) {
            const newUser = gameTeamMembers.splice(index, 1);
            const { mainUser, users, usersAvailable } = newUser[0];
            joinedMembers += usersAvailable;
            for (let k = 0; k < users.length; k++) {
              usersArray.push({ ...users[k], mainUser });
            }
            totalUsers.push(...users);
          }
        });
      }
      const status =
        width ** level - joinedMembers == 0 ? "Completed" : "Pending";
      levels.push({
        level,
        requiredMembers: width ** level,
        joinedMembers,
        status,
        users: usersArray,
      });
      if (totalUsers.length > 0) {
        await this.getGameTeamMembers({
          level: level + 1,
          users: totalUsers,
          gameTeamMembers,
          levels,
          width,
        });
      }
    }
    return levels;
  }
}

module.exports = MyEarningsController;
