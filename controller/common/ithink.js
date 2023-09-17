const _ = require("lodash");
const axios = require("axios");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
class IthinkController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.requestBody = new RequestBody();
  }

  async axiosPostAPICall({ requestBody, requestUrl }) {
    return new Promise(async (resolve, reject) => {
      try {
        const url = process.env.IthinkUrl;
        const access_token = process.env.IthinkAccessToken;
        const secret = process.env.IthinkSecret;
        const data = JSON.stringify({
          data: {
            ...requestBody,
            access_token: access_token,
            secret_key: secret,
          },
        });
        const config = {
          method: "post",
          maxBodyLength: Infinity,
          url: `${url}${requestUrl}`,
          headers: {
            "Content-Type": "application/json",
            Cookie: "PHPSESSID=b1f2dbddcb43353aad5c3b5f86136de8",
          },
          data: data,
        };
        await axios
          .request(config)
          .then((response) => {
            resolve({ status: 1, data: response.data });
          })
          .catch((error) => {
            reject({ status: 0, message: error });
          });
      } catch (error) {
        reject({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
    Purpose: pin code verification check for order delivery
    Method: Post
    Authorisation: true
    {
        "pincode":"533287"
    }
    Return: JSON String
    ********************************************************/
  async pinCodeCheck() {
    try {
      const data = this.req.body;
      if (!data.pincode) { return this.res.send({ status: 0, message: "Please send pincode details" }); }
      const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/pincode/check.json` })
      return this.res.send({ status: response.status, data: response.data });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: getting states of specific country
    Method: Post
    Authorisation: true
    {
        "country_id":"533287"
    }
    Return: JSON String
    ********************************************************/
  async getStates() {
    try {
      const data = this.req.body;
      if (!data.country_id) { return this.res.send({ status: 0, message: "Please send country_id details" }); }
      const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/state/get.json` })
      return this.res.send({ status: response.status, data: response.data });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: getting cities of specific state
   Method: Post
   Authorisation: true
   {
       "state_id":"533287"
   }
   Return: JSON String
   ********************************************************/
  async getCities() {
    try {
      const data = this.req.body;
      if (!data.state_id) { return this.res.send({ status: 0, message: "Please send state_id details" }); }
      const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/city/get.json` })
      return this.res.send({ status: response.status, data: response.data });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
  Purpose: adding warehouse details
  Method: Post
  Authorisation: true
  {
    "company_name": "ITL",
    "address1": "104,Shreeji Sharan Kandivali West",
    "address2": "Near Icici Bank",
    "mobile": "9876543210",
    "pincode": "517001",
    "city_id": "54",
    "state_id": "2",
    "country_id": "101"
  }
  Return: JSON String
  ********************************************************/
  async addWareHouseDetails({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["company_name", "address1", "address2", "mobile", "pincode", "city_id", "state_id", "country_id"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/warehouse/add.json` })
        resolve(response);
      } catch (error) {
        console.log(`error: ${error}`)
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
 Purpose: getting rate details
 Method: Post
 Authorisation: true
 {
    "from_pincode": "400092",
    "to_pincode": "400061",
    "shipping_length_cms": "15",
    "shipping_width_cms": "12",
    "shipping_height_cms": "12",
    "shipping_weight_kg": "1", 
    "order_type": "forward",
    "payment_method": "prepaid",
    "product_mrp": "1200.00",
 }
 Return: JSON String
 ********************************************************/
  async getRateDetails({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["from_pincode", "to_pincode", "shipping_length_cms", "shipping_width_cms", "shipping_height_cms",
          "shipping_weight_kg", "order_type", "payment_method", "product_mrp"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/rate/check.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
Purpose: gettng rate details
Method: Post
Authorisation: true
    {
      "data": {
        "shipments": [{
          "waybill": "",
          "order": "GK0033",
          "sub_order": "A",
          "order_date": "31-01-2018",
          "total_amount": "999",
          "name": "Bharat",
          "company_name": "ABC Company",
          "add": "104, Shreeji Sharan",
          "add2": "",
          "add3": "",
          "pin": "400067",
          "city": "Mumbai",
          "state": "Maharashtra",
          "country": "India",
          "phone": "9876543210",
          "alt_phone": "9876543210",
          "email": "abc@gmail.com",
          "is_billing_same_as_shipping": "no",
          "billing_name": "Bharat",
          "billing_company_name": "ABC Company",
          "billing_add": "104,Shreeji Sharan",
          "billing_add2": "",
          "billing_add3": "",
          "billing_pin": "400067",
          "billing_city": "Mumbai",
          "billing_state": "Maharashtra",
          "billing_country": "India",
          "billing_phone": "9876543210",
          "billing_alt_phone": "9876543210",
          "billing_email": "abc@gmail.com",
          "products": [{
              "product_name": "Green color tshirt",
              "product_sku": "GC001-1",
              "product_quantity": "1",
              "product_price": "100",
              "product_tax_rate": "5",
              "product_hsn_code": "91308",
              "product_discount": "0"
            },
            {
              "product_name": "Red color tshirt",
              "product_sku": "GC002-2",
              "product_quantity": "1",
              "product_price": "200",
              "product_tax_rate": "5",
              "product_hsn_code": "91308",
              "product_discount": "0"
            }
          ],
          "shipment_length": "10",
          #in cm "shipment_width": "10",
          #in cm "shipment_height": "5",
          #in cm "weight": "400",
          #in Kg "shipping_charges": "0",
          "giftwrap_charges": "0",
          "transaction_charges": "0",
          "total_discount": "0",
          "first_attemp_discount": "0",
          "cod_charges": "0",
          "advance_amount": "0",
          "cod_amount": "300",
          "payment_mode": "COD",
          #For reverse Shipments: Prepaid Only "reseller_name": "",
          "eway_bill_number": "",
          "gst_number": "",
          "return_address_id": "24"
          "api_source": "0"
          #Service source used to book orders => 1: own website,
          11: Uinware,
          12: easyecom "store_id": "1"
          #Id of your store which is integrated in iThink,
          will be provided by iThink
        }],
        "pickup_address_id": "24",
        "access_token": "8ujik47cea32ed386b1f65c85fd9aaaf",
        #You will get this from iThink Logistics Team "secret_key": "65tghjmads9dbcd892ad4987jmn602a7",
        #You will get this from iThink Logistics Team "logistics": "Delhivery",
        #Allowed values delhivery,
        fedex,
        xpressbees,
        ecom,
        ekart.For reverse Shipments: Delhivery Only "s_type": "",
        #If fedex than Allowed values standard,
        priority,
        ground.
        "order_type": ""
        #If placing reverse shipment,
        pass 'reverse'
        else can be left blank.
      }
    }
Return: JSON String
********************************************************/
  async placeOrder({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/order/add.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
  Purpose: order tracking details
  Method: Post
  Authorisation: true
  {
    "awb_number_list": "1369010468790",
  }
  Return: JSON String
  ********************************************************/
  async orderTracking({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["awb_number_list"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/order/track.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        console.log(`error: ${JSON.stringify(error)}`)
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
  Purpose: get shipmentLabel
  Method: Post
  Authorisation: true
  {
    "awb_numbers" : "86210010463",       #AWB Number whose data is needed.
    "page_size" : "A4",
    "display_cod_prepaid" : "",        #1- yes, 0- No, blank - Default as per settings.     #NEW
    "display_shipper_mobile" : "",         #1- yes, 0- No, blank - Default as per settings.      #NEW
    "display_shipper_address" : "",        #1- yes, 0- No, blank - Default as per settings.        #NEW
  }
  Return: JSON String
  ********************************************************/
  async getShipmentLabelOfOrder({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["awb_numbers", "page", "display_cod_prepaid", "display_shipper_mobile", "display_shipper_address"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/shipping/label.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        console.log(`error: ${JSON.stringify(error)}`)
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
  Purpose: get manifest of an order
  Method: Post
  Authorisation: true
  {
    "awb_numbers" : "86210010463",       #AWB Number whose data is needed.
  }
  Return: JSON String
  ********************************************************/
  async getManifestDetailsOfOrder({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["awb_numbers"];
        console.log(`awb_numbers: ${data.awb_numbers}`)
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/shipping/manifest.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        console.log(`error: ${JSON.stringify(error)}`)
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }

  /********************************************************
  Purpose: cancel order
  Method: Post
  Authorisation: true
  {
    "awb_numbers" : "86210010463",       #AWB Number whose data is needed.
  }
  Return: JSON String
  ********************************************************/
  async cancelOrder({ ithinkData }) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = ithinkData;
        const fieldsArray = ["awb_numbers"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          resolve({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
        }
        const response = await this.axiosPostAPICall({ requestBody: data, requestUrl: `/api_v3/order/cancel.json` })
        resolve({ status: response.status, data: response.data });
      } catch (error) {
        console.log(`error: ${JSON.stringify(error)}`)
        resolve({ status: 0, message: "Internal server error" });
      }
    })
  }




}
module.exports = IthinkController;
