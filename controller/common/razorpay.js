/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const axios = require('axios');

const RazorpayUrl = 'https://api.razorpay.com/v1/';
const token = `${
    process.env.RAZORPAY_KEY
}:${
    process.env.RAZORPAY_SECRET
}`;
const encodedToken = Buffer.from(token).toString('base64');

class RazorpayController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
    }

    /*
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt#1",
  "notes": {
   order_id:kandngfadglda
  }
}
  */
    createRazorpayOrder = async () => {
        try {
            let payload = {
                amount: this.req.body.amount * 100,
                currency: "INR",
                receipt: 'S' + Date.now()
            };
            const options = {
                method: 'post',
                url: RazorpayUrl + 'orders',
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': 'Basic ' + encodedToken
                },
                data: payload
            }
            let res = await axios.request(options);
            return this.res.send({status: 0, razorpay_key: process.env.RAZORPAY_KEY, order: res.data});

        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }

    /********************************************************
     Purpose: Create a Contact for payout
     Method: Post
     Authorisation: true
     Parameter:
     {
       "name": "Gaurav Kumar",
       "email": "gauravkumar@example.com",
       "contact": 9123456789,
       "type": "employee",
      "reference_id": "Acme Contact ID 12345",
       "notes":{
          "random_key_1": "Make it so.",
          "random_key_2": "Tea. Earl Grey. Hot."
          }
      }
      Return: JSON String
      {
	      "status": 1,
	      "data": {
	      	"id": "cont_MP4booOviOBAEx",
	      	"entity": "contact",
	      	"name": "Gaurav Kumar",
	      	"contact": "9123456789",
	      	"email": "gauravkumar@example.com",
	      	"type": "employee",
	      	"reference_id": "Acme Contact ID 12345",
	      	"batch_id": null,
	      	"active": true,
	      	"notes": {
	      		"random_key_1": "Make it so.",
	      		"random_key_2": "Tea. Earl Grey. Hot."
	      	},
	      	"created_at": 1691825041
	      }
     }
      ********************************************************/
    createContact = async (userData) => {
        try {
            const options = {
                method: 'post',
                url: RazorpayUrl + 'contacts',
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': 'Basic ' + encodedToken
                },
                data: userData
            }
            let res = await axios.request(options);
            return res.data

        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }

    /********************************************************
     Purpose: Update Contact & Activate or DeActivate the contact details
     Method: Post
     Authorisation: true

     For contact details update below parameters 
     Parameter:
     {
       "name": "Gaurav Kumar",
       "email": "gauravkumar@example.com",
       "contact": 9123456789,
       "type": "employee",
      "reference_id": "Acme Contact ID 12345",
       "notes":{
          "random_key_1": "Make it so.",
          "random_key_2": "Tea. Earl Grey. Hot."
          }
      }
      Return: JSON String

    For contact  Activate or DeActivate below parameters 
     Parameter:
     {
       "active": false
      }
      Return: JSON String

      ********************************************************/
    updateContactOrActivOrInActiv = async (cust_id, data) => {
        try {
            const config = {
                method: 'PATCH',
                url: RazorpayUrl + `contacts/${cust_id}`,
                headers: {
                    'Authorization': 'Basic ' + encodedToken
                },
                data: data
            }
            const res = await axios.request(config);
            return res.data
        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }

    /********************************************************
     Purpose: Create a Fund account details
     Method: Post
     Authorisation: true

     For contact details update below parameters 
     Parameter:
     {
        "contact_id": "cont_MP4booOviOBAEx",
        "account_type": "bank_account",
        "bank_account": {
          "name": "Gaurav Kumar",
          "ifsc": "HDFC0009107",
          "account_number": "50100102283912"
        }
      }
      Return: JSON String
      {
	        "id": "fa_MP8N1YLbTqODY9",
	        "entity": "fund_account",
	        "contact_id": "cont_MP4booOviOBAEx",
	        "account_type": "bank_account",
	        "bank_account": {
	        	"ifsc": "HDFC0009107",
	        	"bank_name": "HDFC Bank",
	        	"name": "Gaurav Kumar",
	        	"notes": [],
	        	"account_number": "50100102283912"
	        },
	        "batch_id": null,
	        "active": true,
	        "created_at": 1691838287
       }

      ********************************************************/
    createFundAccount = async (data) => {
        try {
            const config = {
                method: 'POST',
                url: RazorpayUrl + `fund_accounts`,
                headers: {
                    'Authorization': 'Basic ' + encodedToken
                },
                data: data
            }
            const res = await axios.request(config);
            return res.data
        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }

    /********************************************************
     Purpose: Create a Fund account details
     Method: Post
     Authorisation: true

     For contact details update below parameters 
     Parameter:
    {
        "account_number": "7878780080316316", ----> Note this account_number from razorpay x account number
        "fund_account_id": "fa_00000000000001",
        "amount": 1000000,
        "currency": "INR",
        "mode": "IMPS",
        "purpose": "refund",
        "queue_if_low_balance": true,
        "reference_id": "Acme Transaction ID 12345",
        "narration": "Acme Corp Fund Transfer",
        "notes": {
          "notes_key_1":"Tea, Earl Grey, Hot",
          "notes_key_2":"Tea, Earl Grey… decaf."
        }
    }
      Return: JSON String

      ********************************************************/
    createPayout = async (data) => {
        try {
            const config = {
                method: 'POST',
                url: RazorpayUrl + `payouts`,
                headers: {
                    'Authorization': 'Basic ' + encodedToken
                },
                data: data
            }
            const res = await axios.request(config);
            return res.data
        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }

        /********************************************************
        Purpose: Get all Payouts
        Method: Get
        Authorisation: true

        Parameter:
        "account_number": "7878780080316316", ----> Note this account_number from razorpay x account number
        Return: JSON String

        ********************************************************/
    getPayouts = async (accountNumber) => {
        try {
            const config = {
                method: 'GET',
                url: `${RazorpayUrl}payouts?account_number=${accountNumber}`,
                headers: {
                    'Authorization': 'Basic ' + encodedToken
                }
            }
            const res = await axios.request(config);
            return res.data
        } catch (error) {
            return {status: 0, error: error.response.data};
        }
    }
    

}

module.exports = RazorpayController;
