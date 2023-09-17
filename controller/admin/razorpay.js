const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const RazorpayController = require("../common/razorpay");
const { WithdrawManagement } = require("../../models/s_withdraw")

class AdminRazorpayController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    createPayout = async () => {
      try {
          const fieldsArray = ["FundAccountId", "amount", "mode", "purpose",];
          const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray,);
          if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
              return this.res.send({
                  status: 0,
                  message: "Please send" + " " + emptyFields.toString() + " fields required."
              });
          }

          let Payload = {
              account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
              fund_account_id: this.req.body.FundAccountId,
              amount: this.req.body.amount,
              currency: "INR",
              mode: this.req.body.mode,
              purpose: this.req.body.purpose,
              reference_id: String(Math.floor(new Date().getTime() / 1000))
          }

          if (this.req.body.queueIfLowBalance) {
              Payload["queue_if_low_balance"] = true;
          }

          let payout = await new RazorpayController().createPayout(Payload)
          if (payout.error) {
              return this.res.status(400).send({ status: 0, message: payout.error });
          }
          // let payload = {};
          // if (this.req.body.userId) {
          //     payload = {
          //         userId: this.req.body.userId,
          //         transactionId: payout.id,
          //         amount: this.req.body.amount,
          //         commissionType: this.req.body.commissionType,
          //         commissionName: this.req.body.commissionName,
          //         status: payout.status
          //     }
          // } else {
          //     payload = {
          //         sellerId: this.req.body.sellerId,
          //         transactionId: payout.id,
          //         amount: this.req.body.amount,
          //         status: payout.status
          //     }
          // }

          // const withdraw = await new Model(WithdrawManagement).store(payload);
          // if (_.isEmpty(withdraw)) {
          //     return this.res.send({ status: 0, message: "Payout details not saved" })
          // }
          return this.res.status(200).send({ status: 1, message: "Payout Created successfully" });
      } catch (error) {
          console.log("error- ", error);
          return this.res.send({ status: 0, message: "Internal server error", error: error });
      }
    }

    getPayouts = async () => {
      try {
        const fieldsArray = ["accountNumber"];
          const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.params, fieldsArray,);
          if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
              return this.res.send({
                  status: 0,
                  message: "Please send" + " " + emptyFields.toString() + " fields required."
              });
          }
        const payouts = await new RazorpayController().getPayouts(this.req.params.accountNumber)
      } catch (error) {
          console.log("error- ", error);
          return this.res.send({ status: 0, message: "Internal server error" });
      }
    }
    
    /********************************************************
      Purpose: get withdraw request data by type(user or seller) or for both
      Method: Post
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