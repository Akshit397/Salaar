const _ = require("lodash");
const moment = require("moment");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const RazorpayController = require("../common/razorpay");
const { WithdrawManagement } = require("../../models/s_withdraw")
const { BankDetails } = require("../../models/s_bank_details")
const { AdminSettings } = require('../../models/s_admin_settings');
const { default: mongoose } = require("mongoose");

class AdminRazorpayController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.requestBody = new RequestBody();
  }

  payToBankAccount = async (fund_account_id, mode, purpose, amount = 0) => {
    let Payload = {
      account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
      fund_account_id,
      amount: amount * 100,
      currency: "INR",
      mode,
      purpose,
      reference_id: String(Math.floor(new Date().getTime() / 1000))
    }

    if (this.req.body.queueIfLowBalance) Payload["queue_if_low_balance"] = true
    let resp = await new RazorpayController().createPayout(Payload)
    return resp
  }

  /********************************************************
    Purpose: Make Payout to specific account or bulk accounts
    Method: Post
    Authorisation: true
    Parameter:
    {
      "userId": ObjectId (Optional)
      "queueIfLowBalance": boolean (Optional)
      "mode": 'NEFT' | 'RTGS' | 'IMPS' | 'card'
      "purpose": 'refund' | 'cashback' | 'payout' | 'salary'
    }     
    Return: JSON String
  ********************************************************/
  createPayout = async () => {
    try {

      const fieldsArray = ["withdrawal_ids"];
      const data = this.req.body
      const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray,);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send" + " " + emptyFields.toString() + " fields required."
        });
      }

      const successWIds = [];

      for (var i = 0; i < data.withdrawal_ids.length; i++) {
        const ele = data.withdrawal_ids[i];

        const withdrawalDetail = await WithdrawManagement.findOne({
          _id: ele,
          status: "pending"
        })

        if (_.isEmpty(withdrawalDetail)) {
          continue;
        }

        const bankDetails = await BankDetails.findOne({
          userId: withdrawalDetail.userId,
          isDeleted: false,
          /* accountNumber: withdrawalDetail.bank_details.account_no,
          fundAccountId: { $exists: true } */
        })

        if (bankDetails) {
          const resp = await this.payToBankAccount(bankDetails.fundAccountId, this.req.body.mode, this.req.body.purpose, withdrawalDetail.netpayable_amount)
          if (resp.error) return this.res.status(400).send({ status: 0, message: error })
          withdrawalDetail.status = "successful"
          withdrawalDetail.razorpay_resp = resp
          withdrawalDetail.bank_details = bankDetails
          await withdrawalDetail.save();
          successWIds.push(ele);
          continue;

        } else {
          continue;
        }

      }

      return this.res.json({
        status: 1,
        successWIds: successWIds
      })


      /* if (this.req.body.userId) {
        const bankDetails = await BankDetails.findOne({
          userId: withdrawalDetail.userId,
          isDeleted: false,
          accountNumber: withdrawalDetail.bank_details.account_no,
          fundAccountId: { $exists: true }
        })

        if (bankDetails) {
          const { error, status } = await this.payToBankAccount(bankDetails.fundAccountId, this.req.body.mode, this.req.body.purpose, withdrawalDetail.netpayable_amount)
          if (error) return this.res.status(400).send({ status: 0, message: error })
          return this.res.status(200).send({ status, message: "Payout Created successfully" })
        }
      } else { //bulk
        const bankAccounts = await BankDetails.find({
          userId: { $exists: true },
          isDeleted: false,
          fundAccountId: { $exists: true }
        })
        for (const account of bankAccounts) {
          const { error } = await this.payToBankAccount(account.fundAccountId, this.req.body.mode, this.req.body.purpose)
          if (error) return this.res.status(400).send({ status: 0, message: error })
        }
        return this.res.status(200).send({ status: 1, message: "Payout Created successfully" });
      } */
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error", error: error });
    }
  }

  /********************************************************
    Purpose: Get all payouts by accountnumber
    Method: Get
    Authorisation: true       
    Return: JSON String
  ********************************************************/
  getPayouts = async () => {
    try {
      const payouts = await new RazorpayController().getPayouts(process.env.RAZORPAY_X_ACCOUNT_NUMBER)
      return this.res.status(200).send({ status: 1, payouts })
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: get withdraw request data by type(user or seller) or for both
    Method: Get
    Authorisation: true
    Query Parameter (Optional):
    {
      "type": 'user' or 'seller'
    }          
    Return: JSON String
  ********************************************************/
  getWithdrawHistoryList = async () => {
    try {
      let condition = {};
      const data = this.req.query;
      if (this.req.query.type) condition = { [this.req.query.type == 'user' ? 'userId' : 'sellerId']: { $exists: true } }
      var sort = {
        createdAt: -1
      }

      const withdraw = await WithdrawManagement.find(condition).populate("userId").sort(sort).limit(data.limit ? Number(data.limit) : 10).skip(data.offset ? Number(data.offset) : 0)
      if (_.isEmpty(withdraw)) {
        return this.res.status(400).send({ status: 0, message: "Withdraw List Empty" })
      }
      return this.res.status(200).send({ status: 1, data: withdraw });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Get pyout sum filtered by status and date
    Method: Get
    Authorisation: true
    Query Parameter:
    {
      "status": pending | successful | rejected
      "date" (Optional)
    }
    Return: JSON String
  ********************************************************/
  getPayoutTotal = async () => {
    try {
      const requiredFields = [];
      const { status, date } = this.req.query
      const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.query, requiredFields);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send" + " " + emptyFields.toString() + " fields required."
        });
      }

      const filter = {}

      if (status) {
        filter.status = status;
      }

      if (date) { // to get single day's result
        filter['createdAt'] = {
          $gte: new Date(moment(new Date(date)).utc().startOf("day")),
          $lte: new Date(moment(new Date(date)).utc().endOf("day"))
        }
      }

      const total = await WithdrawManagement.aggregate([
        {
          $match: filter
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$requested_amount" },
            tdsTotal: { $sum: "$tds_amount" },
            adminTotal: { $sum: "$admin_amount" },
            netpayableTotal: { $sum: "$netpayable_amount" },
            number: { $sum: 1 }
          }
        }
      ])
      return this.res.status(200).send({
        status: 1,
        total
      });
    } catch (e) {
      console.log(e)
    }
  }

  payoutStatistics = async () => {

    try {

      const filter = {}
      const { status, date, type } = this.req.query
      /* if (status) {
        filter.status = status;
      } */
      var groupField = "$date";

      if (type == 'total') {
        groupField = null
      }
      if (date) { // to get single day's result
        filter['createdAt'] = {
          $gte: new Date(moment(new Date(date)).utc().startOf("day")),
          $lte: new Date(moment(new Date(date)).utc().endOf("day"))
        }
      }

      const total = await WithdrawManagement.aggregate([
        {
          $match: filter
        }, {
          $addFields: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          }
        },
        {
          $group: {
            _id: groupField,
            dateGrouped: { $addToSet: '$$ROOT' },
            requested_amount: {
              $first: "$requested_amount"
            },
            tds_amount: {
              $first: "$tds_amount"
            },
            admin_amount: {
              $first: "$admin_amount"
            },
            netpayable_amount: {
              $first: "$netpayable_amount"
            },
            status: {
              $first: "$status"
            },

            // total: { $sum: "$requested_amount" },
            tdsTotal: { $sum: "$tds_amount" },
            adminTotal: { $sum: "$admin_amount" },
            netpayableTotal: { $sum: "$netpayable_amount" },
            number: { $sum: 1 }
          }
        },
        /* {
          $lookup: {
            from: WithdrawManagement.collection.collectionName,
            localField: "date",
            foreignField: "date",
            as: "dateGrouped"
          }
        }, */
        {
          $addFields: {
            pendingRequests: {
              $filter: {
                input: "$dateGrouped",
                as: "item",
                cond: { $eq: ["$$item.status", 'pending'] }
              }
            }
          }
        },
        {
          $addFields: {
            successRequests: {
              $filter: {
                input: "$dateGrouped",
                as: "item",
                cond: { $eq: ["$$item.status", 'successful'] }
              }
            }
          }
        },
        {
          $addFields: {
            rejectRequests: {
              $filter: {
                input: "$dateGrouped",
                as: "item",
                cond: { $eq: ["$$item.status", 'rejected'] }
              }
            }
          }
        },

        {
          '$addFields': {
            'pendingRequestsCount': {
              '$size': '$pendingRequests'
            }
          }
        },
        {
          '$addFields': {
            'successRequestsCount': {
              '$size': '$successRequests'
            }
          }
        },
        {
          '$addFields': {
            'rejectRequestsCount': {
              '$size': '$rejectRequests'
            }
          }
        },

        {
          "$group": {
            "_id": "$_id",
            "tdsTotal": {
              $first: "$tdsTotal"
            },
            "adminTotal": {
              $first: "$adminTotal"
            },
            "pendingRequestsCount": {
              $first: "$pendingRequestsCount"
            },
            "successRequestsCount": {
              $first: "$successRequestsCount"
            },
            "rejectRequestsCount": {
              $first: "$rejectRequestsCount"
            },
            // "pendingRequests": {
            //   $count: "$pendingRequests"
            // },
            "pendingRequestsAmount": {
              "$sum": { "$sum": "$pendingRequests.netpayable_amount" }
            },
            "rejectRequestsAmount": {
              "$sum": { "$sum": "$rejectRequests.netpayable_amount" }
            },
            "successRequestsAmount": {
              "$sum": { "$sum": "$successRequests.netpayable_amount" }
            }
          }
        }
      ])

      this.res.json({
        status: 1,
        data: total
      })

    } catch (err) {
      console.log(err);
      return this.res.send({ status: 0, message: "Internal server error" });
    }

  }

  payoutStatisticsTotal = async () => {

    try {

      const total = await WithdrawManagement.aggregate([
        {
          $group: {
            _id: null, // Group all documents into a single group
            totalQuantity: {
              $sum: '$quantity' // Calculate the sum of the "quantity" field
            }
          }
        }
      ])

    } catch (err) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }

  }



}
module.exports = AdminRazorpayController;