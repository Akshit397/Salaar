const _ = require("lodash");

const Controller = require("../base");
const { Gifts } = require('../../models/s_gifts');
const { GiftSubscriptions, PortfolioSubscriptions } = require('../../models/s_portfolio_subscriptions');
const { GameProducts } = require('../../models/s_game_product');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads')


const listingStages = [
    { $lookup: { from: "gameproducts", localField: "gameProductId", foreignField: "_id", as: "gameProduct" } },
    { $unwind: { "path": "$gameProduct", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "plans", localField: "gameProduct.planId", foreignField: "_id", as: "plan" } },
    { $unwind: { "path": "$plan", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "portfoliosubscriptions", localField: "portfolioSubscriptionId", foreignField: "_id", as: "portfolioSubscription" } },
    { $unwind: { "path": "$portfolioSubscription", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            createdAt: 1,
            updatedAt: 1,
            userType: 1,
            "gameProduct._id": 1,
            "gameProduct.name": 1,
            "gameProduct.unitPrice": 1,
            "gameProduct.finalPrice": 1,
            "plan._id": 1,
            "plan.width": 1,
            "plan.depth": 1,
            giftOn: 1,
            giftName: 1,
            finalPrice: 1,
            levelMembers: 1,
            status: 1
        }
    }]
