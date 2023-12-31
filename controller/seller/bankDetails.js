const _ = require("lodash");
const {ObjectID, ObjectId} = require('mongodb');

const Controller = require("../base");
const {BankDetails} = require('../../models/s_bank_details');
const {Country} = require('../../models/s_country');
const {Sellers} = require('../../models/s_sellers');
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const RazorpayController = require("../../controller/common/razorpay");

class BankDetailsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }


    /********************************************************
      Purpose: Add and update bank details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "fullName": "salarUser",
        "bankName": "ICICI",
        "accountNumber": "95867948594938",
        "IFSCCode": "ICIC0005943",
        "accountType":"current",
        "branchName":"Delhi",
        "bankStatement":"bankStatement.jpg",
        "IBANNumber": "AL902081100800000010395318016475839485",
        "swiftCode": "BKDNINBBDDR",
        "panCard": "UDHRO5761H",
        "transactionPassword":"Test@1234",
        "bankId":"63332abb8ac4ec74bf3cb876"
      }          
      Return: JSON String
  ********************************************************/
    async addUpdateBankDetails() {
        try {
            const currentSellerId = this.req.user;
            let data = this.req.body;
            data.sellerId = currentSellerId;
            if (! data.transactionPassword) {
                return this.res.send({status: 0, message: "Please send transactionPassword"});
            }
            const seller = await Sellers.findOne({
                _id: currentSellerId,
                transactionPassword: data.transactionPassword
            }, {mailingAddress: 1}).populate('mailingAddress', {countryId: 1}).populate("customerId", {customerId: 1});
            if (_.isEmpty(seller)) {
                return this.res.send({status: 0, message: "Seller not found"});
            }
            const getCountry = await Country.findOne({_id: seller.mailingAddress.countryId})
            const fields = getCountry.name == 'India' ? ["IFSCCode", "panCard"] : ["IBANNumber", "swiftCode",]
            const fieldsArray = [
                "fullName",
                "bankName",
                "branchName",
                "accountNumber",
                "accountType",
                ... fields
            ];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({
                    status: 0,
                    message: "Please send" + " " + emptyFields.toString() + " fields required."
                });
            }
            if (!['savings', 'current'].includes(data.accountType)) {
                return this.res.send({status: 0, message: "Account Type should be either savings or current"});
            }
            if (data.IBANNumber) {
                const validateIBAN = await this.commonService.IBANNumberValidation(data.IBANNumber);
                if (! validateIBAN) {
                    return this.res.send({status: 0, message: "Please send proper IBAN number"});
                }
            }
            if (data.swiftCode) {
                const validateSwiftCode = await this.commonService.swiftCodeValidation(data.swiftCode);
                if (! validateSwiftCode) {
                    return this.res.send({status: 0, message: "Please send proper swift code"});
                }
            }
            if (data.IFSCCode) {
                const validateIFSCCode = await this.commonService.IFSCCodeValidation(data.IFSCCode);
                if (! validateIFSCCode) {
                    return this.res.send({status: 0, message: "Please send proper IFSC Code"});
                }
            }
            if (data.pancard) {
                const validatePanCard = await this.commonService.panCardValidation(data.pancard);
                if (! validatePanCard) {
                    return this.res.send({status: 0, message: "Please send proper pan card number"});
                }
            }
            if (data.bankId) {
                await BankDetails.findByIdAndUpdate(data.bankId, data, {
                    new: true,
                    upsert: true
                });
                return this.res.send({status: 1, message: "Bank details updated successfully"});

            } else {
                let getFundAccount = await new RazorpayController().createFundAccount({
                    contact_id: seller.customerId,
                    account_type: "bank_account",
                    bank_account: {
                        name: data.fullName,
                        ifsc: data.IFSCCode,
                        account_number: data.accountNumber
                    }
                })
                if (getFundAccount.error) {
                    return this.res.status(400).send({status: 0, message: getFundAccount.error});
                }
                data["fundAccountId"] = getFundAccount.id;
                const newBank = await new Model(BankDetails).store(data);
                if (_.isEmpty(newBank)) {
                    return this.res.send({status: 0, message: "Bank details not saved"})
                }
                return this.res.send({status: 1, message: "Bank details added successfully"});
            }
        } catch (error) {
            console.log("error- ", error);
            this.res.send({status: 0, message: error});
        }
    }

    /********************************************************
   Purpose: Get Bank Details
   Method: Post
   {
       "bankId":""
   }
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getBankDetails() {
        try {
            const data = this.req.params;
            if (! data.id) {
                return this.res.send({status: 0, message: "Please send bankId"});
            }
            const bank = await BankDetails.findOne({
                _id: data.id,
                isDeleted: false
            }, {_v: 0}).populate('sellerId', {fullName: 1});
            if (_.isEmpty(bank)) {
                return this.res.send({status: 0, message: "Bank details not found"});
            }
            return this.res.send({status: 1, data: bank});
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({status: 0, message: "Internal server error"});
        }
    }

    /********************************************************
 Purpose: Delete Bank details
 Method: Post
 Authorisation: true
 Parameter:
 {
        "bankId":"5c9df24382ddca1298d855bb",
        "transactionPassword": ""
    } 
 Return: JSON String
 ********************************************************/
    async deleteBankDetails() {
        try {
            const data = this.req.body;
            if (! data.bankId || ! data.transactionPassword) {
                return this.res.send({status: 0, message: "Please send bankId and transactionPassword"});
            }
            const seller = await Sellers.findOne({
                _id: this.req.user,
                transactionPassword: data.transactionPassword
            }, {_id: 1})
            if (_.isEmpty(seller)) {
                return this.res.send({status: 0, message: "Seller not found"});
            }
            await BankDetails.findByIdAndUpdate({
                _id: ObjectId(data.bankId)
            }, {
                isDeleted: true
            }, {
                new: true,
                upsert: true
            })
            return this.res.send({status: 1, message: "Bank details deleted successfully"});
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({status: 0, message: "Internal server error"});
        }
    }


    /********************************************************
    Purpose: Get Bank Details Of User
    Method: Get
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getBankDetailsOfUser() {
        try {
            const currentSellerId = this.req.user;
            if (currentSellerId) {
                let bankDetails = await BankDetails.find({
                    sellerId: currentSellerId,
                    isDeleted: false
                }, {__v: 0});
                if (bankDetails.length == 0) {
                    return this.res.send({status: 0, message: "No bank details available"});
                }
                return this.res.send({status: 1, message: "Details are: ", data: bankDetails});
            }
            return this.res.send({status: 0, message: "Seller not found"});

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({status: 0, message: "Internal server error"});
        }
    }

}
module.exports = BankDetailsController;
