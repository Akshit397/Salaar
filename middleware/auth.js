/** @format */

const { AccessTokens } = require("../models/s_auth");

class Authorization {
  static async isAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res.send({
        status: 0,
        message: "Access denied. No token provided.",
      });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const access_token = await AccessTokens.findOne({ token: token });
      if (
        access_token &&
        access_token.role != "regular" &&
        access_token.role != "organisation" && access_token.role != "adminAsUser"
      ) {
        return res.send({ status: 0, message: "Access denied. Not a user" });
      }
      if (access_token) {
        req.user = access_token.userId ? access_token.userId : access_token.adminAsUserId;
        req.token = token;
        next();
      } else {
        return res.send({
          status: 0,
          message: "Access denied. Token Expired.",
        });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.send({ status: 0, message: "Invalid token." });
    }
  }

  static async isSellerAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res.send({
        status: 0,
        message: "Access denied. No token provided.",
      });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const access_token = await AccessTokens.findOne({
        token: token,
        sellerId: { $exists: true },
      });
      if (access_token) {
        req.user = access_token.sellerId;
        req.token = token;
        next();
      } else {
        return res.send({
          status: 0,
          message: "Access denied. Token Expired.",
        });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.send({ status: 0, message: "Invalid token." });
    }
  }

  static async isAdminAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res
        .status(401)
        .send({ status: 0, message: "Access denied. No token provided." });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const access_token = await AccessTokens.findOne({ token: token });
      if (access_token) {
        if (access_token.role != "admin" && access_token.role != "staff") {
          return res
            .status(401)
            .send({ status: 0, message: "Access denied. Not an admin user" });
        }
        req.user = access_token.adminId;
        next();
      } else {
        return res
          .status(401)
          .send({ status: 0, message: "Access denied. Token Expired." });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.status(500).send({ status: 0, message: "Invalid token." });
    }
  }
}

module.exports = Authorization;
