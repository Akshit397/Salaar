/** @format */

const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Games } = require("../../models/s_games");
const { Categories } = require("../../models/s_category");
const Model = require("../../utilities/model");
const DownloadsController = require("../common/downloads");
const RequestBody = require("../../utilities/requestBody");

class GamesController extends Controller {
  constructor() {
    super();
    this.requestBody = new RequestBody();
  }

  /********************************************************
      Purpose: Add and update Game details
      Method: Post
      Authorisation: true
      Parameter:
      {
          "name": "PostPaid",
          "gameUrl":5,
          "image":"image.png"
          "categoryId": "",
          "status": true,
          "gameId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
  async addAndUpdateGame() {
    try {
      let data = this.req.body;
      const fieldsArray = ["name", "gameUrl", "image", "categoryId"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      }
      const checkCategory = await Categories.findOne({
        _id: data.categoryId,
        isDeleted: false,
      });
      if (_.isEmpty(checkCategory)) {
        return this.res.send({
          status: 0,
          message: "Category details not found",
        });
      }
      if (data.gameId) {
        const checkName = await Games.findOne({
          name: data.name,
          _id: { $nin: [data.gameId] },
          isDeleted: false,
        });
        if (!_.isEmpty(checkName))
          return this.res.send({ status: 0, message: "Name already exists" });
        // data.gameUrl = this.req.protocol +
        //   "://" +
        //   this.req.get("host") +
        //   "/" +
        //   encodeURIComponent(data.gameUrl);
        data.gameUrl = "https://api.salar.in/" + data.gameUrl;
        await Games.findByIdAndUpdate(data.gameId, data, {
          new: true,
          upsert: true,
        });
        return this.res.send({
          status: 1,
          message: "Game updated successfully",
        });
      } else {
        const checkName = await Games.findOne({ name: data.name });
        if (!_.isEmpty(checkName))
          return this.res.send({ status: 0, message: "Name already exists" });
        // data.gameUrl =
        //   this.req.protocol +
        //   "://" +
        //   this.req.get("host") +
        //   "/" +
        //   encodeURIComponent(data.gameUrl);
        data.gameUrl = "https://api.salar.in/" + data.gameUrl;
        const newGame = await new Model(Games).store(data);
        if (_.isEmpty(newGame)) {
          return this.res.send({
            status: 0,
            message: "Game details not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Game details added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }

  /********************************************************
   Purpose: Get Game Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
  async getGameDetails() {
    try {
      const data = this.req.params;
      if (!data.gameId) {
        return this.res.send({ status: 0, message: "Please send gameId" });
      }
      const game = await Games.findOne(
        { _id: data.gameId, isDeleted: false },
        { _v: 0 }
      ).populate("categoryId", { categoryName: 1 });
      if (_.isEmpty(game)) {
        return this.res.send({ status: 0, message: "Game details not found" });
      }
      return this.res.send({ status: 1, data: game });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
     Purpose: single and multiple Game change status
    Parameter:
    {
        "gameIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
  async changeStatusOfGames() {
    try {
      let msg = "Game status not updated";
      const updatedGames = await Games.updateMany(
        { _id: { $in: this.req.body.gameIds } },
        { $set: { status: this.req.body.status } }
      );
      if (updatedGames) {
        msg = updatedGames.modifiedCount
          ? updatedGames.modifiedCount + " Game updated"
          : updatedGames.matchedCount == 0
            ? "Game not exists"
            : msg;
      }
      return this.res.send({ status: 1, message: msg });
    } catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }

  /********************************************************
   Purpose: Delete Game details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "gameIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
  async deleteGames() {
    try {
      if (!this.req.body.gameIds) {
        return this.res.send({ status: 0, message: "Please send gameIds" });
      }
      let msg = "Game not deleted.";
      let status = 1;
      const updatedGames = await Games.updateMany(
        { _id: { $in: this.req.body.gameIds }, isDeleted: false },
        { $set: { isDeleted: true } }
      );
      if (updatedGames) {
        msg = updatedGames.modifiedCount
          ? updatedGames.modifiedCount + " Game deleted."
          : updatedGames.matchedCount == 0
            ? "Details not found"
            : msg;
        status = updatedGames.matchedCount == 0 ? 0 : 1;
      }
      return this.res.send({ status, message: msg });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
      Purpose: Games Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
  async gamesListing() {
    try {
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({
          key: "createdAt",
          startDate: data.startDate,
          endDate: data.endDate,
        });
        console.log(`query: ${JSON.stringify(query)}`);
      }
      if (data.searchText) {
        const regex = {
          $regex: `.*${this.req.body.searchText}.*`,
          $options: "i",
        };
        query.push({
          $or: [
            { name: regex },
            { imageUrl: regex },
            { "category.categoryName": regex },
          ],
        });
      }
      const result = await Games.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
        { $match: { $and: query } },
        {
          $project: {
            createdAt: 1,
            name: 1,
            gameUrl: 1,
            image: 1,
            status: 1,
            "category._id": "$category._id",
            "category.categoryName": "$category.categoryName",
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Games.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
        { $match: { $and: query } },
        { $project: { _id: 1 } },
      ]);
      return this.res.send({
        status: 1,
        message: "Listing details are: ",
        data: result,
        page: data.page,
        pagesize: data.pagesize,
        total: total.length,
      });
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
          "endDate":"2022-09-25",
          "searchText": "",
          "filteredFields":  ["Date", "Category Name","Name", "Game Url", "Image", "Status"]
      }
     Return: JSON String
     ********************************************************/
  async downloadGameFiles() {
    try {
      let data = this.req.body;
      if (!data.type) {
        return this.res.send({
          status: 0,
          message: "Please send type of the file to download",
        });
      }
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({
          key: "createdAt",
          startDate: data.startDate,
          endDate: data.endDate,
        });
        console.log(`query: ${JSON.stringify(query)}`);
      }
      data.filteredFields = data.filteredFields
        ? data.filteredFields
        : ["Date", "Category Name", "Name", "Game Url", "Image", "Status"];
      if (data.searchText) {
        const regex = {
          $regex: `.*${this.req.body.searchText}.*`,
          $options: "i",
        };
        query.push({
          $or: [
            { name: regex },
            { imageUrl: regex },
            { "category.categoryName": regex },
          ],
        });
      }
      data["model"] = Games;
      data["stages"] = [
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
        { $match: { $and: query } },
      ];
      data["projectData"] = [
        {
          $project: {
            Date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            "Category Name": "$category.categoryName",
            Name: "$name",
            "Game Url": "$gameUrl",
            Image: "$image",
            Status: "$status",
          },
        },
      ];
      data["key"] = "createdAt";
      data["query"] = { isDeleted: false };
      data["filterQuery"] = {};
      data["fileName"] = "games";

      const download = await new DownloadsController().downloadFiles(data);
      return this.res.send({
        status: 1,
        message: `${data.type.toUpperCase()} downloaded successfully`,
        data: download,
      });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose:Getting Dropdowns For games In Admin
    Method: Post
    Authorisation: true
    {
        "searchText":"as",
        "categoryId":""
    }
    Return: JSON String
    ********************************************************/
  async gamesList() {
    try {
      const skip = 0;
      const limit = 20;
      const data = this.req.body;
      let query = data.categoryId
        ? [{ isDeleted: false, "category._id": ObjectID(data.categoryId) }]
        : [{ isDeleted: false }];
      if (data.searchText) {
        const regex = {
          $regex: `.*${this.req.body.searchText}.*`,
          $options: "i",
        };
        query.push({
          $or: [
            { name: regex },
            { imageUrl: regex },
            { "category.categoryName": regex },
          ],
        });
      }
      const result = await Games.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
        { $match: { $and: query } },
        { $project: { name: 1 } },
        { $sort: { _id: -1 } },
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
module.exports = GamesController;
