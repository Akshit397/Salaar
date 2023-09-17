const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { Portfolios } = require('../../models/s_portfolio');
const { Users } = require('../../models/s_users');
const { Categories } = require('../../models/s_category');
const RequestBody = require("../../utilities/requestBody");
const Model = require("../../utilities/model");
const { GiftOrders } = require("../../models/s_gift_order");

const portfolioStagesForHomePage = [
    { $match: { isDelievered: true } },
    { $lookup: { from: "gifts", localField: "giftId", foreignField: "_id", as: "gifts" } },
    { $unwind: { "path": "$gifts", "preserveNullAndEmptyArrays": true } },
    { $match: { "gifts.type": "Portfolio" } },
    { $lookup: { from: "portfoliosubscriptions", localField: "gifts.portfolioSubscriptionId", foreignField: "_id", as: "portfolioSubscription" } },
    { $unwind: { "path": "$portfolioSubscription", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            categoryId: "$portfolioSubscription.portfolioIds",
            userId: 1,
            startDate: "$portfolioSubscription.createdAt",
            endDate: {
                $dateAdd:
                {
                    startDate: "$portfolioSubscription.createdAt",
                    unit: "day",
                    amount: "$portfolioSubscription.validity"
                }
            }
        }
    },

]

class PortfolioController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }


    /********************************************************
      Purpose: Add and update Portfolio details
      Method: Post
      Authorisation: true
      Parameter:
      {
            "name": "Lakshmi Ramakurthy",
            "dob": "09/29/1996",
            "gender": "Female",
            "portfolioType": ["64d91f038bf6033e6dcaf677","64d91efc8bf6033e6dcaf671","64d91ef78bf6033e6dcaf66b"],
            "education": "Education details",
            "aboutMe": "About me",
            "height": "56",
            "bust": "25",
            "waist": "23",
            "hips": "4",
            "chest": "3",
            "biceps": "biceps",
            "hairType": "Silky",
            "hairLength": "5",
            "eyeColour": "Black",
            "workedInTVShows": true,
            "workedInMovies": true,
            "workedInShortFilms": true,
            "workDescription": "work description",
            "workPreference": "Global",
            "willingToTravel": true,
            "languagesKnown": ["English", "Hindi", "Telugu", "Kannada"],
            "languagesFluent": ["English", "Hindi", "Telugu"],
            "websiteLink": "www.samplewebsite.com",
            "youtubeLink": "www.youtube.com",
            "instagramLink": "www.instagram.com",
            "twitterLink": "www.twitter.com",
            "bannerImage": "banner.jpeg",
            "images": [{ "path": "image1.jpeg" }],
            "headShots": [{ "path": "headShots1.jpeg" }],
            "reels": [{ "path": "reel1.jpeg" }],
            "contactName": "Lakshmi",
            "mobileNo": "7207334583",
            "emailId": "lakshmimattafreelancer@gmail.com",
            "countryId": "630f516684310d4d2a98baf2",
            "state": "Andhra Pradesh",
            "city": "Rajahmundry",
            "portfolioId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdatePortfolio() {
        try {
            let data = this.req.body;
            const fieldsArray = ["name", "dob", "gender", "portfolioType", "education", "aboutMe", "countryId", "state", "city"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            // checking user
            const currentUserId = this.req.user;
            data.userId = currentUserId;
            const user = await Users.findOne({ _id: currentUserId }, { fullName: 1 });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "User details not found" }); }
            if (data.portfolioId) {
                await Portfolios.findByIdAndUpdate(data.portfolioId, data, { new: true, upsert: true });
                return this.res.send({ status: 1, message: "Portfolio details updated successfully" });
            } else {
                const portfolio = await Portfolios.findOne({ userId: data.userId, isDeleted: false }, { name: 1 });
                if (!_.isEmpty(portfolio)) { return this.res.send({ status: 0, message: "Portfolio details are already added for this user" }); }
                const newPortfolio = await new Model(Portfolios).store(data);
                if (_.isEmpty(newPortfolio)) {
                    return this.res.send({ status: 0, message: "Portfolio details not saved" })
                }
                return this.res.send({ status: 1, message: "Portfolio details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get Portfolio Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getPortfolioDetails() {
        try {
            const currentUserId = this.req.user;
            const portfolio = await Portfolios.findOne({ userId: currentUserId, isDeleted: false }, { __v: 0, userId: 0 })
                .populate('countryId', { name: 1 }).populate('portfolioType', { categoryName: 1 });
            if (_.isEmpty(portfolio)) {
                return this.res.send({ status: 0, message: "Portfolio details not found" });
            }
            return this.res.send({ status: 1, message: "Portfolio details are: ", data: portfolio });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple portfolios change status
 Parameter:
 {
    "portfolioIds":["64d9221ad155e7ff42123bd6"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfPortfolio() {
        try {
            let msg = "Portfolio status not updated";
            const updatedPortfolio = await Portfolios.updateMany({ _id: { $in: this.req.body.portfolioIds } }, { $set: { status: this.req.body.status } });
            if (updatedPortfolio) {
                msg = updatedPortfolio.modifiedCount ? updatedPortfolio.modifiedCount + " portfolio updated" : updatedPortfolio.matchedCount == 0 ? "Portfolio not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Portfolio details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "portfolioIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deletePortfolio() {
        try {
            if (!this.req.body.portfolioIds) {
                return this.res.send({ status: 0, message: "Please send portfolioIds" });
            }
            let msg = 'Portfolio not deleted.';
            let status = 1;
            const updatedPortfolio = await Portfolios.updateMany({ _id: { $in: this.req.body.portfolioIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedPortfolio) {
                msg = updatedPortfolio.modifiedCount ? updatedPortfolio.modifiedCount + ' portfolio deleted.' : updatedPortfolio.matchedCount == 0 ? "Details not found" : msg;
                status = updatedPortfolio.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Get Portfolios
   Method: POST
   Authorisation: true 
   {
        "searchText": "",
        "categoryId":"64d91ef78bf6033e6dcaf66b",
        "countryId": "630f516684310d4d2a98baf2",
        "gender": "Female"
   }           
   Return: JSON String
   ********************************************************/
    async portfolioHomePage() {
        try {
            let portfolios = {};
            let data = this.req.body;
            let query = [{ type: "subCategory1", isDeleted: false, publish: true, isMovie: true }];
            const portfolioCategory = await Categories.findOne({ categoryName: "Portfolio", type: "category", isDeleted: false, publish: true, isMovie: true })
            if (_.isEmpty(portfolioCategory)) { return this.res.send({ status: 0, message: "Portfolio details not found" }); }
            if (portfolioCategory._id) {
                query.push({ parentCategory: portfolioCategory._id })
            }
            const subCategories = await Categories.find({ $and: query }, { categoryName: 1 });
            // filteration begins
            let filter = []
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                filter.push({ $or: [{ name: regex }] })
            }
            if (data.gender) {
                filter.push({ gender: data.gender })
            }
            if (data.countryId) {
                filter.push({ countryId: data.countryId })
            }
            if (data.categoryId) {
                filter.push({ portfolioType: { $in: data.categoryId } })
            }
            // filteration ends
            if (subCategories && subCategories.length > 0) {
                for (let i = 0; i < subCategories.length; i++) {
                    if (data.categoryId == subCategories[i]._id || !data.categoryId) {
                        const userIdsResponse = await this.getUserIds(subCategories[i]._id);
                        const userIds = userIdsResponse && userIdsResponse.length > 0 && userIdsResponse[0].userIds ?
                            userIdsResponse[0].userIds : [];
                        portfolios[subCategories[i].categoryName] = await Portfolios.find({
                            $and: [{ isDeleted: false, status: true, portfolioType: { $in: subCategories[i]._id } },
                            ...filter, { userId: { $in: userIds } }]
                        },
                            { city: 1, state: 1, countryId: 1, name: 1, bannerImage: 1, portfolioType: 1 })
                            .populate('portfolioType', { categoryName: 1 }).populate('countryId', { name: 1 })
                            .sort({ _id: -1 }).limit(20)
                    }
                }
            }
            return this.res.send({ status: 1, message: "Portfolio details are: ", data: portfolios });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********* getting userIds who has the valid portfolio subscription **********/
    async getUserIds(categoryId) {
        try {
            const date = new Date()
            const result = await GiftOrders.aggregate([
                ...portfolioStagesForHomePage,
                { $unwind: { "path": "$categoryId", "preserveNullAndEmptyArrays": true } },
                { $match: { categoryId: ObjectID(categoryId), $and: [{ startDate: { $lte: date } }, { endDate: { $gte: date } }] } },
                {
                    $group: {
                        _id: "$categoryId", userIds: { $push: "$userId" },
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose: Get Portfolio Details of user
  Method: GET
  Authorisation: true            
  Return: JSON String
  ********************************************************/
    async getPortfolioDetailsOfUser() {
        try {
            const data = this.req.params;
            if (!data.portfolioId) {
                return this.res.send({ status: 0, message: "Please send portfolioId" });
            }
            const portfolio = await Portfolios.findOne({ _id: data.portfolioId, isDeleted: false, status: true }, { __v: 0, userId: 0 })
                .populate('countryId', { name: 1 }).populate('portfolioType', { categoryName: 1 });
            if (_.isEmpty(portfolio)) {
                return this.res.send({ status: 0, message: "Portfolio details not found" });
            }
            return this.res.send({ status: 1, message: "Portfolio details are: ", data: portfolio });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: Get Portfolios in category page
    Method: POST
    Authorisation: true 
    {
        "searchText": "",
        "categoryId":"64d91ef78bf6033e6dcaf66b",
        "countryId": "630f516684310d4d2a98baf2",
        "gender": "Female",
        "page":1,
        "pagesize": 2
    }           
    Return: JSON String
    ********************************************************/
    async portfolioCategoryPage() {
        try {
            let data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            if (!data.categoryId) {
                return this.res.send({ status: 0, message: "Please send categoryId" });
            }
            // filteration begins
            let filter = []
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                filter.push({ $or: [{ name: regex }] })
            }
            if (data.gender) {
                filter.push({ gender: data.gender })
            }
            if (data.countryId) {
                filter.push({ countryId: data.countryId })
            }
            if (data.categoryId) {
                filter.push({ portfolioType: { $in: data.categoryId } })
            }
            const userIdsResponse = await this.getUserIds(data.categoryId);
            const userIds = userIdsResponse && userIdsResponse.length > 0 && userIdsResponse[0].userIds ?
                userIdsResponse[0].userIds : [];
            // filteration ends
            const query = { $and: [{ isDeleted: false, status: true, portfolioType: { $in: data.categoryId } }, ...filter, { userId: { $in: userIds } }] }
            const portfoliosList = await Portfolios.find(query,
                { city: 1, state: 1, countryId: 1, name: 1, bannerImage: 1, portfolioType: 1 })
                .populate('portfolioType', { categoryName: 1 }).populate('countryId', { name: 1 })
                .sort(sort).skip(skip).limit(limit);
            const total = await Portfolios.count(query);
            return this.res.send({ status: 1, message: "Listing details are: ", data: portfoliosList, page: data.page, pagesize: data.pagesize, total: total });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = PortfolioController;
