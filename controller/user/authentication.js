/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Users } = require("../../models/s_users");
const { SponsorId } = require("../../models/s_sponser_team");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const { AccessTokens } = require("../../models/s_auth");
const { Country } = require("../../models/s_country");
const { TeamLevels } = require("../../models/s_team_levels");
const RazorpayController = require("../common/razorpay");

class UsersController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
        this.authentication = new Authentication();
    }

    /********************************************************
   Purpose: user signUp
   Parameter:
      {
          "fullName":"lakshmi",
          "dob":"29-09-1996",
          "gender":"female",
          "age":"25",
          "emailId":"lakshmimattafreelancer@gmail.com",
          "countryId":"",
          "mobileNo":"7207334583",
          "password":"Text@123",
          "sponserId":"",
          "termsAndConditions": true,
          "role": "regular"
      }
      OR
      {
        "organisationName":"Salar",
        "registeredYear":"2016",
        "emailId":"lakshmimattafreelancer@gmail.com",
        "countryId":"India",
        "mobileNo":"7207334583",
        "password":"Tt@123",
        "sponserId":"",
        "termsAndConditions": true,
        "role": "organisation"
      }
   Return: JSON String
   ********************************************************/
    async signUp() {
        try {
            if (!this.req.body.role) {
                return this.res.send({ status: 0, message: "Please send role of the user" });
            }
            let fieldsArray = this.req.body.role == "regular" ? [
                "fullName",
                "dob",
                "gender",
                "age",
                "emailId",
                "countryId",
                "mobileNo",
                "password",
                "termsAndConditions",
                "sponserId",
            ] : [
                "organisationName",
                "registeredYear",
                "emailId",
                "countryId",
                "mobileNo",
                "password",
                "termsAndConditions",
                "sponserId",
            ];
            let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({
                    status: 0,
                    message: "Please send" + " " + emptyFields.toString() + " fields required."
                });
            }
            if (this.req.body.fullName) {
                const validateName = await this.commonService.nameValidation(this.req.body.fullName);
                if (!validateName) {
                    return this.res.send({ status: 0, message: "Please send proper fullName" });
                }
            }

            const validateCountry = await Country.findOne({ _id: this.req.body.countryId, status: 1 });
            if (_.isEmpty(validateCountry)) {
                return this.res.send({ status: 0, message: "Country details not found" });
            }

            const validateEmail = await this.commonService.emailIdValidation(this.req.body.emailId);
            if (!validateEmail) {
                return this.res.send({ status: 0, message: "Please send proper emailId" });
            }
            const validateMobileNo = await this.commonService.mobileNoValidation(this.req.body.mobileNo);
            if (!validateMobileNo) {
                return this.res.send({ status: 0, message: "Mobile number should have 10 digits" });
            }
            const password = atob(this.req.body.password);
            const validatePassword = await this.commonService.passwordValidation(password);
            if (!validatePassword) {
                return this.res.send({ status: 0, message: "Max word limit - 15 (with Mix of Capital,Small Letters , One Numerical and One Special Character" });
            }

            let userExists;
            if (this.req.body.sponserId) {
                userExists = await Users.findOne({ registerId: this.req.body.sponserId, isDeleted: false });
                if (_.isEmpty(userExists)) {
                    return this.res.send({ status: 0, message: "Invalid sponserId" });
                }
            }

            const user = await Users.findOne({ emailId: this.req.body.emailId.toLowerCase() });

            // if user exist give error
            if (!_.isEmpty(user) && user.emailId) {
                return this.res.send({ status: 0, message: "Email already exists" });
            } else {
                let data = this.req.body;
                data.ulDownlineId = this.req.body.sponserId;
                const transactionPassword = password;
                const encryptedPassword = await this.commonService.ecryptPassword({ password: password });
                data = {
                    ...data,
                    password: encryptedPassword,
                    transactionPassword
                };
                data["emailId"] = data["emailId"].toLowerCase();
                let usersCount = await Users.count();
                if (usersCount <= 8) {
                    usersCount = "0" + (
                        usersCount + 1
                    );
                }
                // team level logic begins here
                if (usersCount == 0) {
                    data.level = 0;
                }
                let teamLevels = await TeamLevels.findOne({
                    isDeleted: false,
                    status: true
                }, { width: 1 });
                console.log(`teamLevels.width: ${teamLevels.width
                    }`);
                if (_.isEmpty(teamLevels)) {
                    teamLevels.width = 1;
                }
                if (data.sponserId) {
                    usersCount = await Users.count({ sponserId: data.sponserId, isDeleted: false });
                    data.level = usersCount < teamLevels.width ? 1 : -1;
                }
                console.log(`data.level: ${data.level
                    }`);
                // team level logic ends here
                const randomText = (await this.commonService.randomGenerator(2, "number")) + (await this.commonService.randomGenerator(1, "capital")) + (await this.commonService.randomGenerator(2, "number"));
                data["registerId"] = "S" + randomText + usersCount;
                // save new user
                data["bankDetails"] = null;
                let cust = await new RazorpayController().createContact({
                    name: this.req.body.fullName ? this.req.body.fullName : this.req.body.organisationName,
                    email: this.req.body.emailId ? this.req.body.emailId : this.req.body.emailId,
                    contact: this.req.body.mobileNo ? this.req.body.mobileNo : this.req.body.mobileNo,
                    type: "employee",
                    reference_id: String(Math.floor(new Date().getTime() / 1000))
                })
                if (cust.error) {
                    return this.res.status(400).send({ status: 0, message: cust.error });
                }
                data["customerId"] = cust.id;
                const newUser = await new Model(Users).store(data);
                // console.log(userExists);
                const sponser = await new Model(SponsorId).store({
                    user_id: newUser._id,
                    sponsor_id: this.req.body.sponserId,
                    registerId: data["registerId"],
                    doj: Date.now(),
                    user_name: this.req.body.fullName,
                    email_id: this.req.body.emailId,
                    sponsor_name: userExists?.fullName
                });

                // if empty not save user details and give error message.
                if (_.isEmpty(newUser && sponser)) {
                    return this.res.send({ status: 0, message: "User not saved" });
                } else {
                    // Sending email
                    const message = `<html><body>
                    <p> Dear Customer,</p> 
                    <p>Welcome to www.salar.in,</p>
                    <p>Your registered Customer ID is <strong>${newUser.registerId}</strong></p>
                    <p>Your Password  & Transaction password is<strong> ${password}</strong></p>
                    <p>Regards Sworld solutions pvt ltd</p>`;
                    await this.services.sendEmail(newUser.emailId, "Salar", "Salar", message);
                    // Sending message
                    let delivery;
                    if (validateCountry.name == "India" && newUser.mobileNo) {
                        delivery = await this.services.sendSignupConfirmation(newUser.mobileNo, message);
                    }
                    return this.res.send({ status: 1, message: "User registered Successfully", userDetails: message });
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
            "userId":"emailId" or registerId
            "password":"123456"
            "grantType":"password"
        }
        or 
        {
            "refreshToken":"e857905a237905b28b014269d0628136eb600c7b60ff07f00557d1f6d443b0854627b1954d2a6ec75bc10f5f1e86960ef6f94090a7e0867348013d9b078a1dc2",
            "grantType": "refreshToken"
        }     
    Return: JSON String
   ********************************************************/
    async signIn() {
        try {
            const data = this.req.body;
            if (data.grantType == "password") {
                const fieldsArray = ["userId", "password"];
                const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
                if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                    return this.res.send({
                        status: 0,
                        message: "Please send" + " " + emptyFields.toString() + " fields required."
                    });
                }
                const user = await Users.findOne({
                    $or: [
                        {
                            emailId: data.userId.toString().toLowerCase()
                        }, {
                            registerId: data.userId
                        },
                    ],
                    isDeleted: false,
                    status: true
                });
                if (_.isEmpty(user)) {
                    return this.res.send({ status: 0, message: "User not exists or deleted or login other device" });
                }
                const password = atob(data.password)
                const status = await this.commonService.verifyPassword({ password: password, savedPassword: user.password });
                console.log(`status: ${status}`)
                if (!status) {
                    return this.res.send({ status: 0, message: "Invalid password" });
                }
                const userDetails = await Users.findById({ _id: user._id }).select({ password: 0, __v: 0, transactionPassword: 0 });
                const { token, refreshToken } = await this.authentication.createToken({
                    id: user._id,
                    role: userDetails.role,
                    ipAddress: this.req.ip,
                    device: this.req.device.type,
                    action: "Login"
                });
                return this.res.send({
                    status: 1,
                    message: "Login Successful",
                    access_token: token,
                    refresh_token: refreshToken,
                    data: userDetails
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
                const tokenStatus = await this.authentication.verifyRefreshToken(data);
                const userDetails = await Users.findById({ _id: tokenStatus.id }).select({ password: 0, __v: 0 });
                const { token, refreshToken } = await this.authentication.createToken({ id: userDetails._id, role: userDetails.role });
                return this.res.send({
                    status: 1,
                    message: "Login Successful",
                    access_token: token,
                    refresh_token: refreshToken,
                    data: userDetails
                });
            } else {
                return this.res.send({ status: 0, message: "Please send grantType fields required." });
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
            "userId":"emailId" or registerId
        }
    Return: JSON String
   ********************************************************/
    async forgotPassword() {
        try {
            const data = this.req.body;
            if (!data.userId) {
                return this.res.send({ status: 0, message: "Please send userId" });
            }
            const user = await Users.findOne({
                $or: [
                    {
                        emailId: data.userId.toString().toLowerCase()
                    }, {
                        registerId: data.userId
                    },
                ],
                isDeleted: false,
                status: true
            }, {
                fullName: 1,
                organisationName: 1,
                countryId: 1,
                role: 1,
                mobileNo: 1,
                emailId: 1,
                registerId: 1
            }).populate("countryId", { name: 1 });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: "User not exists or deleted" });
            }
            const newPassword = await this.commonService.randomGenerator(6);
            const encryptedPassword = await this.commonService.ecryptPassword({ password: newPassword });

            await Users.findByIdAndUpdate(user._id, {
                password: encryptedPassword
            }, { upsert: true });

            const name = user.role == "regular" ? user.fullName : user.organisationName;
            // Sending email
            await this.services.sendEmail(user.emailId, "Salar", "", `<html><body><h2>HI! ${name} you have requested for a password change</h2><h3><strong>New password: </strong>${newPassword}</h3></body></html>`);
            const message = `Dear ${name}, Welcome to www.salar.in Your User ID is ${user.registerId
                }, Your Password is ${newPassword}, Regards Strawberri World Solutions Private Limited.";`;
            // Sending message
            if (user.countryId.name == "India" && user.mobileNo) {
                await this.services.sendSignupConfirmation(user.mobileNo, message);
            }
            return this.res.send({ status: 1, message: "Please check your registered email" });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
Purpose: Reset password
Parameter:
    {
        "password":"123456",
        "token": "errrrwqqqsssfdfvfgfdewwwww"
    }
Return: JSON String
********************************************************/
    async resetPassword() {
        try {
            const user = await Users.findOne({ forgotToken: this.req.body.token });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: "Invalid token" });
            }
            const validatePassword = await this.commonService.passwordValidation(this.req.body.password);
            if (!validatePassword) {
                return this.res.send({ status: 0, message: "Max word limit - 15 (with Mix of Capital,Small Letters , One Numerical and One Special Character" });
            }
            let password = await this.commonService.ecryptPassword({ password: this.req.body.password });

            const updateUser = await Users.findByIdAndUpdate(user._id, {
                password: password
            }, { new: true });
            if (_.isEmpty(updateUser)) {
                return this.res.send({ status: 0, message: "Password not updated" });
            }
            return this.res.send({ status: 1, message: "Password updated successfully" });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Logout
    Method: GET
    Return: JSON String
   ********************************************************/
    async logOut() {
        try {
            const token = this.req.token;
            // console.log("token", token)
            if (!token) {
                return this.res.send({ status: 0, message: "Please send the token" });
            }
            const auth = await AccessTokens.findOne({ token: token, userId: this.req.user });
            if (_.isEmpty(auth)) {
                return this.res.send({ status: 0, message: "Invalid token" });
            }
            // const userStatus = await Users.findByIdAndUpdate(auth.userId, {status:true});
            // console.log(userStatus);
            // return this.res.send({ messages: userStatus});
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
module.exports = UsersController;
