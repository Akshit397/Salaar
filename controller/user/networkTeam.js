/** @format */

const _ = require("lodash");
const { ObjectID } = require("mongodb");
const Controller = require("../base");
const { Users } = require("../../models/s_users");
const { TeamLevels } = require("../../models/s_team_levels");

class NetworkTeamController extends Controller {
  constructor() {
    super();
  }

  /********************************************************
    Purpose: Get Pending Team Members to align in levels
    Method: POST
    {
        "searchText":""
    }
    Authorisation: true            
    Return: JSON String
    ********************************************************/
  async getPendingTeamMembers() {
    try {
      const currentUserId = this.req.user;
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let query = [{}];
      if (this.req.body.searchText) {
        let regex = {
          $regex: `.*${this.req.body.searchText}.*`,
          $options: "i",
        };
        query.push({
          $or: [{ emailId: regex }, { fullName: regex }, { registerId: regex }],
        });
      }
      const pendingUsers = await Users.find(
        {
          sponserId: user.registerId,
          level: -1,
          isDeleted: false,
          $and: query,
        },
        { ulDownlineId: 1, registerId: 1, emailId: 1, fullName: 1 },
      );
      return this.res.send({ status: 1, data: pendingUsers });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: Getting Pending Level Details to align in levels
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
  async getPendingLevelDetails() {
    try {
      const currentUserId = this.req.user;
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1, depth: 1 },
      );
      if (_.isEmpty(teamLevels)) {
        teamLevels.depth = 1;
        teamLevels.width = 1;
      }
      const pendingUsersLevels = await Users.aggregate([
        { $match: { _id: ObjectID(currentUserId), isDeleted: false } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$registerId",
            connectFromField: "registerId",
            connectToField: "ulDownlineId",
            as: "users",
            maxDepth: teamLevels.depth - 1,
            restrictSearchWithMatch: { isDeleted: false, level: 1 },
          },
        },
        { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$users._id",

            ulDownlineId: "$users.ulDownlineId",
            registerId: "$users.registerId",
            emailId: "$users.emailId",
            fullName: "$users.fullName",
          },
        },
        {
          $group: {
            _id: "$ulDownlineId",
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
            ulDownlineId: "$_id",
            users: 1,
            usersAvailable: { $size: "$users" },
            usersPending: {
              $subtract: [teamLevels.width, { $size: "$users" }],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { ulDownlineId: "$ulDownlineId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                },
              },
            ],
            as: "parentUser",
          },
        },
        { $unwind: { path: "$parentUser", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ulDownlineId: "$_id",
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
      let level = 1;
      let pendingLevels = [];
      let mainObject = {};
      await pendingUsersLevels.map((users, index) => {
        if (users.ulDownlineId == user.registerId) {
          [mainObject] = pendingUsersLevels.splice(index, 1);
          const { mainUser, usersPending } = mainObject;
          pendingLevels.push({
            level,
            vacantPlace: usersPending,
            fullName: mainUser.fullName,
            emailId: mainUser.emailId,
            registerId: mainUser.registerId,
            _id: mainUser._id,
          });
          level++;
        }
      });
      while (pendingUsersLevels.length > 0) {
        pendingLevels = await this.getLevels({
          level,
          users: mainObject.users,
          pendingUsersLevels,
          pendingLevels,
          width: teamLevels.width
        });
      }
      pendingLevels = await _.remove(pendingLevels, level => {
        return level.vacantPlace > 0;
      });
      // remove duplicate elements from the array
      pendingLevels = _.uniqBy(pendingLevels, e => {
        return e.emailId;
      });
      // sort elements from the array
      pendingLevels = _.sortBy(pendingLevels, ["level", "vacantPlace"]);
      return this.res.send({ status: 1, data: pendingLevels });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getLevels({ level, users, pendingUsersLevels, pendingLevels, width }) {
    let totalUsers = [];
    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        if (pendingUsersLevels.length > 0) {
          await pendingUsersLevels.map(async (user, index) => {
            if (user.ulDownlineId == users[i].registerId) {
              const newUser = pendingUsersLevels.splice(index, 1);
              const { mainUser, usersPending, users } = newUser[0];
              await pendingLevels.unshift({
                level,
                vacantPlace: usersPending,
                fullName: mainUser.fullName,
                emailId: mainUser.emailId,
                registerId: mainUser.registerId,
                _id: mainUser._id,
              });
              await totalUsers.push(...users);
            } else {
              await pendingLevels.push({
                level: level,
                vacantPlace: width,
                fullName: users[i].fullName,
                emailId: users[i].emailId,
                registerId: users[i].registerId,
                _id: users[i]._id,
              });
            }
          });
        } else {
          for (let i = 0; i < users.length; i++) {
            await pendingLevels.push({
              level: level,
              vacantPlace: width,
              fullName: users[i].fullName,
              emailId: users[i].emailId,
              registerId: users[i].registerId,
              _id: users[i]._id,
            });
          }
        }
      }
    }
    if (totalUsers.length > 0) {
      await this.getLevels({
        level: level + 1,
        users: totalUsers,
        pendingUsersLevels,
        pendingLevels,
        width
      });
    }
    return pendingLevels;
  }

  /********************************************************
   Purpose: add team member
   Method: POST
   {
        userId:"",
        teamMemberId:"",
   }
   Authorisation: true            
   Return: JSON String
   ********************************************************/
  async addTeamMember() {
    try {
      const currentUserId = this.req.user;
      const data = this.req.body;
      // getting main user details
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      // validating the user has sponserId of main user
      const validUser = await Users.findOne({
        _id: ObjectID(data.userId),
        sponserId: user.registerId,
        ulDownlineId: user.registerId,
        level: -1,
      });
      if (_.isEmpty(validUser)) {
        return this.res.send({
          status: 0,
          message: "User is already allocated to other team",
        });
      }
      // getting teamMemberdetails
      const getTeamMemberDetails = await Users.findOne(
        { _id: ObjectID(data.teamMemberId) },
        { registerId: 1 },
      );
      if (_.isEmpty(getTeamMemberDetails)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1 },
      );
      console.log(`teamLevels.width: ${teamLevels.width}`);
      if (_.isEmpty(teamLevels)) {
        teamLevels.width = 1;
      }
      let level = -1;
      if (getTeamMemberDetails.registerId) {
        const usersCount = await Users.count({
          ulDownlineId: getTeamMemberDetails.registerId,
          isDeleted: false,
        });
        level = usersCount < teamLevels.width ? 1 : -1;
      }
      if (level == -1) {
        return this.res.send({
          status: 0,
          message: "There is no place for this user, under this team member",
        });
      }
      const updatedUser = await Users.findOneAndUpdate(
        { _id: data.userId },
        { level, ulDownlineId: getTeamMemberDetails.registerId },
      );
      console.log(`updatedUser: ${JSON.stringify(updatedUser)}`);
      if (_.isEmpty(updatedUser)) {
        return this.res.send({
          status: 0,
          message: "User details not updated",
        });
      }
      return this.res.send({
        status: 1,
        message: "User details updated successfully",
      });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
     Purpose: Get team tree Details
    Method: Get
    Authorisation: true            
    Return: JSON String
    ********************************************************/
  async getTeamTreeDetails() {
    try {
      const currentUserId = this.req.user;
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1, depth: 1 },
      );
      if (_.isEmpty(teamLevels)) {
        teamLevels.depth = 1;
        teamLevels.width = 1;
      }
      const pendingUsersLevels = await Users.aggregate([
        { $match: { _id: ObjectID(currentUserId), isDeleted: false } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$registerId",
            connectFromField: "registerId",
            connectToField: "ulDownlineId",
            as: "users",
            maxDepth: teamLevels.depth - 1,
            restrictSearchWithMatch: { isDeleted: false, level: 1 },
          },
        },
        { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$users._id",

            ulDownlineId: "$users.ulDownlineId",
            registerId: "$users.registerId",
            emailId: "$users.emailId",
            fullName: "$users.fullName",
          },
        },
        {
          $group: {
            _id: "$ulDownlineId",
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
            ulDownlineId: "$_id",
            users: 1,
            usersAvailable: { $size: "$users" },
            usersPending: {
              $subtract: [teamLevels.width, { $size: "$users" }],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { ulDownlineId: "$ulDownlineId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                },
              },
            ],
            as: "parentUser",
          },
        },
        { $unwind: { path: "$parentUser", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ulDownlineId: "$_id",
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

      let level = 1;
      let mainObject = {};
      let levels = [];
      await pendingUsersLevels.map((users, index) => {
        if (users.ulDownlineId == user.registerId) {
          [mainObject] = pendingUsersLevels.splice(index, 1);
          const { mainUser, users, usersAvailable } = mainObject;
          const status =
            teamLevels.width - usersAvailable == 0 ? "Completed" : "Pending";
          let usersArray = [];
          for (let k = 0; k < users.length; k++) {
            usersArray.push({ ...users[k], mainUser });
          }
          levels.push({
            level,
            requiredMembers: teamLevels.width,
            joinedMembers: usersAvailable,
            status,
            earnings: 0,
            users: usersArray,
          });
          level++;
        }
      });
      while (
        pendingUsersLevels.length > 0 ||
        (pendingUsersLevels.length == 1 &&
          pendingUsersLevels[0].users.length > 0)
      ) {
        if (!pendingUsersLevels[0].users[0].registerId) {
          break;
        }
        levels = await this.getTeamMembers({
          level,
          users: mainObject.users,
          pendingUsersLevels,
          levels,
          width: teamLevels.width,
        });
      }
      return this.res.send({ status: 1, data: levels });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getTeamTreeDetailsByRegisterID() {
    try {
      const currentUserId = this.req.params;
      const userR = await Users.findOne(
        {
          registerId: currentUserId.registerId,
        },
        { _id: 1 },
      );

      const user = await Users.findOne(
        { _id: ObjectID(userR._id) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1, depth: 1 },
      );
      if (_.isEmpty(teamLevels)) {
        teamLevels.depth = 1;
        teamLevels.width = 1;
      }
      const pendingUsersLevels = await Users.aggregate([
        { $match: { _id: ObjectID(userR._id), isDeleted: false } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$registerId",
            connectFromField: "registerId",
            connectToField: "ulDownlineId",
            as: "users",
            maxDepth: teamLevels.depth - 1,
            restrictSearchWithMatch: { isDeleted: false, level: 1 },
          },
        },
        { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$users._id",
            ulDownlineId: "$users.ulDownlineId",
            registerId: "$users.registerId",
            emailId: "$users.emailId",
            fullName: "$users.fullName",
          },
        },
        {
          $group: {
            _id: "$ulDownlineId",
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
            ulDownlineId: "$_id",
            users: 1,
            usersAvailable: { $size: "$users" },
            usersPending: {
              $subtract: [teamLevels.width, { $size: "$users" }],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { ulDownlineId: "$ulDownlineId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                },
              },
            ],
            as: "parentUser",
          },
        },
        { $unwind: { path: "$parentUser", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ulDownlineId: "$_id",
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
      let level = 1;
      let mainObject = {};
      let levels = [];
      await pendingUsersLevels.map((users, index) => {
        if (users.ulDownlineId == user.registerId) {
          [mainObject] = pendingUsersLevels.splice(index, 1);
          const { mainUser, users, usersAvailable } = mainObject;
          const status =
            teamLevels.width - usersAvailable == 0 ? "Completed" : "Pending";
          let usersArray = [];
          for (let k = 0; k < users.length; k++) {
            usersArray.push({ ...users[k], mainUser });
          }
          levels.push({
            level,
            requiredMembers: teamLevels.width,
            joinedMembers: usersAvailable,
            status,
            earnings: 0,
            users: usersArray,
          });
          level++;
        }
      });
      while (pendingUsersLevels.length > 0) {
        levels = await this.getTeamMembers({
          level,
          users: mainObject.users,
          pendingUsersLevels,
          levels,
          width: teamLevels.width,
        });
      }
      let levelData = "";
      if (this.req.params.level) {
        if (levels[this.req.params.level - 1]?.level == this.req.params.level) {
          levelData = {
            level: levels[this.req.params.level - 1].level,
            requiredMembers: levels[this.req.params.level - 1].requiredMembers,
            joinedMembers: levels[this.req.params.level - 1].joinedMembers,
            status: levels[this.req.params.level - 1].status,
            earnings: levels[this.req.params.level - 1].earnings,
          };

          return this.res.send({ status: 1, data: levelData });
        } else {
          return this.res.send({ status: 1, data: levelData });
        }
      }
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getTeamMembers({ level, users, pendingUsersLevels, levels, width }) {
    let totalUsers = [];
    let usersArray = [];
    let joinedMembers = 0;
    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        await pendingUsersLevels.map(async (user, index) => {
          if (user.ulDownlineId == users[i].registerId) {
            const newUser = pendingUsersLevels.splice(index, 1);
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
        earnings: 0,
        users: usersArray,
      });

      if (totalUsers.length > 0) {
        await this.getTeamMembers({
          level: level + 1,
          users: totalUsers,
          pendingUsersLevels,
          levels,
          width,
        });
      }
    }

    return levels;
  }

  /********************************************************
     Purpose: Getting first level details of the user
    Method: Get
    Authorisation: true            
    Return: JSON String
    ********************************************************/
  async getFirstLevelDetails() {
    try {
      const currentUserId = this.req.user;
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1 },
      );
      if (_.isEmpty(teamLevels)) {
        teamLevels.width = 1;
      }
      const usersCount = await Users.count({
        ulDownlineId: this.req.params.registerId,
        isDeleted: false,
        level: 1,
      });
      const userDetails = {
        requiredMembers: teamLevels.width,
        joinedMembers: usersCount,
        status: teamLevels.width - usersCount == 0 ? "Completed" : "Pending",
        earnings: 0,
      };
      return this.res.send({ status: 1, data: userDetails });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
     Purpose: Getting network team count of the user for dashboard
    Method: Get
    Authorisation: true            
    Return: JSON String
    ********************************************************/
  async getNetworkTeamCount() {
    try {
      const currentUserId = this.req.user;
      const user = await Users.findOne(
        { _id: ObjectID(currentUserId) },
        { registerId: 1 },
      );
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User not found" });
      }
      let teamLevels = await TeamLevels.findOne(
        { isDeleted: false, status: true },
        { width: 1, depth: 1 },
      );
      if (_.isEmpty(teamLevels)) {
        teamLevels.depth = 1;
        teamLevels.width = 1;
      }
      const count = await Users.aggregate([
        { $match: { _id: ObjectID(currentUserId), isDeleted: false } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$registerId",
            connectFromField: "registerId",
            connectToField: "ulDownlineId",
            as: "users",
            maxDepth: teamLevels.depth - 1,
            restrictSearchWithMatch: { isDeleted: false, level: 1 },
          },
        },
        { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$users._id",
            emailId: "$users.emailId",
          },
        },
        { $match: { _id: { $ne: ObjectID(currentUserId) } } },
        { $count: "networkTeamCount" },
      ]);
      return this.res.send({ status: 1, data: count[0] });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
}
module.exports = NetworkTeamController;
