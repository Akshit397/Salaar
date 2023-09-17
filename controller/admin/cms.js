const _ = require("lodash");

const CmsPages = require('../../models/s_cms').CmsPages;
const Controller = require("../base");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const DownloadsController = require('../common/downloads');


class CmsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add And Update Cms Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "metaTitle": "salar",
        "metaKeyword": "salar",
        "metaDescription": "salar",
        "pageName": "About Us",
        "pageUrl": "http://aboutus.com",
        "content":"content of cms page."
        "cmsId": "5ccff9936ba79c09bd8293a8"
    }
    Return: JSON String
    ********************************************************/
    async addCms() {
        try {
            let data = this.req.body
            if (this.req.body.cmsId) {
                const updatedCms = await CmsPages.findByIdAndUpdate(this.req.body.cmsId, data);
                if (_.isEmpty(updatedCms))
                    return this.res.send({ status: 0, message:"Details not updated" });
                return this.res.send({ status: 1, message: "CMS updated successfully"});
            }
            else {
                let checkPage = await CmsPages.findOne({ pageName: this.req.body.pageName, isDeleted: false });
                if (!_.isEmpty(checkPage))
                    return this.res.send({ status: 0, message: "CMS name is already exists" });
                const newCms = await new Model(CmsPages).store(data);
                if (_.isEmpty(newCms))
                    return this.res.send({ status: 0, message: "Details not saved"});
                return this.res.send({ status: 1, message: "CMS details added successfully", data: newCms });
            }
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

  /********************************************************
    Purpose: Get Cms Details In Admin
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getCmsDetails() {
        try {
            let cms = await CmsPages.findOne({ _id: this.req.params.cmsId , isDeleted: false}, { __v: 0 });
            if (_.isEmpty(cms))
                return this.res.send({ status: 0, message: "Details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: cms });
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: CmsListing Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2022-09-25",
        "filter": {
            "status": true
        },
        "searchText": ""
    }
    Return: JSON String
    ********************************************************/
    async cmsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if(data.startDate || data.endDate){
                query = await new DownloadsController().dateFilter({key: 'createdAt', startDate: data.startDate, endDate: data.endDate})
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if(data.searchText){
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ pageName: regex }, {content: regex}, {pageUrl: regex}, {metaTitle: regex},  {metaDescription: regex}, {metaKeyword: regex}] })
            }
            const filterQuery = data.filter ? data.filter: {}
            const result = await CmsPages.aggregate([
                {$match: { isDeleted: false, $and: query}},
                {$match: filterQuery},
                {$sort: sort},
                {$skip: skip},
                {$limit: limit},
            ]);
            const total = await CmsPages.aggregate([
                {$match: { isDeleted: false, $and: query}},
                {$match: filterQuery},
                {$project: {_id:1}}
            ])
            return this.res.send({status:1, message: "Listing details are: ", data: result,page: data.page, pagesize: data.pagesize, total: total.length});
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /********************************************************
    Purpose: Change Status Of Cms In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "cmsIds":["5cd01da1371dc7190b085f86"],
        "status":false
    }
    Return: JSON String
    ********************************************************/
    async changeCmsStatus() {
        try {
            let model = this.req.model ? this.req.model : CmsPages;
            let msg = 'CMS details not updated.';
            const updatedCms = await model.updateMany({ _id: { $in: this.req.body.cmsIds } }, { $set: { status: this.req.body.status } });
            console.log(`updatedCms: ${JSON.stringify(updatedCms)}`)
            if (updatedCms) {
                msg = updatedCms.modifiedCount ? updatedCms.modifiedCount + ' CMS details updated.' : updatedCms.n == 0 ? "Details not found": msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Download both Excel and CSV Of Cms Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
     {
            "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "filter": {
                "status": true
            },
            "searchText": "",
            "filteredFields": ["Page Name", "Page Url"] 
        }
    Return: JSON String
    ********************************************************/
    async downloadCmsFile() {
        try {
            let data =  this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if(data.startDate || data.endDate){
                query = await new DownloadsController().dateFilter({key: 'createdAt', startDate: data.startDate, endDate: data.endDate})
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if(data.searchText){
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ pageName: regex }, {content: regex}, {pageUrl: regex}, {metaTitle: regex},  {metaDescription: regex}, {metaKeyword: regex}] })
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date","Page Name","Page Url" ,"Content" ,"Meta Title" ,"Meta Description" ,"Meta Keyword", "Status"]

               
                 const downloadFilesStagesProjection = [
                     {$project: {
                         "Date":{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt"} }, 
                         "Page Name":"$pageName",
                         "Page Url": "$pageUrl",
                         "Content": "$content",
                         "Meta Title":"$metaTitle",
                         "Meta Description": "$metaDescription",
                         "Meta Keyword": "$metaKeyword",
                         "Status": "$status"
                         }}
                 ]
            data['model'] = CmsPages;
            data['stages'] = [];
            data['projectData'] = downloadFilesStagesProjection;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query};
            data['filterQuery'] = data.filter ? data.filter: {}
            data['fileName'] = 'cms'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status:1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });
            
         }
        catch (error) {
            console.log("error", error)
            this.res.send({ status: 0, message: error })
        }
    }

    /********************************************************
       Purpose: Delete Single And Multiple Cms Details In Admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "cmsIds":["5cd01da1371dc7190b085f86"]
       }
       Return: JSON String
       ********************************************************/
       async deleteCms() {
        try {
            let model = this.req.model ? this.req.model : CmsPages;
            let msg = 'CMS not deleted.';
            const updatedCms = await model.updateMany({ _id: { $in: this.req.body.cmsIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedCms) {
                msg = updatedCms.modifiedCount ? updatedCms.modifiedCount + ' CMS deleted.' : updatedCms.n == 0 ? "Details not found" : msg;
            }
            return this.res.send({ status: 1, message: msg });

        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = CmsController