const downloadFilesStages = [
    { $lookup: { from: "gameproducts", localField: "gameProductId", foreignField: "_id", as: "gameProduct" } },
    { $unwind: { "path": "$gameProduct", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "plans", localField: "gameProduct.planId", foreignField: "_id", as: "plan" } },
    { $unwind: { "path": "$plan", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "portfoliosubscriptions", localField: "portfolioSubscriptionId", foreignField: "_id", as: "portfolioSubscription" } },
    { $unwind: { "path": "$portfolioSubscription", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            "Created Date": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            "Updated Date": { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            "User Type": "$userType",
            "Game Product Name": "$gameProduct.name",
            "Game Product Unit Price": "$gameProduct.unitPrice",
            "Game Product Final Price": "$gameProduct.finalPrice",
            "Width": "$plan.width",
            "Depth": "$plan.depth",
            "Gift On": "$giftOn",
            "Gift Name": "$giftName",
            "Final Price": "$finalPrice",
            "Level Members": "$levelMembers",
        }
    }
]


class GiftsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
   Purpose: Create and Update Gifts
   Method: Post
   Authorisation: true
   Parameter:
    {
        "userType": "all",
        "gameProductId": "64be9ee1c655bf74a1ee82fd",
        "gameProductUnitPrice": 2000,
        "gameProductFinalPrice": 2220,
        "giftOn": "OnPurchase",
        "giftName": "Testing",
        "finalPrice": 200,
        "image": "image.jpeg",
        "type": "General",
        "giftId": "" // optional
    }
    or
    {
        "userType": "all",
        "gameProductId": "64be9ee1c655bf74a1ee82fd",
        "gameProductUnitPrice": 2000,
        "gameProductFinalPrice": 2220,
        "giftOn": "OnPurchase",
        "giftName": "Testing",
        "finalPrice": 200,
        "image": "image.jpeg",
        "type": "Gift",
        "portfolioSubscriptionId": "64db666bc1e751d5f9719d9a",
        "giftId": "" // optional
    }
   Return: JSON String
   ********************************************************/
    async addAndUpdateGift() {
        try {
            if (!this.req.body.type) {
                return this.res.send({ status: 0, message: "Please send type of the gift" });
            }
            let data = this.req.body;
            const keys = ["userType", "gameProductId", "giftOn", "giftName", 'finalPrice', "image"]
            const fieldsArray = data.type == 'General' ?
                keys :
                [...keys, "portfolioSubscriptionId"]
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            // verifying portfolio subscription details
            if (data.portfolioSubscriptionId) {
                const portfolio = await PortfolioSubscriptions.findOne({ _id: data.portfolioSubscriptionId, isDeleted: false })
                if (_.isEmpty(portfolio)) {
                    return this.res.send({ status: 0, message: "Gift subscription details are not found" });
                }
            }
            // verifying game product details
            if (data.gameProductId) {
                const portfolio = await GameProducts.findOne({ _id: data.gameProductId, isDeleted: false }, { name: 1, unitPrice: 1, finalPrice: 1 }).populate('planId', { width: 1, depth: 1 })
                if (_.isEmpty(portfolio)) {
                    return this.res.send({ status: 0, message: "Gift subscription details are not found" });
                }
                data.gameProductUnitPrice = portfolio.unitPrice;
                data.gameProductFinalPrice = portfolio.finalPrice;
                if (data.giftOn == 'OnPurchase') {
                    data.levelMembers = 0
                }
                if (data.giftOn == 'CompletionOfLevels') {
                    const width = portfolio.planId.width;
                    const depth = portfolio.planId.depth;
                    data.levelMembers = 0
                    for (let i = 1; i <= depth; i++) {
                        data.levelMembers += (width * (width ** (depth - i)))
                    }
                }
            }
            if (data.giftId) {
                const gift = await Gifts.findOne({ _id: data.giftId, isDeleted: false })
                if (_.isEmpty(gift)) {
                    return this.res.send({ status: 0, message: "Details are not found" });
                }
                const checkGiftName = await Gifts.findOne({ giftName: data.giftName, isDeleted: false, _id: { $nin: [data.giftId] } })
                if (!_.isEmpty(checkGiftName)) {
                    return this.res.send({ status: 0, message: `${data.giftName} already exists` });
                }
                const updatedGift = await Gifts.findOneAndUpdate({ _id: data.giftId }, data, { upsert: true, new: true })
                if (_.isEmpty(updatedGift)) {
                    return this.res.send({ status: 0, message: "Details are not updated" });
                }
                return this.res.send({ status: 1, message: "Gift details updated successfully", data: updatedGift });

            } else {
                const gift = await Gifts.findOne({ giftName: data.giftName, isDeleted: false })
                if (!_.isEmpty(gift)) {
                    return this.res.send({ status: 0, message: `${data.giftName} already exists` });
                }
                const newGift = await new Model(Gifts).store(data);
                if (_.isEmpty(newGift)) {
                    return this.res.send({ status: 0, message: "Details not saved" });
                }
                return this.res.send({ status: 1, message: "Gift details created successfully", data: newGift });
            }
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Get Gifts Details
      Method: GET
      Authorisation: true
      Return: JSON String
      ********************************************************/
    async getGiftDetails() {
        try {
            if (!this.req.params.giftId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const giftSubscription = await Gifts.findOne({ _id: this.req.params.giftId, isDeleted: false }, { __v: 0 })
                .populate('gameProductId', { name: 1, unitPrice: 1, finalPrice: 1 })
                .populate('portfolioSubscriptionId', { name: 1 });
            if (_.isEmpty(giftSubscription)) { return this.res.send({ status: 0, message: "Gift details not found" }); }
            return this.res.send({ status: 1, message: "Details are: ", data: giftSubscription });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Gifts Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-16",
        "endDate":"2022-09-16"
    }
    Return: JSON String
    ********************************************************/
    async giftsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ giftName: regex }] })
            }
            const result = await Gifts.aggregate([
                { $match: { isDeleted: false, $and: query } },
                ...listingStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Gifts.count({ isDeleted: false })
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple giftSubscriptions change status
 Parameter:
 {
    "giftIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfGifts() {
        try {
            let msg = "Gift status not updated";
            const updatedGift = await Gifts.updateMany({ _id: { $in: this.req.body.giftIds } }, { $set: { status: this.req.body.status } });
            if (updatedGift) {
                msg = updatedGift.modifiedCount ? updatedGift.modifiedCount + " gift updated" : updatedGift.matchedCount == 0 ? "Gift not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
       Purpose: Delete Single And Multiple Gifts Details In Admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "giftIds":["5cd01da1371dc7190b085f86"]
       }
       Return: JSON String
       ********************************************************/
    async deleteGifts() {
        try {
            if (!this.req.body.giftIds) {
                return this.res.send({ status: 0, message: "Please send giftIds" });
            }
            let msg = 'Gift not deleted.';
            let status = 1;
            const updatedGifts = await Gifts.updateMany({ _id: { $in: this.req.body.giftIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedGifts) {
                msg = updatedGifts.modifiedCount ? updatedGifts.modifiedCount + ' gift deleted.' : updatedGifts.matchedCount == 0 ? "Details not found" : msg;
                status = updatedGifts.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

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
        "startDate":"2022-09-16",
        "endDate":"2022-09-16"
        "filteredFields": [ "Created Date","Updated Date","User Type", "Game Product Name","Game Product Unit Price","Game Product Final Price","Width",  "Depth","Gift On","Gift Name", "Final Price", "Level Members"] }
   Return: JSON String
   ********************************************************/
    async downloadGiftFiles() {
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
                ["Created Date", "Updated Date", "User Type", "Game Product Name", "Game Product Unit Price", "Game Product Final Price", "Width", "Depth", "Gift On", "Gift Name", "Final Price", "Level Members"]

            data['model'] = Gifts;
            data['projectData'] = downloadFilesStages;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['fileName'] = 'gifts'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = GiftsController;