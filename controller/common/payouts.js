/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const RazorpayController = require("../common/razorpay");
const { WithdrawManagement } = require("../../models/s_withdraw")

class PayoutsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
        this.authentication = new Authentication();
    }

    /********************************************************
      Purpose: create payout using fund account id by userId & sellerId
      Method: Post
      Authorisation: true
      Parameter:
      {
        "FundAccountId": "fa_0000000001",
        "amount": 100,
        "mode": "IMPS"
        "purpose":"payout",
        "userId":"64da5bc703fee554f62f0b27"
        "sellerId":"64da5bc703fee554f62f0b27"
        "queueIfLowBalance":true
      }          
      Return: JSON String
  ********************************************************/
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
            let payload = {};
            if (this.req.body.userId) {
                payload = {
                    userId: this.req.body.userId,
                    transactionId: payout.id,
                    amount: this.req.body.amount,
                    commissionType: this.req.body.commissionType,
                    commissionName: this.req.body.commissionName,
                    status: payout.status
                }
            } else {
                payload = {
                    sellerId: this.req.body.sellerId,
                    transactionId: payout.id,
                    amount: this.req.body.amount,
                    status: payout.status
                }
            }

            const withdraw = await new Model(WithdrawManagement).store(payload);
            if (_.isEmpty(withdraw)) {
                return this.res.send({ status: 0, message: "Payout details not saved" })
            }
            return this.res.status(200).send({ status: 1, message: "Payout Created successfully" });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error", error: error });
        }
    }

    /********************************************************
      Purpose: get withdraw request data by using userId & sellerId
      Method: Post
      Authorisation: true
      Parameter:
      {
        "userId":"64da5bc703fee554f62f0b27",
        "sellerId":"64da5bc703fee554f62f0b27"
      }          
      Return: JSON String
  ********************************************************/
    getWithdrawHistory = async () => {
        try {
            let currentUserId = ""
            if (this.req.body.userId) {
                currentUserId = this.req.body.userId
            } else {
                currentUserId = this.req.body.sellerId
            }
            const fieldsArray = this.req.body.userId ? ["userId"] : ["sellerId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray,);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({
                    status: 0,
                    message: "Please send" + " " + emptyFields.toString() + " fields required."
                });
            }
            const withdraw = this.req.body.userId ? await WithdrawManagement.find({ userId: currentUserId }) : await WithdrawManagement.find({ sellerId: currentUserId });
            if (_.isEmpty(withdraw)) {
                return this.res.status(400).send({ status: 0, message: "Withdraw Request Error" })
            }
            return this.res.status(200).send({ status: 1, data: withdraw });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}

module.exports = PayoutsController;
