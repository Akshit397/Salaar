const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { Stores } = require('../../models/s_store');
const { Sellers } = require('../../models/s_sellers');
const { Country } = require('../../models/s_country');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');
const IthinkController = require('../common/ithink');


const storesListingStages = [
    { $lookup: { from: "countries", localField: "storeAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            _id: 1, createdAt: 1, registerId: 1, name: 1,
            logo: 1, banner: 1, storeLink: 1, mobileNo: 1, whatsappNo: 1,
            emailId: 1, storeAddress: 1, status: 1, approvalStatus: 1, country: 1,
            storeType: 1, locationAddress: 1, location: 1, restaurantType: 1, establishmentType: 1,
            ownerName: 1, contactNo: 1, operationalHours: 1
        }
    }
]

class StoresController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Store details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "storeType": "isEcommerce" // or "isFood"
        "name": "SRS Stores",
        "logo": "logo.png",
        "banner": "banner.png",
        "mobileNo": "7207334583",
        "whatsappNo": "7207334583",
        "emailId": "lakshmimattafreelancer@gmail.com",
        "storeLink":"",
        "storeAddress": {
            "addressLine1":"addressLine1",
            "addressLine2":"addressLine2",
            "countryId":"630f516684310d4d2a98baf2",
            "city":"Rajahmundry",
            "cityId":"215",
            "state":"Andhra Pradesh",
            "stateId":"2",
            "pincode":533287
        }
        "location": {
                "type": "Point",
                "coordinates": [81.6878095, 17.1763623] // [longitude, latitude]
        },
        "locationAddress": "Seethanagaram, Andhara Pradesh",
        "operationalHours": [{
            "day": "Monday",
            "timings": [
               { 
                "startTime": {
                    "hours": 9,
                    "mins": 30,
                    "meridiem": "AM"
                },
                  "endTime": {
                    "hours": 9,
                    "mins": 30,
                    "meridiem": "AM"
                }
            }
            ]
        }],
        // extra fields for restaurant
        "ownerName":"Salar",
        "contactNo":" 7207334583",
        "establishmentType": ["Both Delivery and Delivery", "Dine-in", "Delivery"],
        "restaurantType": ["Pure Veg", "Non-Veg", "Both Veg & Non-Veg"], 
        "cuisineIds": ["64731f509649a79c3049a892","64731f599649a79c3049a898","64731f6a9649a79c3049a89e","64731f9e9649a79c3049a8a4"],
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateStore() {
        try {
            const currentSellerId = this.req.user;
            let data = this.req.body;
            data.sellerId = currentSellerId;
            const fieldsArray =
                data.storeType == "isEcommerce"
                    ? ["name", "logo", "banner", "storeLink", "mobileNo", "whatsappNo",
                        "emailId", "storeAddress", "location", "locationAddress", "operationalHours"]
                    : ["name", "logo", "banner", "storeLink", "mobileNo", "whatsappNo",
                        "emailId", "storeAddress", "location", "locationAddress", "operationalHours",
                        "ownerName", "contactNo", "establishmentType", "restaurantType", "cuisineIds"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const seller = await Sellers.findOne({ _id: currentSellerId }, { _id: 1 })
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            const country = await Country.findOne({ _id: data.storeAddress.countryId }, { _id: 1, countryId: 1 })
            if (_.isEmpty(country)) {
                return this.res.send({ status: 0, message: "Seller not found" });
            }
            const ithinkData = {
                "company_name": data.name,
                "address1": data.storeAddress.addressLine1,
                "address2": data.storeAddress.addressLine2,
                "mobile": data.mobileNo,
                "pincode": data.storeAddress.pincode,
                "city_id": data.storeAddress.cityId,
                "state_id": data.storeAddress.stateId,
                "country_id": country.countryId
            }
            if (data.storeId) {
                const updatedStore = await Stores.findByIdAndUpdate(data.storeId, data, { new: true, upsert: true });
                await this.addingWareHouseIdToSellerProfile({ ithinkData, store: updatedStore });
                return this.res.send({ status: 1, message: "Store details updated successfully" });
            } else {
                const getStore = await Stores.findOne({ sellerId: currentSellerId, isDeleted: false })
                if (!_.isEmpty(getStore)) {
                    return this.res.send({ status: 0, message: "Store details exists" })
                }
                let sellersCount = await Sellers.count();
                if (sellersCount <= 8) {
                    sellersCount = '0' + (sellersCount + 1);
                }
                const randomText = (await this.commonService.randomGenerator(2, 'number') + await this.commonService.randomGenerator(1, 'capital') + await this.commonService.randomGenerator(2, 'number'))
                data['registerId'] = 'ST' + randomText + sellersCount
                const newStore = await new Model(Stores).store(data);
                if (_.isEmpty(newStore)) {
                    return this.res.send({ status: 0, message: "Store details not saved" })
                }
                if (data.storeType == "isEcommerce") {
                    await this.addingWareHouseIdToSellerProfile({ ithinkData, store: newStore });
                }
                return this.res.send({ status: 1, message: "Store details added successfully" });
            }
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    async addingWareHouseIdToSellerProfile({ ithinkData, store }) {
        const ithinkController = await new IthinkController();
        const response = await ithinkController.addWareHouseDetails({ ithinkData });
        console.log(`response: ${JSON.stringify(response)}`)
        // updating Ithink wareHouseId
        await Stores.findByIdAndUpdate(store._id, { wareHouseId: response.data.warehouse_id }, { new: true, upsert: true });
    }

    /********************************************************
   Purpose: Get Store Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getStore() {
        try {
            const data = this.req.params;
            if (!data.storeId) {
                return this.res.send({ status: 0, message: "Please send storeId" });
            }
            const store = await Stores.findOne({ sellerId: this.req.user, _id: data.storeId, isDeleted: false }, { _v: 0 })
                .populate('storeAddress.countryId', { name: 1, iso: 1, nickname: 1, countryId: 1 })
                .populate('cuisineIds', { categoryName: 1, image: 1, type: 1, });
            if (_.isEmpty(store)) {
                return this.res.send({ status: 0, message: "Store details not found" });
            }
            return this.res.send({ status: 1, data: store });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
 Purpose: single and multiple store change status
 Parameter:
 {
    "storeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
    "status":true
 }
 Return: JSON String
 ********************************************************/
    async changeStatusOfStores() {
        try {
            let msg = "Store status not updated";
            const updatedStores = await Stores.updateMany({ _id: { $in: this.req.body.storeIds } }, { $set: { status: this.req.body.status } });
            console.log("updatedStores", updatedStores)
            if (updatedStores) {
                msg = updatedStores.modifiedCount ? updatedStores.modifiedCount + " store updated" : updatedStores.matchedCount == 0 ? "Store not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Store details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "storeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteStores() {
        try {
            if (!this.req.body.storeIds) {
                return this.res.send({ status: 0, message: "Please send storeIds" });
            }
            let msg = 'Store not deleted.';
            let status = 1;
            const updatedStores = await Stores.updateMany({ _id: { $in: this.req.body.storeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedStores) {
                msg = updatedStores.modifiedCount ? updatedStores.modifiedCount + ' store deleted.' : updatedStores.matchedCount == 0 ? "Details not found" : msg;
                status = updatedStores.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: stores Listing in seller
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-09-25",
          "filter": {
              "status": true,
              "approvalStatus": "Approved",
              "country.name":"India",
              "storeType":"isEcommerce"
          },
          "searchText": "",
      }
      Return: JSON String
      ********************************************************/
    async storesListing() {
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
                query.push({
                    $or: [{ name: regex }, { mobileNo: regex },
                    { whatsappNo: regex }, { emailId: regex },
                    { establishmentType: regex }, { restaurantType: regex },
                    { ownerName: regex }, { contactNo: regex },]
                })
            }
            const filterQuery = data.filter ? data.filter : {}
            const result = await Stores.aggregate([
                { $match: { isDeleted: false, $and: query, sellerId: ObjectID(this.req.user) } },
                ...storesListingStages,
                { $match: filterQuery },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Stores.aggregate([
                { $match: { isDeleted: false, $and: query, sellerId: ObjectID(this.req.user) } },
                ...storesListingStages,
                { $match: filterQuery },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = StoresController;