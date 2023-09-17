const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { Categories } = require('../../models/s_category');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");


class CategoriesController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }
    /********************************************************
     Purpose:Getting categories lists for website
     Method: Post
     Authorisation: true
     {
         "type":"subCategory1",
         "parentCategory":"5ccc4c8e5a16ae2b47ced986",
         "searchText":""
     }
     Return: JSON String
     ********************************************************/
    async getCategories() {
        try {
            const data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send category type" });
            }
            let query = [{ type: data.type, isDeleted: false, publish: true }]
            if (data.parentCategory) {
                query.push({ parentCategory: data.parentCategory })
            }
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }, { description: regex }] })
            }
            const result = await Categories.find({ $and: query }, { categoryName: 1 }).sort({ createdAt: -1 }).limit(20)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose:Getting categories lists for website
   Method: Post
   Authorisation: true
   {
       "searchText":""
   }
   Return: JSON String
   ********************************************************/
    async getPortFolioCategories() {
        try {
            const data = this.req.body;
            let query = [{ type: "subCategory1", isDeleted: false, publish: true, isMovie: true }];
            const portfolioCategory = await Categories.findOne({ isMovie: true, categoryName: "Portfolio", type: "category", isDeleted: false, publish: true })
            if (_.isEmpty(portfolioCategory)) { return this.res.send({ status: 0, message: "Portfolio details not found" }); }
            if (portfolioCategory._id) {
                query.push({ parentCategory: portfolioCategory._id })
            }
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }, { description: regex }] })
            }
            const result = await Categories.find({ $and: query }, { categoryName: 1 }).sort({ createdAt: -1 }).limit(20)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


}
module.exports = CategoriesController;