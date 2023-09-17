const _ = require("lodash");

const Controller = require("../base");
const { PortfolioSubscriptions } = require('../../models/s_portfolio_subscriptions');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const DownloadsController = require('../common/downloads')


const listingStages = [
    { $lookup: { from: "categories", localField: "portfolioIds", foreignField: "_id", as: "portfolioIds" } },
    {
        $project: {
            name: 1,
            "portfolioIds._id": 1, "portfolioIds.categoryName": 1,
            validity: 1,
            unitPrice: 1,
            sponserCommission: 1,
            points: 1,
            GSTPercentage: 1,
            GSTAmount: {
                $multiply: [{
                    $divide: ["$GSTPercentage", 100]
                }, "$unitPrice"]
            },
            finalPrice: {
                $sum: ["$unitPrice", {
                    $multiply: [{
                        $divide: ["$GSTPercentage", 100]
                    }, "$unitPrice"]
                }]
            },
            metaKeywords: 1,
            metaTitle: 1,
            metaDescription: 1,
            createdAt: 1,
            updatedAt: 1
        }
    }]
const downloadFilesStages = [
    { $lookup: { from: "categories", localField: "portfolioIds", foreignField: "_id", as: "portfolioIds" } },
    {
        $project: {
            Name: "$name",
            "Portfolio Category Name": "$portfolioIds.categoryName",
            Validity: "$validity",
            UnitPrice: "$unitPrice",
            "Sponser Commission": "$sponserCommission",
            Points: "$points",
            "GST Percentage": "$GSTPercentage",
            "GST Amount": {
                $multiply: [{
                    $divide: ["$GSTPercentage", 100]
                }, "$unitPrice"]
            },
            "Final Price": {
                $sum: ["$unitPrice", {
                    $multiply: [{
                        $divide: ["$GSTPercentage", 100]
                    }, "$unitPrice"]
                }]
            },
            "Meta Keywords": "$metaKeywords",
            "Meta Title": "$metaTitle",
            "Meta Description": "$metaDescription",
            "Created Date": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            "Updated Date": { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }
        }
    }]


class PortfolioSubscriptionsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
   Purpose: Create and Update Portfolio Subscriptions
   Method: Post
   Authorisation: true
   Parameter:
    {
        "name": "Portfolio subscription", 
        "portfolioIds": ["64d91f038bf6033e6dcaf677","64d91efc8bf6033e6dcaf671"], 
        "validity": 90,
        "unitPrice": 200,
        "sponserCommission": 30,
        "points": 50,
        "GSTPercentage": 10,
        "GSTAmount": 20,
        "finalPrice": 220,
        "metaKeywords": "metaKeyword", 
        "metaTitle": "metaTitle",
        "metaDescription": "metaDescription", 
        "portfolioSubscriptionId":" " // optional
    }
   Return: JSON String
   ********************************************************/
    async addAndUpdatePortfolioSubscription() {
        try {
            let data = this.req.body;
            const fieldsArray = ["name", "portfolioIds", "validity", "unitPrice", "sponserCommission", "points",
                "GSTPercentage"]
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            if (data.portfolioSubscriptionId) {
                const portfolio = await PortfolioSubscriptions.findOne({ _id: data.portfolioSubscriptionId, isDeleted: false })
                if (_.isEmpty(portfolio)) {
                    return this.res.send({ status: 0, message: "Details are not found" });
                }
                const checkPortfolioName = await PortfolioSubscriptions.findOne({ name: data.name, isDeleted: false, _id: { $nin: [data.portfolioSubscriptionId] } })
                if (!_.isEmpty(checkPortfolioName)) {
                    return this.res.send({ status: 0, message: `${data.name} already exists` });
                }
                const updatedPortfolioSubscription = await PortfolioSubscriptions.findOneAndUpdate({ _id: data.portfolioSubscriptionId }, data, { upsert: true, new: true })
                if (_.isEmpty(updatedPortfolioSubscription)) {
                    return this.res.send({ status: 0, message: "Details are not updated" });
                }
                return this.res.send({ status: 1, message: "Portfolio Subscription details updated successfully", data: updatedPortfolioSubscription });

            } else {
                const portfolio = await PortfolioSubscriptions.findOne({ name: data.name, isDeleted: false })
                if (!_.isEmpty(portfolio)) {
                    return this.res.send({ status: 0, message: `${data.name} already exists` });
                }
                const newPortfolioSubscription = await new Model(PortfolioSubscriptions).store(data);
                if (_.isEmpty(newPortfolioSubscription)) {
                    return this.res.send({ status: 0, message: "Details not saved" });
                }
                return this.res.send({ status: 1, message: "Portfolio Subscription details created successfully", data: newPortfolioSubscription });
            }
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Get Portfolio Subscriptions Details
      Method: GET
      Authorisation: true
      Return: JSON String
      ********************************************************/
    async getPortfolioSubscriptionDetails() {
        try {
            if (!this.req.params.portfolioSubscriptionId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const portfolioSubscription = await PortfolioSubscriptions.findOne({ _id: this.req.params.portfolioSubscriptionId, isDeleted: false }, { __v: 0 })
                .populate('portfolioIds', { categoryName: 1 });
            if (_.isEmpty(portfolioSubscription)) { return this.res.send({ status: 0, message: "Portfolio Subscription details not found" }); }
            return this.res.send({ status: 1, message: "Details are: ", data: portfolioSubscription });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Portfolio Subscriptions Listing In Admin
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
    async portfolioSubscriptionsListing() {
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
                query.push({ $or: [{ name: regex }] })
            }
            const result = await PortfolioSubscriptions.aggregate([
                { $match: { isDeleted: false, $and: query } },
                ...listingStages,
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await PortfolioSubscriptions.count({ isDeleted: false })
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


    /********************************************************
 Purpose: single and multiple portfolioSubscriptions change status
 Parameter:
 {
    "portfolioSubscriptionIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfPortfolioSubscriptions() {
        try {
            let msg = "Portfolio Subscription status not updated";
            const updatedPortfolio = await PortfolioSubscriptions.updateMany({ _id: { $in: this.req.body.portfolioSubscriptionIds } }, { $set: { status: this.req.body.status } });
            if (updatedPortfolio) {
                msg = updatedPortfolio.modifiedCount ? updatedPortfolio.modifiedCount + " portfolio Subscription updated" : updatedPortfolio.matchedCount == 0 ? "Portfolio Subscription not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
       Purpose: Delete Single And Multiple Portfolio Subscriptions Details In Admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "portfolioSubscriptionIds":["5cd01da1371dc7190b085f86"]
       }
       Return: JSON String
       ********************************************************/
    async deletePortfolioSubscriptions() {
        try {
            if (!this.req.body.portfolioSubscriptionIds) {
                return this.res.send({ status: 0, message: "Please send portfolioSubscriptionIds" });
            }
            let msg = 'Portfolio Subscription not deleted.';
            let status = 1;
            const updatedPortfolioSubscriptions = await PortfolioSubscriptions.updateMany({ _id: { $in: this.req.body.portfolioSubscriptionIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedPortfolioSubscriptions) {
                msg = updatedPortfolioSubscriptions.modifiedCount ? updatedPortfolioSubscriptions.modifiedCount + ' portfolio subscription deleted.' : updatedPortfolioSubscriptions.matchedCount == 0 ? "Details not found" : msg;
                status = updatedPortfolioSubscriptions.matchedCount == 0 ? 0 : 1
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
        "filteredFields": [ "Name","Portfolio Category Name", "Validity", "UnitPrice","Sponser Commission", "Points","GST Percentage",
  "GST Amount","Final Price", "Meta Keywords", "Meta Title","Meta Description","Created Date","Updated Date"] }
   Return: JSON String
   ********************************************************/
    async downloadPortfolioSubscriptionFiles() {
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
                ["Name", "Portfolio Category Name", "Validity", "UnitPrice", "Sponser Commission", "Points", "GST Percentage",
                    "GST Amount", "Final Price", "Meta Keywords", "Meta Title", "Meta Description", "Created Date", "Updated Date"]

            data['model'] = PortfolioSubscriptions;
            data['projectData'] = downloadFilesStages;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['fileName'] = 'portfolio-subscription'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


    /********************************************************
    Purpose:Getting Dropdowns For Brands In Admin
    Method: Post
    Authorisation: true
    {
        "searchText":"as"
    }
    Return: JSON String
    ****************************************************/
    async portfolioSubscriptionList() {
        try {
            const skip = 0; const limit = 20;
            const data = this.req.body;
            let query = [{ isDeleted: false }]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ name: regex }] })
            }
            const result = await PortfolioSubscriptions.find({ $and: query }, { name: 1 }).sort({ _id: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = PortfolioSubscriptionsController;