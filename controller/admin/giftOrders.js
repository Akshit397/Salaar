const _ = require("lodash");

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

const mlms = [
    { $lookup: { from: "mlms", localField: "orderId", foreignField: "orderId", as: "mlms" } },
    { $unwind: { "path": "$mlms", "preserveNullAndEmptyArrays": true } },
];


const giftOrdersStages = [
    ...countryStages,
    ...gameProducts,
    ...users,
    ...orders,
    ...mlms,
    {
        $lookup: {
            from: "users",
            let: { uplinerId: "$mlms.uplinerId" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$registerId", "$$uplinerId"] },
                    },
                },
            ],
            as: "uplinerId",
        },
    },
    { $unwind: { path: "$uplinerId", preserveNullAndEmptyArrays: true } },
    {
        $project: {
            createdAt: 1, "country.name": 1, "orders.orderId": 1, "users.registerId": 1, "users.fullName": 1,
            "gameProducts.name": 1, "gameProducts.unitPrice": 1, "gameProducts.finalPrice": 1, giftOn: 1, achievedDate: 1, giftName: 1, finalPrice: 1,
            orderStatus: 1, trackUrl: 1, courierName: 1, "uplinerId.registerId": 1, "uplinerId.fullName": 1, "uplinerId._id": 1,
            orderId: 1
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
            const data = this.req.params;
            if (!data.giftOrderId) {
                return this.res.send({ status: 0, message: "Please send giftOrderId" });
            }
            const giftOrder = await GiftOrders.findOne({ _id: data.giftOrderId }, { _v: 0, })
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
     Purpose: single and multiple giftOrders change status
    Parameter:
    {
        "giftOrderIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "orderStatus":"Shipped"
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfGiftOrders() {
        try {
            let msg = "GiftOrder status not updated";
            let data = {}
            data.orderStatus = this.req.body.orderStatus;
            if (data.orderStatus == 'Delievered') {
                data.achievedDate = new Date()
            }
            const updatedGiftOrders = await GiftOrders.updateMany({ _id: { $in: this.req.body.giftOrderIds } }, { $set: data });
            if (updatedGiftOrders) {
                msg = updatedGiftOrders.modifiedCount ? updatedGiftOrders.modifiedCount + " giftOrder updated" : updatedGiftOrders.matchedCount == 0 ? "GiftOrder not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Update tracking details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "giftOrderId": "5c9df24382ddca1298d855bb",
        "trackUrl": "www.express.com",
        "courierName": "Express",
   }  
   Return: JSON String
   ********************************************************/
    async updateTrackingDetails() {
        try {
            let data = this.req.body;
            const fieldsArray = ["giftOrderId", "trackUrl", "courierName"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            await GiftOrders.findByIdAndUpdate(data.giftOrderId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Gift Order details updated successfully" });
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
                { $match: { $and: query, shippingAddress: { $exists: true } } },
                ...giftOrdersStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit }
            ]);
            const total = await GiftOrders.aggregate([
                { $match: { $and: query, shippingAddress: { $exists: true } } },
                ...giftOrdersStages,
                { $project: { _id: 1 } }
            ]);
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
            "giftOn":"CompletionOfLevels" or "OnPurchase"
            "filteredFields": ["Date", "Country", "Order ID", "User ID", "User Name", "Upliner ID", "Upliner Name", "Game Product Name", "Game Product Unit Price", "Game Product Final Price", 
             "Gift Type", "Achieved Date", "Gift Name","Final Price","Order Status", "Track Url", "Courier Name",]
        }
       Return: JSON String
       ********************************************************/
    async downloadGiftOrderFiles() {
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
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ giftName: regex }, { trackUrl: regex }, { courierName: regex }, { orderStatus: regex }] })
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Country", "Order ID", "User ID", "User Name", "Upliner ID", "Upliner Name", "Game Product Name", "Game Product Unit Price", "Game Product Final Price",
                    "Gift Type", "Achieved Date", "Gift Name", "Final Price", "Order Status", "Track Url", "Courier Name",]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ giftOrderCode: regex }] })
            }
            if (data.giftOn) {
                query.push({ giftOn: data.giftOn })
            }
            data['model'] = GiftOrders;
            data['stages'] = giftOrdersStages;
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    Country: "$country.name",
                    "Order ID": "$orders.orderId",
                    "User ID": "$users.registerId",
                    "User Name": "$users.fullName",
                    "Upliner ID": "$uplinerId.registerId",
                    "Upliner Name": "$uplinerId.fullName",
                    "Game Product Name": "$gameProducts.name",
                    "Game Product Unit Price": "$gameProducts.unitPrice",
                    "Game Product Final Price": "$gameProducts.finalPrice",
                    "Gift Type": "$giftOn", "Achieved Date": { $dateToString: { format: "%Y-%m-%d", date: "$achievedDate", timezone: "Asia/Kolkata" } },
                    "Gift Name": "$giftName",
                    "Final Price": "$finalPrice",
                    "Order Status": "$orderStatus",
                    "Track Url": "$trackUrl", "Courier Name": "$courierName",
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'giftOrders'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = GiftOrdersController;