const _ = require("lodash");

const Controller = require("../base");
const { Sellers } = require("../../models/s_sellers");
const { BusinessSegments } = require("../../models/s_business_segments");
const { BusinessSubSegments } = require("../../models/s_business_sub_segments");
const { SellerNetworkSettings } = require("../../models/s_seller_network_settings");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const { Country } = require("../../models/s_country");
const { AccessTokens } = require("../../models/s_auth");
const RazorpayController = require("../common/razorpay");

class SellersController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
        this.authentication = new Authentication();
    }

    /********************************************************
   Purpose: seller signUp
   Parameter:
    {
        "segmentId":"640c67c21fec4c7a6785b359",
        "subSegmentId": "6438feebca68a8b82a996a5d",
        "ownershipType":"Private Limited",
        "sponserId": "SL42L8909",
        "fullName":"salarseller",
        "mailingAddress":{
            "addressLine1":"addressLine1",
            "addressLine2":"addressLine2",
            "countryId":"630f516684310d4d2a98baf2",
            "city":"Rajahmundry",
            "cityId":"215",
            "state":"Andhra Pradesh",
            "stateId":"2",
            "pincode":533287
        },
        "emailId":"lakshmimattafreelancer+1@gmail.com",
        "mobileNo":"9999999999",
        "password":"Test@123",
        "termsAndConditions": true
    }
   Return: JSON String
   ********************************************************/
    async signUp() {
        try {
            const fieldsArray = [
                "segmentId",
                "subSegmentId",
                "ownershipType",
                "sponserId",
                "fullName",
                "mailingAddress",
                "emailId",
                "mobileNo",
                "password",
                "termsAndConditions",
            ];
            const emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({
                    status: 0,
                    message: "Please send" + " " + emptyFields.toString() + " fields required."
                });
            }

            const subFieldsArray = [
                "addressLine1",
                "addressLine2",
                "countryId",
                "city",
                "cityId",
                "state",
                "stateId",
                "pincode",
            ];
            const subEmptyFields = await this.requestBody.checkEmptyWithFields(this.req.body.mailingAddress, subFieldsArray);
            if (subEmptyFields && Array.isArray(subEmptyFields) && subEmptyFields.length) {
                return this.res.send({
                    status: 0,
                    message: "Please send" + " " + subEmptyFields.toString() + " fields inside mailingAddress required."
                });
            }
            if (this.req.body.fullName) {
                const validateName = await this.commonService.nameValidation(this.req.body.fullName);
                if (!validateName) {
                    return this.res.send({ status: 0, message: "Please send proper fullName" });
                }
            }
            const validateCountry = await Country.findOne({ _id: this.req.body.mailingAddress.countryId });
            if (_.isEmpty(validateCountry)) {
                return this.res.send({ status: 0, message: "Country details not found" });
            }
            const validateSegment = await BusinessSegments.findOne({ _id: this.req.body.segmentId });
            if (_.isEmpty(validateSegment)) {
                return this.res.send({ status: 0, message: "Business segment details not found" });
            }
            const validateSubSegment = await BusinessSubSegments.findOne({ _id: this.req.body.subSegmentId });
            if (_.isEmpty(validateSubSegment)) {
                return this.res.send({ status: 0, message: "Business sub segment details not found" });
            }
            const validateEmail = await this.commonService.emailIdValidation(this.req.body.emailId);
            if (!validateEmail) {
                return this.res.send({ status: 0, message: "Please send proper emailId" });
            }
            const validateMobileNo = await this.commonService.mobileNoValidation(this.req.body.mobileNo);
            if (!validateMobileNo) {
                return this.res.send({ status: 0, message: "Mobile number should have 10 digits" });
            }
            const validatePassword = await this.commonService.passwordValidation(this.req.body.password);
            if (!validatePassword) {
                return this.res.send({ status: 0, message: "Max word limit - 15 (with Mix of Capital,Small Letters , One Numerical and One Special Character" });
            }
            // check if Seller exists with mobile no and emailId
            const validateSeller = await Sellers.findOne({
                $or: [
                    {
                        mobileNo: this.req.body.mobileNo
                    }, {
                        emailId: this.req.body.emailId
                    },
                ]
            });
            if (!_.isEmpty(validateSeller)) {
                return this.res.send({ status: 0, message: "EmailId/Mobile already exists" });
            } else {
                let data = this.req.body;
                data.ulDownlineId = this.req.body.sponserId;
                const transactionPassword = data.password;
                const encryptedPassword = await this.commonService.ecryptPassword({ password: data["password"] });
                data = {
                    ...data,
                    password: encryptedPassword,
                    transactionPassword
                };
                data["emailId"] = data["emailId"].toLowerCase();
                let sellersCount = await Sellers.count();
                if (sellersCount <= 8) {
                    sellersCount = "0" + (
                        sellersCount + 1
                    );
                }
                // seller network settings logic begins here
                if (sellersCount == 0) {
                    data.level = 0;
                }
                let sellerNetworkSettings = await SellerNetworkSettings.findOne({
                    isDeleted: false,
                    status: true
                }, { width: 1 });
                console.log(`sellerNetworkSettings.width: ${sellerNetworkSettings.width
                    }`);
                if (_.isEmpty(sellerNetworkSettings)) {
                    sellerNetworkSettings.width = 1;
                }
                if (data.sponserId) {
                    sellersCount = await Sellers.count({ sponserId: data.sponserId, isDeleted: false });
                    data.level = sellersCount < sellerNetworkSettings.width ? 1 : -1;
                }
                console.log(`data.level: ${data.level
                    }`);
                // seller network settings logic ends here
                const randomText = (await this.commonService.randomGenerator(2, "number")) + (await this.commonService.randomGenerator(1, "capital")) + (await this.commonService.randomGenerator(2, "number"));
                data["registerId"] = "SL" + randomText + sellersCount;
                // save new seller
                let cust = await new RazorpayController().createContact({
                    name: this.req.body.fullName,
                    email: this.req.body.emailId,
                    contact: this.req.body.mobileNo,
                    type: "employee",
                    reference_id: data["registerId"]
                })
                if (cust.error) {
                    return this.res.status(400).send({ status: 0, message: cust.error });
                }
                data["customerId"] = cust.id;
                const newSeller = await new Model(Sellers).store(data);
                // if empty not save seller details and give error message.
                if (_.isEmpty(newSeller)) {
                    return this.res.send({ status: 0, message: "Seller not saved" });
                } else {
                    const message = `<html><body>
                    <p> Dear Seller,</p> 
                    <p>Welcome to www.salar.in,</p>
                    <p>Your registered Seller ID is <strong>${newSeller.registerId}</strong></p>
                    <p>Your Password  & Transaction password is<strong> ${transactionPassword}</strong></p>
                    <p>Regards Sworld solutions pvt ltd</p>`
                    // Sending email
                    const emailsendResponse = await this.services.sendEmail(newSeller.emailId, "Salar", newSeller.fullName, message);

                    // Sending message
                    if (validateCountry.name == "India" && newSeller.mobileNo) {
                        let messageResponse = await this.services.sendSignupConfirmation(newSeller.mobileNo, message);
                        let msg = "";
                        if (messageResponse.result.data) {
                            msg = messageResponse.result.data;
                        }
                    }
                    return this.res.send({
                        status: 1,
                        message: {
                            email: emailsendResponse.message,
                            notes: "Seller registered Successfully"
                        }
                    });
                }
            }
        } catch (error) {
            console.log("error = ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: SignIn
    Parameter:
        {
            "sellerId":"emailId" or registerId
            "password":"123456",
            "grantType": "password"
        }
        or 
        {
            "refreshToken":"801ae64b127fa1e5152a2f780a11470f170f4b670b2415759a072de605b6f858389e7cc4a1222b724b5c68482edd61953e7e7e5ade66d3cd03ec762f21f44ebc",
            "grantType": "refreshToken"
        }
    Return: JSON String
   ********************************************************/
    async signIn() {
        try {
            const data = this.req.body;
            if (data.grantType == "password") {
                const fieldsArray = ["sellerId", "password"];
                const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
                if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                    return this.res.send({
                        status: 0,
                        message: "Please send" + " " + emptyFields.toString() + " fields required."
                    });
                }
                const seller = await Sellers.findOne({
                    $or: [
                        {
                            emailId: data.sellerId.toString().toLowerCase()
                        }, {
                            registerId: data.sellerId
                        },
                    ],
                    isDeleted: false,
                    status: true
                });
                if (_.isEmpty(seller)) {
                    return this.res.send({ status: 0, message: "Seller not exists or deleted" });
                }

                const status = await this.commonService.verifyPassword({ password: data.password, savedPassword: seller.password });
                if (!status) {
                    return this.res.send({ status: 0, message: "Invalid password" });
                }
                const sellerDetails = await Sellers.findById(seller._id).select({ password: 0, __v: 0, transactionPassword: 0 });
                const { token, refreshToken } = await this.authentication.createSellerToken({
                    id: seller._id,
                    role: sellerDetails.role,
                    ipAddress: this.req.ip,
                    device: this.req.device.type,
                    action: "Login"
                });
                return this.res.send({
                    status: 1,
                    message: "Login Successful",
                    access_token: token,
                    refresh_token: refreshToken,
                    data: sellerDetails
                });
            } else if (data.grantType == "refreshToken") {
                const fieldsArray = ["refreshToken", "grantType"];
                const emptyFieldsRefresh = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
                if (emptyFieldsRefresh && Array.isArray(emptyFieldsRefresh) && emptyFieldsRefresh.length) {
                    return this.res.send({
                        status: 0,
                        message: "Please send" + " " + emptyFieldsRefresh.toString() + " fields required."
                    });
                }
                const tokenStatus = await this.authentication.verifySellerRefreshToken(data);
                const sellerDetails = await Sellers.findById({ _id: tokenStatus.id }).select({ password: 0, __v: 0 });
                const { token, refreshToken } = await this.authentication.createToken({ id: sellerDetails._id, role: sellerDetails.role });
                return this.res.send({
                    status: 1,
                    message: "Login Successful",
                    access_token: token,
                    refresh_token: refreshToken,
                    data: sellerDetails
                });
            } else {
                return this.res.send({ status: 0, message: "Please send grant type fields required." });
            }
        } catch (error) {
            console.log(error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Forgot password mail
   Parameter:
       {
           "sellerId":"emailId" or registerId
       }
   Return: JSON String
  ********************************************************/
    async forgotPassword() {
        try {
            const data = this.req.body;
            if (!data.sellerId) {
                return this.res.send({ status: 0, message: "Please send sellerId" });
            }
            const seller = await Sellers.findOne({
                $or: [
                    {
                        emailId: data.sellerId.toString().toLowerCase()
                    }, {
                        registerId: data.sellerId
                    },
                ],
                isDeleted: false,
                status: true
            }, {
                fullName: 1,
                countryId: 1,
                role: 1,
                mobileNo: 1,
                emailId: 1,
                registerId: 1
            }).populate("countryId", { name: 1 });
            if (_.isEmpty(seller)) {
                return this.res.send({ status: 0, message: "Seller not exists or deleted" });
            }
            const newPassword = await this.commonService.randomGenerator(6);
            const encryptedPassword = await this.commonService.ecryptPassword({ password: newPassword });
            await Sellers.findByIdAndUpdate(seller._id, {
                password: encryptedPassword
            }, { upsert: true });
            // Sending email
            var emailsendResponse = await this.services.sendEmail(seller.emailId, "Salar", seller.fullName, `<html><body><h2>HI! ${seller.fullName
                } you have requested for a password change</h2><h3><strong>New password: </strong>${newPassword}</h3></body></html>`);
            console.log(emailsendResponse);
            const message = `Dear ${seller.fullName
                }, Welcome to www.salar.in Your Seller ID is ${seller.registerId
                }, Your Password is ${newPassword}, Regards Strawberri World Solutions Private Limited.";`;
            // Sending message
            // if (seller.countryId.name == "India" && seller.mobileNo) {
            const messageResponse = await this.services.sendSignupConfirmation(seller.mobileNo, message);
            let msg = "";
            if (messageResponse.result.data) {
                msg = messageResponse.result.data;
            }
            // }
            return this.res.send({
                status: 1,
                message: {
                    email: emailsendResponse.message,
                    msg: msg
                }
            });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    //     /********************************************************
    // Purpose: Reset password
    // Parameter:
    //       {
    //           "password":"123456",
    //           "token": "errrrwqqqsssfdfvfgfdewwwww"
    //       }
    // Return: JSON String
    // ********************************************************/
    //     async resetPassword() {
    //         try {
    //             const seller = await Sellers.findOne({ forgotToken: this.req.body.token });
    //             if (_.isEmpty(seller)) {
    //                 return this.res.send({ status: 0, message: "Invalid token" });
    //             }
    //             const validatePassword = await this.commonService.passwordValidation(this.req.body.password);
    //             if (!validatePassword) {
    //                 return this.res.send({ status: 0, message: "Max word limit - 15 (with Mix of Capital,Small Letters , One Numerical and One Special Character" });
    //             }
    //             let password = await this.commonService.ecryptPassword({ password: this.req.body.password });

    //             const updateSeller = await Sellers.findByIdAndUpdate(seller._id, { password: password }, { new: true });
    //             if (_.isEmpty(updateSeller)) {
    //                 return this.res.send({ status: 0, message: "Password not updated" });
    //             }
    //             return this.res.send({ status: 1, message: "Password updated successfully" });
    //         } catch (error) {
    //             console.log("error- ", error);
    //             return this.res.send({ status: 0, message: "Internal server error" });
    //         }
    //     }

    /********************************************************
    Purpose: sellerLogOut
    Method: GET
    Return: JSON String
   ********************************************************/
    async logOut() {
        try {
            const token = this.req.token;
            console.log("token", token);
            if (!token) {
                return this.res.send({ status: 0, message: "Please send the token" });
            }
            const auth = await AccessTokens.findOne({ token: token, sellerId: this.req.user });
            if (_.isEmpty(auth)) {
                return this.res.send({ status: 0, message: "Invalid token" });
            }

            const updateAuth = await AccessTokens.findByIdAndUpdate(auth._id, {
                token: "",
                refreshToken: "",
                action: "Logout"
            }, { new: true });
            if (_.isEmpty(updateAuth)) {
                return this.res.send({ status: 0, message: "Failed to logout" });
            }
            return this.res.send({ status: 1, message: "Successfully logged out" });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = SellersController;
