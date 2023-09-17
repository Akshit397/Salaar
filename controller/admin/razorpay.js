const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const RazorpayController = require("../common/razorpay");
const { WithdrawManagement } = require("../../models/s_withdraw")
const { BankDetails } = require("../../models/s_bank_details")

class AdminRazorpayController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    payToBankAccount = async (fund_account_id, mode, purpose) => {
      let Payload = {
        account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
        fund_account_id,
        amount: 1000,
        currency: "INR",
        mode,
        purpose,
        reference_id: String(Math.floor(new Date().getTime() / 1000))
      }

      if (this.req.body.queueIfLowBalance) Payload["queue_if_low_balance"] = true
      let { error, status } = await new RazorpayController().createPayout(Payload)
      return { error, status }
    }

    /********************************************************
      Purpose: Make Payout to specific account or bulk accounts
      Method: Post
      Authorisation: true
      Parameter:
      {
        "sellerId": ObjectId (Optional)
        "queueIfLowBalance": boolean (Optional)
        "mode": 'NEFT' | 'RTGS' | 'IMPS' | 'card'
        "purpose": 'refund' | 'cashback' | 'payout' | 'salary'
      }     
      Return: JSON String
    ********************************************************/
    createPayout = async () => {
      try {

        // specific
        if(this.req.body.sellerId) {
          const bankDetails = await BankDetails.findOne({
            sellerId: this.req.body.sellerId,
            isDeleted: false,
            fundAccountId: { $exists: true }
          })
          if(bankDetails) {
            const { error, status } = await this.payToBankAccount(bankDetails.fundAccountId, this.req.body.mode, this.req.body.purpose)
            if (error) return this.res.status(400).send({ status: 0, message: error })
            return this.res.status(200).send({ status, message: "Payout Created successfully" })
          } else {
            return this.res.send({ status: 0, message: "No Record found for payout" })
          }
        } else { //bulk
          const bankAccounts = await BankDetails.find({
            sellerId: { $exists: true },
            isDeleted: false,
            fundAccountId: { $exists: true }
          })
          for(const account of bankAccounts) {
            const { error } = await this.payToBankAccount(account.fundAccountId, this.req.body.mode, this.req.body.purpose)
            if (error) return this.res.status(400).send({ status: 0, message: error })
          }
          return this.res.status(200).send({ status: 1, message: "Payout Created successfully" });
        }
      } catch (error) {
          console.log("error- ", error);
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
        let condition = {}
        if(this.req.query.type) condition = { [this.req.query.type == 'user' ? 'userId' : 'sellerId']: { $exists: true } }
        const withdraw = await WithdrawManagement.find(condition)
            if (_.isEmpty(withdraw)) {
                return this.res.status(400).send({ status: 0, message: "Withdraw List Empty" })
            }
            return this.res.status(200).send({ status: 1, data: withdraw });
      } catch (error) {
          console.log("error- ", error);
          return this.res.send({ status: 0, message: "Internal server error" });
      }
    }

}
module.exports = AdminRazorpayController;