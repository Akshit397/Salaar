const _ = require("lodash");

const Controller = require("../base");
const { SellerNetworkSettings } = require('../../models/s_seller_network_settings');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");


class SellerNetworkSettingsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }
  
    /********************************************************
   Purpose: Create and Update Seller network settingss
   Method: Post
   Authorisation: true
   Parameter:
      {
          "width": 1,
          "depth": 2,
          "ULDownline": 3
      }
   Return: JSON String
   ********************************************************/
   async addAndUpdateSellerNetworkSettings() {
    try {
        let data = this.req.body;
        const fieldsArray = ["width","depth","ULDownline"]
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
            return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const getSellerNetworkSettings = await SellerNetworkSettings.findOne({isDeleted: false});
        if (_.isEmpty(getSellerNetworkSettings)) {
            const newSellerNetworkSettings = await new Model(SellerNetworkSettings).store(data);
            if (_.isEmpty(newSellerNetworkSettings)) {
                return this.res.send({ status: 0, message: "Details not saved" });
            }
            return this.res.send({ status: 1, message: "Seller network settings details created successfully", data: newSellerNetworkSettings });
        }else{
            const updatedSellerNetworkSettings = await SellerNetworkSettings.findOneAndUpdate({_id: getSellerNetworkSettings._id},data,{upsert:true, new:true})
            if (_.isEmpty(updatedSellerNetworkSettings)) {
                return this.res.send({ status: 0, message: "Details are not updated" });
            }
            return this.res.send({ status: 1, message: "Seller network settings details updated successfully", data: updatedSellerNetworkSettings });
        }
    } catch (error) {
        console.log("error- ", error);
        return this.res.send({ status: 0, message: "Internal server error" });
    }
}

    /********************************************************
    Purpose: Seller network settingss Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
    }
    Return: JSON String
    ********************************************************/
    async sellerNetworkSettingsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize
            const result = await SellerNetworkSettings.find({isDeleted:false}).sort(sort).skip(skip).limit(limit);
            const total = await SellerNetworkSettings.count({isDeleted:false})
            return this.res.send({status:1, message: "Listing details are: ", data: result,page: data.page, pagesize: data.pagesize, total: total});
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Seller network settingss Details
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getSellerNetworkSettingsDetails() {
        try {
            if (!this.req.params.sellerNetworkSettingsId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const sellerNetworkSettings = await SellerNetworkSettings.findOne({ _id: this.req.params.sellerNetworkSettingsId, isDeleted:false }, { __v: 0 });
            if (_.isEmpty(sellerNetworkSettings))
                return this.res.send({ status: 0, message: "Seller network settings not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: sellerNetworkSettings });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Seller network settingss 
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getSellerNetworkSettings() {
        try {
            const sellerNetworkSettings = await SellerNetworkSettings.findOne({ isDeleted:false }, { __v: 0 });
            if (_.isEmpty(sellerNetworkSettings))
                return this.res.send({ status: 0, message: "Seller network settings not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: sellerNetworkSettings });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

     /********************************************************
     Purpose: single and multiple Seller network settings's change status
     Parameter:
     {
        "sellerNetworkSettingsIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
     }
     Return: JSON String
     ********************************************************/
     async changeStatusOfSellerNetworkSettings() {
        try {
            let msg = "Seller network settingss status not updated";
            const updatedSellerNetworkSettings = await SellerNetworkSettings.updateMany({ _id: { $in: this.req.body.sellerNetworkSettingsIds } }, { $set: { status: this.req.body.status } });
            console.log("updatedSellerNetworkSettings",updatedSellerNetworkSettings)
            if (updatedSellerNetworkSettings) {
                msg = updatedSellerNetworkSettings.modifiedCount ? updatedSellerNetworkSettings.modifiedCount + " seller network settingss updated" : updatedSellerNetworkSettings.matchedCount == 0 ? "Seller network settingss not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
       Purpose: Delete Single And Multiple Seller network settingss Details In Admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "sellerNetworkSettingsIds":["5cd01da1371dc7190b085f86"]
       }
       Return: JSON String
       ********************************************************/
       async deleteSellerNetworkSettings() {
        try {
            if (!this.req.body.sellerNetworkSettingsIds) {
                return this.res.send({ status: 0, message: "Please send sellerNetworkSettingsIds" });
            }
            let msg = 'Seller network settings not deleted.';
            let status = 1;
            const updatedSellerNetworkSettings = await SellerNetworkSettings.updateMany({ _id: { $in: this.req.body.sellerNetworkSettingsIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedSellerNetworkSettings) {
                msg = updatedSellerNetworkSettings.modifiedCount ? updatedSellerNetworkSettings.modifiedCount + ' seller network settings deleted.' : updatedSellerNetworkSettings.matchedCount== 0 ? "Details not found" : msg;
                status = updatedSellerNetworkSettings.matchedCount== 0? 0:1
            }
            return this.res.send({ status, message: msg });
            
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = SellerNetworkSettingsController;