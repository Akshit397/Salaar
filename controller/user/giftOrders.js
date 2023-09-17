const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { GiftOrders } = require('../../models/s_gift_order');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');


const countryStages = [
    { $lookup: { from: "countries", localField: "countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
];

const gameProducts = [
    { $lookup: { from: "gameproducts", localField: "gameProductId", foreignField: "_id", as: "gameProducts" } },
    { $unwind: { "path": "$gameProducts", "preserveNullAndEmptyArrays": true } },
];

const users = [
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "users" } },
    { $unwind: { "path": "$users", "preserveNullAndEmptyArrays": true } },
];

const orders = [
    { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "orders" } },
    { $unwind: { "path": "$orders", "preserveNullAndEmptyArrays": true } },
];


const giftOrdersStages = [
    ...countryStages,
    ...gameProducts,
    ...users,
    ...orders,
    {
        $project: {
            createdAt: 1, "country.name": 1, "orders.orderId": 1, "users.registerId": 1, "users.fullName": 1,
            "gameProducts.name": 1, "gameProducts.unitPrice": 1, "gameProducts.finalPrice": 1, giftOn: 1, achievedDate: 1, giftName: 1, finalPrice: 1,
            orderStatus: 1, trackUrl: 1, courierName: 1,
        }
    },

]

class GiftOrdersController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
   Purpose: Get GiftOrder Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getGiftOrderDetails() {
        try {
            const currentUserId = this.req.user;
            const data = this.req.params;
            if (!data.giftOrderId) {
                return this.res.send({ status: 0, message: "Please send giftOrderId" });
            }
            const giftOrder = await GiftOrders.findOne({ _id: data.giftOrderId, userId: currentUserId }, { _v: 0, })
                .populate('countryId', { name: 1 })
                .populate('orderId', { fullName: 1, emailId: 1 })
                .populate('gameProductId', { name: 1, finalPrice: 1 })
                .populate('userId', { fullName: 1, registerId: 1, emailId: 1 });
            if (_.isEmpty(giftOrder)) {
                return this.res.send({ status: 0, message: "GiftOrder details not found" });
            }
            return this.res.send({ status: 1, data: giftOrder });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: giftOrders Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2023-10-25",
          "searchText": "",
          "giftOn":"CompletionOfLevels" or "OnPurchase"
      }
      Return: JSON String
      ********************************************************/
    async giftOrdersListing() {
        try {
            const currentUserId = this.req.user;
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ giftName: regex }, { trackUrl: regex }, { courierName: regex }, { orderStatus: regex }] })
            }
            if (data.giftOn) {
                query.push({ giftOn: data.giftOn })
            }
            const result = await GiftOrders.aggregate([
                { $match: { userId: ObjectID(currentUserId), $and: query, shippingAddress: { $exists: true } } },
                ...giftOrdersStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit }
            ]);
            const total = await GiftOrders.aggregate([
                { $match: { userId: ObjectID(currentUserId), $and: query, shippingAddress: { $exists: true } } },
                ...giftOrdersStages,
                { $project: { _id: 1 } }
            ]);
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = GiftOrdersController;