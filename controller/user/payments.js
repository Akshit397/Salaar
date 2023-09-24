/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const { Order } = require("../../models/s_orders");
const { Payments } = require("../../models/s_payments");
const { AdminSettings } = require('../../models/s_admin_settings');
const { WithdrawManagement } = require("../../models/s_withdraw")
const { Users } = require("../../models/s_users")
const { AurCommission, SponsorCommission, MemberShipCommission } = require("../../models/s_myearnings");
const { default: mongoose } = require("mongoose");
const { KycDetails } = require("../../models/s_kyc");
const { BankDetails } = require("../../models/s_bank_details")

class PaymentsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  async PaymentSuccess() {
    let payData = this.req.body;
    let razorpay_payment_id = payData.razorpay_payment_id;
    let razorpay_order_id = payData.razorpay_order_id;
    let order_id = payData.order_id;

    const fieldsArray = [
      "razorpay_order_id",
      "razorpay_payment_id",
      "order_id",
    ];
    const emptyFields = await this.requestBody.checkEmptyWithFields(
      this.req.body,
      fieldsArray,
    );
    if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
      return this.res.send({
        status: 0,
        message:
          "Please send" + " " + emptyFields.toString() + " fields required.",
      });
    }
    let orderDetails = await Order.find({ _id: order_id });
    if (_.isEmpty(orderDetails)) {
      return this.res.send({ status: 0, message: "order not found" });
    }

    let data = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      order_id: order_id,
      payment_status: "Success",
      refund_status: "Null",
      user_id: orderDetails[0].user_id,
      final_price: orderDetails[0].final_price,
    };

    const newPaymentData = await new Model(Payments).store(data);
    return this.res.send({ status: 1, data: newPaymentData });
  }

  async getAllPayments() {
    try {
      const payment = await Payments.find({ user_id: this.req.user }).populate({
        path: "rzp_payment_id",
      });
      return this.res.send({ status: 1, data: payment, message: "Payments" });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getPaymentsById() {
    try {
      const payment = await Payments.find({ user_id: this.req.user }).populate({
        path: "rzp_payment_id",
      });
      return this.res.send({ status: 1, data: payment, message: "Payments" });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  getAvailableAurBalance = async (userId, commissionName) => {
    try {
      var aurSum = await AurCommission.aggregate([
        {
          $match: {
            user_id: mongoose.Types.ObjectId(userId)
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalBalance: {
              $sum: "$aurCommission"
            }
          }
        },
        {
          $lookup: {
            from: WithdrawManagement.collection.collectionName,
            localField: "_id",
            foreignField: "userId",
            as: "withdrawalList"
          }
        }

      ])

      if (aurSum.length) {
        const wList = aurSum.length ? aurSum[0] : null;
        const balanceAll = aurSum.length ? aurSum[0].totalBalance : 0
        // console.log(wAm);
        const successfulWithdrawalList = wList.withdrawalList.filter(item => item.status == "successful" && item.commissionName == commissionName)
        const successfulWithdrawalAmount = successfulWithdrawalList.reduce((accumulator, object) => {
          return accumulator + object.requested_amount;
        }, 0);
        return balanceAll - successfulWithdrawalAmount
      } else {
        return 0
      }


    } catch (err) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  getAvailableSponsarBalance = async (userId, commissionName) => {
    try {
      var aurSum = await SponsorCommission.aggregate([
        {
          $match: {
            user_id: mongoose.Types.ObjectId(userId)
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalBalance: {
              $sum: "$sponsorCommission"
            }
          }
        },
        {
          $lookup: {
            from: WithdrawManagement.collection.collectionName,
            localField: "_id",
            foreignField: "userId",
            as: "withdrawalList"
          }
        }

      ])

      if (aurSum.length) {
        const wList = aurSum.length ? aurSum[0] : null;
        const balanceAll = aurSum.length ? aurSum[0].totalBalance : 0
        // console.log(wAm);
        const successfulWithdrawalList = wList.withdrawalList.filter(item => item.status == "successful" && item.commissionName == commissionName)
        const successfulWithdrawalAmount = successfulWithdrawalList.reduce((accumulator, object) => {
          return accumulator + object.requested_amount;
        }, 0);
        return balanceAll - successfulWithdrawalAmount
      } else {
        return 0
      }


    } catch (err) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  getAvailableGameBalance = async (userId, commissionName) => {
    try {
      var aurSum = await MemberShipCommission.aggregate([
        {
          $match: {
            user_id: mongoose.Types.ObjectId(userId)
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalBalance: {
              $sum: "$commissionEarned"
            }
          }
        },
        {
          $lookup: {
            from: WithdrawManagement.collection.collectionName,
            localField: "_id",
            foreignField: "userId",
            as: "withdrawalList"
          }
        },
        {
          $lookup: {
            from: Users.collection.collectionName,
            localField: "_id",
            foreignField: "_id",
            as: "user_details"
          }
        }, {
          $unwind: "$user_details"
        }

      ])
      console.log(aurSum);
      if (aurSum.length) {
        const wList = aurSum.length ? aurSum[0] : null;
        const balanceAll = aurSum.length ? aurSum[0].totalBalance : 0
        const user = wList.user_details
        console.log(wList.user_details);
        const successfulWithdrawalList = wList.withdrawalList.filter(item => item.status == "successful" && item.commissionName == commissionName)
        const successfulWithdrawalAmount = successfulWithdrawalList.reduce((accumulator, object) => {
          return accumulator + object.requested_amount;
        }, 0);
        return balanceAll - (successfulWithdrawalAmount + user.freezingAmount + user.shoppingAmount)
      } else {
        return 0
      }


    } catch (err) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  checkBalance = async (data) => {

    // Check the commission name if user have sufficent balance
    if (data.commissionName == "Game Commission") {
      return this.getAvailableGameBalance(data.userId, data.commissionName)
    } else if (data.commissionName == "Sponsor Commission") {
      return this.getAvailableSponsarBalance(data.userId, data.commissionName)
    } else if (data.commissionName == "AuR Commission") {
      return this.getAvailableAurBalance(data.userId, data.commissionName)
    } else {
      return this.res.status(400).send({ status: 0, message: "Commision name is not valid" });
    }

  }

  createWithdrawRequest = async () => {

    try {

      const data = this.req.body;

      data.userId = this.req.user._id
      console.log(data);

      // Check if KYC is completed
      const kycDetails = await KycDetails.findOne({
        userId: data.userId
      });

      if (!kycDetails) {
        return this.res.status(404).send({ status: 0, message: "KYC not found" });
      }

      if (kycDetails.status != "Approved") {
        return this.res.status(422).send({ status: 0, message: "Wait for KYC approval" });
      }

      const adminSettings = await AdminSettings.findOne();

      if (_.isEmpty(adminSettings)) {
        return this.res.status(404).send({ status: 0, message: "Admin settings not found" });
      }

      const availabeBalance = await this.checkBalance(data);

      if (availabeBalance < Number(data.amount)) {
        return this.res.status(422).send({ status: 0, message: "Insufficient Balance" });
      }

      const bankDetails = await BankDetails.findOne({
        userId: data.userId,
        isDeleted: false,
        /* accountNumber: withdrawalDetail.bank_details.account_no,
        fundAccountId: { $exists: true } */
      })

      if (!bankDetails) {
        return this.res.status(404).send({ status: 0, message: "Bank Details not found" });
      }

      const available_commission = data.available_commission;
      const admin_fee_percent = adminSettings.withdrawal;

      var tds_applied_percent;

      if (bankDetails.panCard) {
        tds_applied_percent = adminSettings.tds.withPanCard
      } else {
        tds_applied_percent = adminSettings.tds.withoutPanCard
      }

      const ip_address = this.req.socket.remoteAddress;

      // admin Fee Calculation
      const afterAdminFee = Number(data.amount) - (Number(data.amount) * admin_fee_percent / 100);
      const admin_amount = (Number(data.amount) * admin_fee_percent / 100);

      // TDS Calculation
      const afterTDS = afterAdminFee - (afterAdminFee * tds_applied_percent / 100)
      const tds_amount = (afterAdminFee * tds_applied_percent / 100);

      const netpayable_amount = afterTDS;

      const payload = {
        userId: data.userId,
        country: data.country,
        bank_details: data.bank_details,
        commissionType: data.commissionType,
        commissionName: data.commissionName,
        netpayable_amount: netpayable_amount,
        requested_amount: data.amount,
        available_commission: available_commission,
        admin_fee_percent: admin_fee_percent,
        admin_amount: admin_amount,
        tds_applied_percent: tds_applied_percent,
        tds_amount: tds_amount,
        ip_address: ip_address,
      }
      const wObj = await WithdrawManagement.create(payload)

      return this.res.status(200).send({ status: 1, wObj: wObj });

    } catch (error) {
      console.log(error)
      return this.res.send({ status: 0, message: "Internal server error" });
    }

  }
}

module.exports = PaymentsController;
