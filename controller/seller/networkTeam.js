/** @format */

const _ = require("lodash");
const { ObjectID } = require("mongodb");
const Controller = require("../base");
const { Sellers } = require("../../models/s_sellers");
const { SellerNetworkSettings } = require("../../models/s_seller_network_settings");
const DownloadsController = require('../common/downloads');

class NetworkTeamController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Get Pending Team Members to align in levels
      Method: POST
      {
          "SearchText":""
      }
      Authorisation: true            
      Return: JSON String
      ********************************************************/
    async getPendingTeamMembers() {
        try {
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId) },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
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
            const pendingsellers = await Sellers.find(
                {
                    sponserId: seller.registerId,
                    level: -1,
                    isDeleted: false,
                    $and: query,
                },
                { ulDownlineId: 1, registerId: 1, emailId: 1, fullName: 1 },
            );
            return this.res.send({ status: 1, data: pendingsellers });
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
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId) },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            const pendingSellerLevels = await Sellers.aggregate([
                { $match: { _id: ObjectID(currentSellerId), isDeleted: false } },
                {
                    $graphLookup: {
                        from: "sellers",
                        startWith: "$registerId",
                        connectFromField: "registerId",
                        connectToField: "ulDownlineId",
                        as: "sellers",
                        maxDepth: sellerNetworkSettings.depth - 1,
                        restrictSearchWithMatch: { isDeleted: false, level: 1 },
                    },
                },
                { $unwind: { path: "$sellers", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: "$sellers._id",
                        ulDownlineId: "$sellers.ulDownlineId",
                        registerId: "$sellers.registerId",
                        emailId: "$sellers.emailId",
                        fullName: "$sellers.fullName",
                    },
                },
                {
                    $group: {
                        _id: "$ulDownlineId",
                        sellers: {
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
                        sellers: 1,
                        sellersAvailable: { $size: "$sellers" },
                        sellersPending: {
                            $subtract: [sellerNetworkSettings.width, { $size: "$sellers" }],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "sellers",
                        let: { ulDownlineId: "$ulDownlineId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                                },
                            },
                        ],
                        as: "parentSeller",
                    },
                },
                { $unwind: { path: "$parentSeller", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        ulDownlineId: "$_id",
                        sellers: 1,
                        sellersAvailable: 1,
                        sellersPending: 1,
                        "mainSeller._id": "$parentSeller._id",
                        "mainSeller.fullName": "$parentSeller.fullName",
                        "mainSeller.emailId": "$parentSeller.emailId",
                        "mainSeller.registerId": "$parentSeller.registerId",
                    },
                },
            ]);
            let level = 1;
            let pendingLevels = [];
            let mainObject = {};
            const sellerLevels = [...pendingSellerLevels];
            await pendingSellerLevels.map((sellers, index) => {
                if (sellers.ulDownlineId == seller.registerId) {
                    [mainObject] = pendingSellerLevels.splice(index, 1);
                    const { mainSeller, sellersPending } = mainObject;
                    pendingLevels.push({
                        level,
                        vacantPlace: sellersPending,
                        fullName: mainSeller.fullName,
                        emailId: mainSeller.emailId,
                        registerId: mainSeller.registerId,
                        _id: mainSeller._id,
                    });
                    level++;
                }
            });
            if (sellerLevels.length == 1) {
                const levelSellers = sellerLevels[0].sellers
                for (let i = 0; i < levelSellers.length; i++) {
                    pendingLevels.push({
                        level: 2,
                        vacantPlace: sellerNetworkSettings.width,
                        fullName: levelSellers[i].fullName,
                        emailId: levelSellers[i].emailId,
                        registerId: levelSellers[i].registerId,
                        _id: levelSellers[i]._id,
                    });
                }
            }
            while (pendingSellerLevels.length > 0) {
                pendingLevels = await this.getLevels({
                    level,
                    sellers: mainObject.sellers,
                    pendingSellerLevels,
                    pendingLevels,
                    width: sellerNetworkSettings.width
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

    async getLevels({ level, sellers, pendingSellerLevels, pendingLevels, width }) {
        let totalSellers = [];
        if (sellers && sellers.length > 0) {
            for (let i = 0; i < sellers.length; i++) {
                if (pendingSellerLevels.length > 0) {
                    await pendingSellerLevels.map(async (seller, index) => {
                        if (seller.ulDownlineId == sellers[i].registerId) {
                            const newseller = pendingSellerLevels.splice(index, 1);
                            const { mainSeller, sellersPending, sellers } = newseller[0];
                            await pendingLevels.unshift({
                                level,
                                vacantPlace: sellersPending,
                                fullName: mainSeller.fullName,
                                emailId: mainSeller.emailId,
                                registerId: mainSeller.registerId,
                                _id: mainSeller._id,
                            });
                            await totalSellers.push(...sellers);
                        } else {
                            await pendingLevels.push({
                                level: level,
                                vacantPlace: width,
                                fullName: sellers[i].fullName,
                                emailId: sellers[i].emailId,
                                registerId: sellers[i].registerId,
                                _id: sellers[i]._id,
                            });
                        }
                    });
                } else {
                    for (let i = 0; i < sellers.length; i++) {
                        await pendingLevels.push({
                            level: level,
                            vacantPlace: width,
                            fullName: sellers[i].fullName,
                            emailId: sellers[i].emailId,
                            registerId: sellers[i].registerId,
                            _id: sellers[i]._id,
                        });
                    }
                }
            }
        }
        if (totalSellers.length > 0) {
            await this.getLevels({
                level: level + 1,
                sellers: totalSellers,
                pendingSellerLevels,
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
          sellerId:"",
          teamMemberId:"",
     }
     Authorisation: true            
     Return: JSON String
     ********************************************************/
    async addTeamMember() {
        try {
            const currentSellerId = this.req.user;
            const data = this.req.body;
            // getting main seller details
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId) },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            // validating the seller has sponserId of main seller
            const validseller = await Sellers.findOne({
                _id: ObjectID(data.sellerId),
                sponserId: seller.registerId,
                ulDownlineId: seller.registerId,
                level: -1,
            });
            if (_.isEmpty(validseller)) {
                return this.res.send({
                    status: 0,
                    message: "Seller is already allocated to other team",
                });
            }
            // getting teamMemberdetails
            const getTeamMemberDetails = await Sellers.findOne(
                { _id: ObjectID(data.teamMemberId) },
                { registerId: 1 },
            );
            if (_.isEmpty(getTeamMemberDetails)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1 },
            );
            console.log(`sellerNetworkSettings.width: ${sellerNetworkSettings.width}`);
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.width = 1;
            }
            let level = -1;
            if (getTeamMemberDetails.registerId) {
                const sellersCount = await Sellers.count({
                    ulDownlineId: getTeamMemberDetails.registerId,
                    isDeleted: false,
                });
                level = sellersCount < sellerNetworkSettings.width ? 1 : -1;
            }
            if (level == -1) {
                return this.res.send({
                    status: 0,
                    message: "There is no place for this seller, under this team member",
                });
            }
            const updatedseller = await Sellers.findOneAndUpdate(
                { _id: data.sellerId },
                { level, ulDownlineId: getTeamMemberDetails.registerId },
            );
            console.log(`updatedseller: ${JSON.stringify(updatedseller)}`);
            if (_.isEmpty(updatedseller)) {
                return this.res.send({
                    status: 0,
                    message: "Seller details not updated",
                });
            }
            return this.res.send({
                status: 1,
                message: "Seller details updated successfully",
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
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId), isDeleted: false },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            const pendingSellerLevels = await Sellers.aggregate([
                { $match: { _id: ObjectID(currentSellerId), isDeleted: false } },
                {
                    $graphLookup: {
                        from: "sellers",
                        startWith: "$registerId",
                        connectFromField: "registerId",
                        connectToField: "ulDownlineId",
                        as: "sellers",
                        maxDepth: sellerNetworkSettings.depth - 1,
                        restrictSearchWithMatch: { isDeleted: false, level: 1 },
                    },
                },
                { $unwind: { path: "$sellers", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: "$sellers._id",
                        ulDownlineId: "$sellers.ulDownlineId",
                        registerId: "$sellers.registerId",
                        emailId: "$sellers.emailId",
                        fullName: "$sellers.fullName",
                    },
                },
                {
                    $group: {
                        _id: "$ulDownlineId",
                        sellers: {
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
                        sellers: 1,
                        sellersAvailable: { $size: "$sellers" },
                        sellersPending: {
                            $subtract: [sellerNetworkSettings.width, { $size: "$sellers" }],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "sellers",
                        let: { ulDownlineId: "$ulDownlineId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                                },
                            },
                        ],
                        as: "parentSeller",
                    },
                },
                { $unwind: { path: "$parentSeller", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        ulDownlineId: "$_id",
                        sellers: 1,
                        sellersAvailable: 1,
                        sellersPending: 1,
                        "mainSeller._id": "$parentSeller._id",
                        "mainSeller.fullName": "$parentSeller.fullName",
                        "mainSeller.emailId": "$parentSeller.emailId",
                        "mainSeller.registerId": "$parentSeller.registerId",
                    },
                },
            ]);

            let level = 1;
            let mainObject = {};
            let levels = [];
            await pendingSellerLevels.map((sellers, index) => {
                if (sellers.ulDownlineId == seller.registerId) {
                    [mainObject] = pendingSellerLevels.splice(index, 1);
                    const { mainSeller, sellers, sellersAvailable } = mainObject;
                    const status =
                        sellerNetworkSettings.width - sellersAvailable == 0 ? "Completed" : "Pending";
                    let sellersArray = [];
                    for (let k = 0; k < sellers.length; k++) {
                        sellersArray.push({ ...sellers[k], mainSeller });
                    }
                    levels.push({
                        level,
                        requiredMembers: sellerNetworkSettings.width,
                        joinedMembers: sellersAvailable,
                        status,
                        earnings: 0,
                        sellers: sellersArray,
                    });
                    level++;
                }
            });
            while (
                pendingSellerLevels.length > 0 ||
                (pendingSellerLevels.length == 1 &&
                    pendingSellerLevels[0].sellers.length > 0)
            ) {
                if (!pendingSellerLevels[0].sellers[0].registerId) {
                    break;
                }
                levels = await this.getTeamMembers({
                    level,
                    sellers: mainObject.sellers,
                    pendingSellerLevels,
                    levels,
                    width: sellerNetworkSettings.width,
                });
            }
            return this.res.send({ status: 1, data: levels });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    async getTeamMembers({ level, sellers, pendingSellerLevels, levels, width }) {
        let totalSellers = [];
        let sellersArray = [];
        let joinedMembers = 0;
        if (sellers && sellers.length > 0) {
            for (let i = 0; i < sellers.length; i++) {
                await pendingSellerLevels.map(async (seller, index) => {
                    if (seller.ulDownlineId == sellers[i].registerId) {
                        const newseller = pendingSellerLevels.splice(index, 1);
                        const { mainSeller, sellers, sellersAvailable } = newseller[0];
                        console.log(`sellers: ${JSON.stringify(sellers)}`)
                        joinedMembers += sellersAvailable;
                        for (let k = 0; k < sellers.length; k++) {
                            sellersArray.push({ ...sellers[k], mainSeller });
                        }
                        totalSellers.push(...sellers);
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
                sellers: sellersArray,
            });

            if (totalSellers.length > 0) {
                await this.getTeamMembers({
                    level: level + 1,
                    sellers: totalSellers,
                    pendingSellerLevels,
                    levels,
                    width,
                });
            }
        }

        return levels;
    }

    /********************************************************
       Purpose: Getting first level details of the seller
      Method: Get
      Authorisation: true            
      Return: JSON String
      ********************************************************/
    async getFirstLevelDetails() {
        try {
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId) },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.width = 1;
            }
            const sellersCount = await Sellers.count({
                ulDownlineId: this.req.params.registerId,
                isDeleted: false,
                level: 1,
            });
            const sellerDetails = {
                requiredMembers: sellerNetworkSettings.width,
                joinedMembers: sellersCount,
                status: sellerNetworkSettings.width - sellersCount == 0 ? "Completed" : "Pending",
                earnings: 0,
            };
            return this.res.send({ status: 1, data: sellerDetails });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: Getting network team count of the seller for dashboard
      Method: Get
      Authorisation: true            
      Return: JSON String
      ********************************************************/
    async getNetworkTeamCount() {
        try {
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId) },
                { registerId: 1 },
            );
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            const count = await Sellers.aggregate([
                { $match: { _id: ObjectID(currentSellerId), isDeleted: false } },
                {
                    $graphLookup: {
                        from: "sellers",
                        startWith: "$registerId",
                        connectFromField: "registerId",
                        connectToField: "ulDownlineId",
                        as: "sellers",
                        maxDepth: sellerNetworkSettings.depth - 1,
                        restrictSearchWithMatch: { isDeleted: false, level: 1 },
                    },
                },
                { $unwind: { path: "$sellers", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: "$sellers._id",
                        emailId: "$sellers.emailId",
                    },
                },
                { $match: { _id: { $ne: ObjectID(currentSellerId) } } },
                { $count: "networkTeamCount" },
            ]);
            return this.res.send({ status: 1, data: count[0] });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: Getting team tree details by registerId getTeamTreeDetailsByRegisterID
    Method: Get
    Authorisation: true            
    Return: JSON String
    ********************************************************/
    async getTeamTreeDetailsByRegisterID() {
        try {
            const params = this.req.params;
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { registerId: params.registerId, isDeleted: false },
                { _id: 1, registerId: 1 },
            );

            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            let sellerNetworkSettings = await SellerNetworkSettings.findOne(
                { isDeleted: false, status: true },
                { width: 1, depth: 1 },
            );
            if (_.isEmpty(sellerNetworkSettings)) {
                sellerNetworkSettings.depth = 1;
                sellerNetworkSettings.width = 1;
            }
            const pendingSellerLevels = await Sellers.aggregate([
                { $match: { _id: ObjectID(currentSellerId), isDeleted: false } },
                {
                    $graphLookup: {
                        from: "sellers",
                        startWith: "$registerId",
                        connectFromField: "registerId",
                        connectToField: "ulDownlineId",
                        as: "sellers",
                        maxDepth: sellerNetworkSettings.depth - 1,
                        restrictSearchWithMatch: { isDeleted: false, level: 1 },
                    },
                },
                { $unwind: { path: "$sellers", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: "$sellers._id",
                        ulDownlineId: "$sellers.ulDownlineId",
                        registerId: "$sellers.registerId",
                        emailId: "$sellers.emailId",
                        fullName: "$sellers.fullName",
                    },
                },
                {
                    $group: {
                        _id: "$ulDownlineId",
                        sellers: {
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
                        sellers: 1,
                        sellersAvailable: { $size: "$sellers" },
                        sellersPending: {
                            $subtract: [sellerNetworkSettings.width, { $size: "$sellers" }],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "sellers",
                        let: { ulDownlineId: "$ulDownlineId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$registerId", "$$ulDownlineId"] },
                                },
                            },
                        ],
                        as: "parentSeller",
                    },
                },
                { $unwind: { path: "$parentSeller", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        ulDownlineId: "$_id",
                        sellers: 1,
                        sellersAvailable: 1,
                        sellersPending: 1,
                        "mainSeller._id": "$parentSeller._id",
                        "mainSeller.fullName": "$parentSeller.fullName",
                        "mainSeller.emailId": "$parentSeller.emailId",
                        "mainSeller.registerId": "$parentSeller.registerId",
                    },
                },
            ]);
            let level = 1;
            let mainObject = {};
            let levels = [];
            await pendingSellerLevels.map((sellers, index) => {
                if (sellers.ulDownlineId == seller.registerId) {
                    [mainObject] = pendingSellerLevels.splice(index, 1);
                    const { mainUser, sellers, sellersAvailable } = mainObject;
                    const status =
                        sellerNetworkSettings.width - sellersAvailable == 0 ? "Completed" : "Pending";
                    let sellersArray = [];
                    for (let k = 0; k < sellers.length; k++) {
                        sellersArray.push({ ...sellers[k], mainUser });
                    }
                    levels.push({
                        level,
                        requiredMembers: sellerNetworkSettings.width,
                        joinedMembers: sellersAvailable,
                        status,
                        earnings: 0,
                        sellers: sellersArray,
                    });
                    level++;
                }
            });
            while (pendingSellerLevels.length > 0) {
                levels = await this.getTeamMembers({
                    level,
                    sellers: mainObject.sellers,
                    pendingSellerLevels,
                    levels,
                    width: sellerNetworkSettings.width,
                });
            }

            let levelData = {};
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

    /********************************************************
     Purpose: Getting team tree details by registerId getTeamTreeDetailsByRegisterID
    Method: POST
     {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-09-25",
          "searchText": ""
      }
    Authorisation: true            
    Return: JSON String
    ********************************************************/
    async mySponserTeamListing() {
        try {
            const currentSellerId = this.req.user;
            const seller = await Sellers.findOne(
                { _id: ObjectID(currentSellerId), isDeleted: false },
                { registerId: 1 },
            );
            console.log(`seller: ${JSON.stringify(seller)}`)
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
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
                query.push({ $or: [{ fullName: regex }, { emailId: regex }, { registerId: regex }, { sponserId: regex }] })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Sellers.aggregate([
                { $match: { sponserId: seller.registerId, isDeleted: false, $and: query } },
                { $project: { createdAt: 1, fullName: 1, emailId: 1, registerId: 1, sponserId: 1 } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Sellers.aggregate([
                { $match: { sponserId: seller.registerId, isDeleted: false, $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = NetworkTeamController;
