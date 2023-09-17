/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Admin } = require("../../models/s_admin");
const { Users } = require("../../models/s_users");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const { SponsorId } = require("../../models/s_sponser_team");
const { Country } = require("../../models/s_country");
const Model = require("../../utilities/model");
class AdminAuthController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }
  async signIn() {
    try {
      let fieldsArray = [];
      const data = this.req.body;

      if (data.grant_type == "password") {
        fieldsArray = ["email", "password", "grant_type"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(
          data,
          fieldsArray,
        );
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
          return this.res.send({
            status: 0,
            message:
              "Please send" +
              " " +
              emptyFields.toString() +
              " fields required.",
          });
        }

        const admin = await Admin.findOne({
          email: data.email.toString().toLowerCase(),
        });
        if (_.isEmpty(admin)) {
          return this.res
            .status(401)
            .send({ status: 0, message: "Invalid Email" });
        }

        const status = await this.commonService.verifyPassword({
          password: data.password,
          savedPassword: admin.password,
        });
        if (!status) {
          return this.res
            .status(401)
            .send({ status: 0, message: "Invalid password" });
        }

        const adminDetails = await Admin.findById({ _id: admin._id }).select({
          password: 0,
          __v: 0,
          transactionPassword: 0,
        });
        const { token, refreshToken } =
          await this.authentication.createAdminToken({
            id: admin._id,
            role: adminDetails.role,
            ipAddress: this.req.ip,
            device: this.req.device.type,
            action: "Login",
          });
        return this.res.send({
          status: 1,
          message: "Login Successful",
          access_token: token,
          refresh_token: refreshToken,
          data: adminDetails,
        });
      } else if (data.grant_type == "refresh_token") {
        fieldsArray = ["refreshToken", "grant_type"];
        const emptyFieldsRefresh = await this.requestBody.checkEmptyWithFields(
          data,
          fieldsArray,
        );
        if (
          emptyFieldsRefresh &&
          Array.isArray(emptyFieldsRefresh) &&
          emptyFieldsRefresh.length
        ) {
          return this.res.send({
            status: 0,
            message:
              "Please send" +
              " " +
              emptyFieldsRefresh.toString() +
              " fields required.",
          });
        }
        const tokenStatus = await this.authentication.verifyAdminRefreshToken(
          data,
        );
        const adminDetails = await Admin.findById({
          _id: tokenStatus.id,
        }).select({ password: 0, __v: 0 });
        const { token, refreshToken } = await this.authentication.createToken({
          id: adminDetails._id,
          role: adminDetails.role,
        });
        return this.res.send({
          status: 1,
          message: "Login Successful",
          access_token: token,
          refresh_token: refreshToken,
          data: adminDetails,
        });
      } else {
        return this.res.status(400).send({
          status: 0,
          message: "Please send grant type fields required.",
        });
      }
    } catch (error) {
      console.log(error);
      return this.res
        .status(500)
        .send({ status: 0, message: "Internal server error" });
    }
  }

  async signUp() {
    try {
      if (!this.req.body.role) {
        return this.res.send({
          status: 0,
          message: "Please send role of the user",
        });
      }
      let fieldsArray =
        this.req.body.role == "admin"
          ? [
            "fullName",
            "dob",
            "gender",
            "age",
            "email",
            "countryId",
            "mobileNo",
            "password",
            "termsAndConditions",
          ]
          : [
            "organisationName",
            "registeredYear",
            "email",
            "countryId",
            "mobileNo",
            "password",
            "termsAndConditions",
          ];
      let emptyFields = await this.requestBody.checkEmptyWithFields(
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
      if (this.req.body.fullName) {
        const validateName = await this.commonService.nameValidation(
          this.req.body.fullName,
        );
        if (!validateName) {
          return this.res.send({
            status: 0,
            message: "Please send proper fullName",
          });
        }
      }

      const validateCountry = await Country.findOne({
        _id: this.req.body.countryId,
        status: 1,
      });
      if (_.isEmpty(validateCountry)) {
        return this.res.send({
          status: 0,
          message: "Country details not found",
        });
      }

      const validateEmail = await this.commonService.emailIdValidation(
        this.req.body.email,
      );
      if (!validateEmail) {
        return this.res.send({
          status: 0,
          message: "Please send proper emailId",
        });
      }
      const validateMobileNo = await this.commonService.mobileNoValidation(
        this.req.body.mobileNo,
      );
      if (!validateMobileNo) {
        return this.res.send({
          status: 0,
          message: "Mobile number should have 10 digits",
        });
      }
      const validatePassword = await this.commonService.passwordValidation(
        this.req.body.password,
      );
      if (!validatePassword) {
        return this.res.send({
          status: 0,
          message:
            "Max word limit - 15 (with Mix of Capital,Small Letters , One Numerical and One Special Character",
        });
      }
      if (this.req.body.sponserId) {
        const userExists = await Admin.findOne({
          registerId: this.req.body.sponserId,
          isDeleted: false,
        });
        if (_.isEmpty(userExists)) {
          return this.res.send({ status: 0, message: "Invalid sponserId" });
        }
      }

      const user = await Admin.findOne({
        email: this.req.body.email.toLowerCase(),
      });

      //if user exist give error
      if (!_.isEmpty(user) && user.email) {
        return this.res.send({ status: 0, message: "Email already exists" });
      } else {
        let data = this.req.body;
        const transactionPassword = await this.commonService.randomGenerator(6);
        const encryptedPassword = await this.commonService.ecryptPassword({
          password: data["password"],
        });
        data = { ...data, password: encryptedPassword, transactionPassword };
        data["email"] = data["email"].toLowerCase();
        let usersCount = await Admin.count();
        if (usersCount <= 8) {
          usersCount = "0" + (usersCount + 1);
        }
        const randomText =
          (await this.commonService.randomGenerator(2, "number")) +
          (await this.commonService.randomGenerator(1, "capital")) +
          (await this.commonService.randomGenerator(2, "number"));
        data["registerId"] = "S" + randomText + usersCount;
        // save new user
        const newUser = await new Model(Admin).store(data);
        const sponser = await new Model(SponsorId).store({
          user_id: newUser._id,
          sponsor_id: data["registerId"],
          doj: Date.now(),
          user_name: this.req.body.fullName,
          email_id: this.req.body.email,
        });

        // if empty not save user details and give error message.
        if (_.isEmpty(newUser && sponser)) {
          return this.res.send({ status: 0, message: "User not saved" });
        } else {
          const name =
            newUser.role == "regular"
              ? newUser.fullName
              : newUser.organisationName;
          // Sending email
          await this.services.sendEmail(
            newUser.email,
            "Salar",
            "",
            `<html><body><h2>HI! ${name} you have successfully registered with salar</h2><strong>RegisteredId</strong>: ${newUser.registerId} </br> <strong>Transaction password:</strong> ${transactionPassword}<h3></h3></body></html>`,
          );
          const message = `Dear ${name}, Welcome to www.salar.in Your User ID is ${newUser.registerId}, Your Password is ${transactionPassword}, Regards Strawberri World Solutions Private Limited.";`;
          // Sending message
          if (validateCountry.name == "India" && newUser.mobileNo) {
            await this.services.sendSignupConfirmation(
              newUser.mobileNo,
              message,
            );
          }
          return this.res.send({
            status: 1,
            message: "User registered Successfully",
          });
        }
      }
    } catch (error) {
      console.log("error = ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
     Purpose: Admin login as User
     Method: Get
     Authorisation: true               
     Return: JSON String
 ********************************************************/
  async adminLoginAsUser() {
    try {
      const data = this.req.params;
      const adminId = this.req.user;
      if (!data.userId) {
        return this.res.send({ status: 0, message: "Please send userId" });
      }
      const admin = await Admin.findOne({ _id: adminId });
      if (_.isEmpty(admin)) {
        return this.res.send({ status: 0, message: "Admin details not found" });
      }
      const user = await Users.findOne({ _id: data.userId }, { password: 0, __v: 0, transactionPassword: 0 });
      if (_.isEmpty(user)) {
        return this.res.send({ status: 0, message: "User details not found" });
      }
      const { token, refreshToken } =
        await this.authentication.createAdminAsUserToken({
          id: data.userId,
          role: "adminAsUser",
          ipAddress: this.req.ip,
          device: this.req.device.type,
          action: "Login",
        });
      return this.res.send({
        status: 1,
        message: "Login Successful",
        access_token: token,
        refresh_token: refreshToken,
        data: user
      });
    } catch (error) {
      console.log(error);
      return this.res
        .status(500)
        .send({ status: 0, message: "Internal server error" });
    }
  }
}

module.exports = AdminAuthController;
