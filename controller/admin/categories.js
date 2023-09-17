const _ = require("lodash");
const { ObjectID } = require('mongodb');
const fs = require('fs');


const Controller = require("../base");
const Model = require("../../utilities/model");
const Categories = require('../../models/s_category').Categories;
const RequestBody = require("../../utilities/requestBody");
const DownloadsController = require('../common/downloads');

const subCategoryStages = [
    { $lookup: { from: "categories", localField: "parentCategory", foreignField: "_id", as: "parentCategory" } },
    { $unwind: { "path": "$parentCategory", "preserveNullAndEmptyArrays": true } },
]
const subCategoryProjection = {
    'parentCategory.categoryName': "$parentCategory.categoryName",
    'parentCategory._id': "$parentCategory._id",
}
const subCategoryProjectionDownload = {
    'Parent Category Name': "$parentCategory.categoryName",
}
const childCategoryStages = [
    ...subCategoryStages,
    { "$lookup": { "from": "categories", "localField": "parentCategory.parentCategory", "foreignField": "_id", "as": "mainCategory" } },
    { "$unwind": "$mainCategory" },
]
const childCategoryProjection = {
    ...subCategoryProjection,
    'mainCategory.categoryName': "$mainCategory.categoryName",
    'mainCategory._id': "$mainCategory._id",
}
const childCategoryProjectionDownload = {
    ...subCategoryProjectionDownload,
    'Main Category Name': "$mainCategory.categoryName",
}
class CategoriesController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add And Update Category Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryName":"clothess",
        "customUrl": "clothess",
        "description": "clothess",
        "publish": true,
        "parentCategory":"5ccbd647eb89f20b11500fea",
        "image":"Image155490405914410.png",
        "metaTitle": "Meta Title",
        "type":"category",
        "metaKeyword": "Meta Title\nMeta Keyword",
        "metaDescription": "Meta Title\nMeta Keyword\nMeta Description",
        "isFood": false,
        "isVegetables": false,
        "isGame": false,
        "isEcommerce": false,
        "isWineShop":false,
        "isMovie": false,
        "isServices": false,
        "isEducation": false,
        "isInsurance": false,
        "isSports": false,
        "isMatrimony": false,
        "isDelivery": false,
        "isMedical": false,
        "isFuel": false,
        "isRide": false,
        "isTravel": false,
        "isDonation": false,
        "isGovt": false,
        "isCasino": false,
        "categoryId": "5ccbd647eb89f20b11500fea",
    }
    Return: JSON String
    ********************************************************/
    async addCategory() {
        try {
            let data = this.req.body;
            const fieldsArray = ["categoryName", "publish", "image", "metaTitle", "metaKeyword", "metaDescription"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            if (!data.categoryId) {
                let name = data.categoryName;
                let checkCategory = await Categories.findOne({ categoryName: data.categoryName });
                if (!_.isEmpty(checkCategory))
                    return this.res.send({ status: 0, message: "Name already exists" });
                let category = await Categories.find();
                let custom = "";
                let check = await name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-')
                for (let i = 0; i < category.length; i++) {
                    custom = await Categories.find({ "customUrl": check })
                    if (custom.length === 0) { break; }
                    else { check = check + i }
                }
                let middle = name.substring(0, 3);
                data.categoryName = name;
                data.customUrl = check;
                data.categoryId = "cat" + "-" + middle + '-' + (category.length + 1)
                if (data.parentCategory) {
                    data.parentCategory = data.parentCategory
                }
                const newCategory = await new Model(Categories).store(data);
                if (_.isEmpty(newCategory))
                    return this.res.send({ status: 0, message: "Details not added" });
                return this.res.send({ status: 1, message: "Details added succcessfully", data: newCategory });
            }
            else {
                if (data.categoryName && !data.customUrl) {
                    let name = data.categoryName;
                    let checkCategory = await Categories.findOne({ categoryName: data.categoryName, _id: { $ne: data.categoryId } });
                    if (!_.isEmpty(checkCategory))
                        return this.res.send({ status: 0, message: "Name already exists" });
                    let category = await Categories.find();
                    let custom = "";
                    let check = await name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-')
                    for (let i = 0; i < category.length; i++) {
                        custom = await Categories.find({ "customUrl": check })
                        if (custom.length === 0) { break; }
                        else { check = check + i }
                    }
                    data.categoryName = name
                    data.customUrl = check
                    let updatedCategory = await Categories.findByIdAndUpdate(data.categoryId, data, { new: true });
                    return this.res.send({ status: 1, message: "Details updated successfully", data: updatedCategory });
                }
                if (!data.categoryName || !data.customUrl || (!data.publish || data.publish)) {
                    let custom = await Categories.find({ "customUrl": data.customUrl })
                    if (!_.isEmpty(custom)) {
                        custom.map(each => {
                            if (each._id.toString() !== data.categoryId.toString())
                                return this.res.send({ status: 0, message: "Custom-url should be unique" });
                        })
                    } else {
                        let id = data.categoryId
                        delete data.categoryId
                        let updatedCategory = await Categories.findByIdAndUpdate(id, data)
                        return this.res.send({ status: 1, message: "Details updated successfully", data: updatedCategory });
                    }
                }
            }
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Single And Multiple Category Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryIds":["5cd01da1371dc7190b085f86"]
    }
    Return: JSON String
    ********************************************************/
    async deleteCategories() {
        try {
            let model = this.req.model ? this.req.model : Categories;
            let msg = 'Category not deleted.';
            const updatedCategory = await model.updateMany({ _id: { $in: this.req.body.categoryIds }, isDeleted: false }, { $set: { isDeleted: true } });
            console.log(`updatedCategory: ${JSON.stringify(updatedCategory)}`)
            if (updatedCategory) {
                msg = updatedCategory.modifiedCount ? updatedCategory.modifiedCount + ' category deleted.' : updatedCategory.n == 0 ? "Details not found" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Change Status Of Category In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryIds":["5cd01da1371dc7190b085f86"],
        "publish":false
    }
    Return: JSON String
    ********************************************************/
    async changeCategoryStatus() {
        try {
            let model = this.req.model ? this.req.model : Categories;
            let msg = 'Category details not updated.';
            const updatedCategory = await model.updateMany({ _id: { $in: this.req.body.categoryIds } }, { $set: { publish: this.req.body.publish } });
            if (updatedCategory) {
                msg = updatedCategory.modifiedCount ? updatedCategory.modifiedCount + ' Category details updated.' : updatedUser.n == 0 ? "Details not found" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Category Details In Admin
    Method: POST
    {
        "categoryId":"5cd01da1371dc7190b085f86",
        "type": "category"
    }
    Return: JSON String
    ********************************************************/
    async getCategoriesDetails() {
        try {
            const data = this.req.body;
            const stages = data.type == 'category' ? [] :
                (data.type == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.type == 'category' ? {} :
                (data.type == 'subCategory1' ? subCategoryProjection : childCategoryProjection);
            let category = await Categories.aggregate([
                { $match: { isDeleted: false, type: data.type, _id: ObjectID(data.categoryId) } },
                ...stages,
                {
                    $project: {
                        categoryName: 1, customUrl: 1, categoryId: 1,
                        image: 1, type: 1, metaDescription: 1, metaKeyword: 1,
                        metaTitle: 1, description: 1, publish: 1, createdAt: 1, isFood: 1, isVegetables: 1, isGame: 1, isEcommerce: 1,
                        isWineShop: 1, isMovie: 1, isServices: 1, isEducation: 1, isInsurance: 1, isSports: 1, isMatrimony: 1, isDelivery: 1,
                        isMedical: 1, isFuel: 1, isRide: 1, isTravel: 1, isDonation: 1, isGovt: 1, isCasino: 1,
                        ...projection
                    }
                }
            ]);
            if (_.isEmpty(category))
                return this.res.send({ status: 0, message: "Details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: category });

        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns For Filters In CategoryListing In Admin
    Method: Post
    Authorisation: true
    {
        "type":"subCategory1",
        "parentCategory":"5ccc4c8e5a16ae2b47ced986",
        "searchText":"as",
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false,
            "isWineShop":false,
            "isMovie": false,
            "isServices": false,
            "isEducation": false,
            "isInsurance": false,
            "isSports": false,
            "isMatrimony": false,
            "isDelivery": false,
            "isMedical": false,
            "isFuel": false,
            "isRide": false,
            "isTravel": false,
            "isDonation": false,
            "isGovt": false,
            "isCasino": false,
        },
    }
    Return: JSON String
    ********************************************************/
    async categoryList() {
        try {
            const skip = 0; const limit = 20;
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
                query.push({ $or: [{ categoryName: regex }] })
            }
            if (data.filter) {
                query.push(data.filter)
            }
            const result = await Categories.find({ $and: query }, { categoryName: 1 }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            return this.res.send({ status: 1, message: "Details are: ", data: result });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: categoryListing Based On Filter In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
            "page":1,
            "pagesize":3,
            "startDate":"2022-09-20",
            "endDate":"2022-10-25",
            "parentCategory":"",
            "type":"category",
            "filter":{
                "isFood": false,
                "isVegetables":false,
                "isEcommerce": true,
                "isGame": false,
                "isWineShop":false,
                "isMovie": false,
                "isServices": false,
                "isEducation": false,
                "isInsurance": false,
                "isSports": false,
                "isMatrimony": false,
                "isDelivery": false,
                "isMedical": false,
                "isFuel": false,
                "isRide": false,
                "isTravel": false,
                "isDonation": false,
                "isGovt": false,
                "isCasino": false,
            },
            "searchText": ""
        }
      Return: JSON String
      ********************************************************/
    async categoryListing() {
        try {
            /* pagination code begins */
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            /* pagination code ends */
            /* query code begins */
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send category type" });
            }
            let query = [{ isDeleted: false, type: data.type }];

            if (data.startDate || data.endDate) {
                const dateQuery = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                query.push(...dateQuery)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }] })
            }
            if (data.parentCategory) {
                query.push({ parentCategory: ObjectID(data.parentCategory) })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            console.log(`query: ${JSON.stringify(query)}`);
            /* query code ends */
            /* aggregation code begins */

            const stages = data.type == 'category' ? [] :
                (data.type == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.type == 'category' ? {} :
                (data.type == 'subCategory1' ? subCategoryProjection : childCategoryProjection);
            const result = await Categories.aggregate([
                { $match: { $and: query } },
                ...stages,
                {
                    $project: {
                        categoryName: 1, customUrl: 1, categoryId: 1,
                        image: 1, type: 1, metaDescription: 1, metaKeyword: 1,
                        metaTitle: 1, description: 1, publish: 1, createdAt: 1, isFood: 1, isVegetables: 1,
                        isGame: 1, isEcommerce: 1, isWineShop: 1, isMovie: 1, isServices: 1, isEducation: 1, isInsurance: 1, isSports: 1, isMatrimony: 1, isDelivery: 1,
                        isMedical: 1, isFuel: 1, isRide: 1, isTravel: 1, isDonation: 1, isGovt: 1, isCasino: 1,
                        ...projection
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Categories.aggregate([
                { $match: { $and: query } },
                ...stages,
                { $project: { _id: 1 } }
            ])
            /* aggregation code ends */
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        }
        catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: getParentCategoryName In SubCategory In Admin
    Method: Get
    Return: JSON String
    ********************************************************/
    async getParentCategoryName() {
        try {
            const category = await Categories.findOne({ _id: this.req.params.categoryId }, { categoryName: 1 });
            return this.res.send({ status: 1, message: "Details are: ", data: category });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Category Image In Admin
    Method: DELETE
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async deleteCategoryImage() {
        try {
            let category = await Categories.findOne({ _id: this.req.params.categoryId });
            if (_.isEmpty(category))
                return this.res.send({ status: 0, message: "Details not found" });
            let data = {}
            let deleteImage = category.image
            if (category.image != '') {
                let imagePath = 'public/products/upload/' + deleteImage
                fs.unlink(imagePath, (err) => { if (err) throw err; });
            }
            data.image = ''
            await Categories.findOneAndUpdate({ _id: this.req.params.categoryId }, data);
            return this.res.send({ status: 1, message: "Details deleted successfully" });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Getting Three Levels Of Categories For Dropdown In Admin
    Method: POST
    {
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false,
            "isWineShop":false,
            "isMovie": false,
            "isServices": false,
            "isEducation": false,
            "isInsurance": false,
            "isSports": false,
            "isMatrimony": false,
            "isDelivery": false,
            "isMedical": false,
            "isFuel": false,
            "isRide": false,
            "isTravel": false,
            "isDonation": false,
            "isGovt": false,
            "isCasino": false,
        }
    }
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async catLevels() {
        try {
            const filter = this.req.body.filter ? this.req.body.filter : {}
            let cat = await Categories.find({ type: "category", isDeleted: false, ...filter }, { categoryName: 1 });
            if (_.isEmpty(cat))
                return this.res.send({ status: 0, message: "Details not found" });
            let categoryList = []
            for (let i = 0; i < cat.length; i++) {
                let category = {};
                category._id = cat[i]._id;
                category.categoryName = cat[i].categoryName;

                let cate = await Categories.find({ isDeleted: false, type: "subCategory1", parentCategory: cat[i]._id, ...filter }, { categoryName: 1 });
                if (cate.length > 0) {
                    let subCategoryArray = [];
                    for (let j = 0; j < cate.length; j++) {
                        let subCategory = {}
                        subCategory._id = cate[j]._id;
                        subCategory.categoryName = cate[j].categoryName;

                        let categ = await Categories.find({ "isDeleted": false, type: "subCategory2", "parentCategory": cate[j]._id, ...filter }, { _id: 1, categoryName: 1 });
                        if (categ.length > 0) {
                            subCategory.subCategory = categ;
                            subCategoryArray.push(subCategory)
                        }
                        else { subCategoryArray.push(subCategory) }
                        category.subCategoryArray = subCategoryArray
                    }
                }
                categoryList.push(category)
            }
            return this.res.send({ status: 1, message: "Category Details not found", data: categoryList });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Download CSV Of Categories Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
     {
            "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "categoryType":"category",
            "filter":{
                "isFood": false,
                "isVegetables":false,
                "isEcommerce": true,
                "isGame": false,
                "isWineShop":false,
                "isMovie": false,
                "isServices": false,
                "isEducation": false,
                "isInsurance": false,
                "isSports": false,
                "isMatrimony": false,
                "isDelivery": false,
                "isMedical": false,
                "isFuel": false,
                "isRide": false,
                "isTravel": false,
                "isDonation": false,
                "isGovt": false,
                "isCasino": false,
            },
            "searchText": "",
            "parentCategory":""
            "filteredFields": ["Parent Category Name", "Main Category Name", "Date", "Category Name", "Type", "Image","Custom Url", "Category Id", "Publish","Food Category", "Vegetable Category", "Game Category", "Ecommerce Category",
            "Wine Shop Category","Movie Category","Services Category","Education Category","Insurance Category","Sports Category","Matrimony Category","Delivery Category","Medical Category","Fuel Category","Ride Category","Travel Category","Donation Category","Govt Category","Casino Category",
            "Meta Title", "Meta Description", "Meta Keyword"] 
        }
    Return: JSON String
    ********************************************************/
    async downloadCategoriesFile() {
        try {
            let data = this.req.body;

            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            if (!data.categoryType) {
                return this.res.send({ status: 0, message: "Please send category type" });
            }
            const addOnFields = data.categoryType == 'category' ? [] :
                (data.categoryType == 'subCategory1' ? ["Parent Category Name"] : ["Parent Category Name", "Main Category Name"]);

            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Category Name", "Type", "Image", "Custom Url", "Category Id", "Publish",
                    "Food Category", "Vegetable Category", "Game Category", "Ecommerce Category",
                    "Wine Shop Category", "Movie Category", "Services Category", "Education Category",
                    "Insurance Category", "Sports Category", "Matrimony Category", "Delivery Category",
                    "Medical Category", "Fuel Category", "Ride Category",
                    "Travel Category", "Donation Category", "Govt Category", "Casino Category",
                    "Meta Title", "Meta Description", "Meta Keyword", ...addOnFields]
            /* filter code begins */
            let query = [{ isDeleted: false, type: data.categoryType }];
            if (data.startDate || data.endDate) {
                const dateQuery = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                query.push(...dateQuery)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }] })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            /* filter code ends */
            /* category type filteration code begins */
            const stages = data.categoryType == 'category' ? [] :
                (data.categoryType == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.categoryType == 'category' ? {} :
                (data.categoryType == 'subCategory1' ? subCategoryProjectionDownload : childCategoryProjectionDownload);
            /* category type filteration code ends */

            data['model'] = Categories;
            data['stages'] = stages;
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, "Category Name": "$categoryName", "Type": "$type", Image: "$image",
                    "Custom Url": "$customUrl", "Category Id": "$categoryId", "Publish": "$publish",
                    "Food Category": "$isFood", "Vegetable Category": "$isVegetables",
                    "Game Category": "$isGame", "Ecommerce Category": "$isEcommerce",
                    "Wine Shop Category": "$isWineShop",
                    "Movie Category": "$isMovie",
                    "Services Category": "$isServices",
                    "Education Category": "$isEducation",
                    "Insurance Category": "$isInsurance",
                    "Sports Category": "$isSports",
                    "Matrimony Category": "$isMatrimony",
                    "Delivery Category": "$isDelivery",
                    "Medical Category": "$isMedical",
                    "Fuel Category": "$isFuel",
                    "Ride Category": "$isRide",
                    "Travel Category": "$isTravel",
                    "Donation Category": "$isDonation",
                    "Govt Category": "$isGovt",
                    "Casino Category": "$isCasino",
                    "Meta Title": "$metaTitle", "Meta Description": "$metaDescription", "Meta Keyword": "$metaKeyword", ...projection
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'categories'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });
        }
        catch (error) {
            console.log("error", error)
            this.res.send({ status: 0, message: error })
        }
    }

}
module.exports = CategoriesController


