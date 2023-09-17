/** @format */

const _ = require("lodash");

const Controller = require("../base");
const Model = require("../../utilities/model");
const { Categories } = require("../../models/s_category");

const { Brand } = require("../../models/s_brand");
const { Deals } = require("../../models/s_deals");
const { Products } = require("../../models/s_products");
const { GameProducts } = require("../../models/s_game_product");
const { Country } = require("../../models/s_country");

const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");

class WebsiteController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
  }

  async getCountriesUA() {
    try {
      const countries = await Country.find(
        { status: true },
        { status: 0, _v: 0 },
      );
      return this.res.send({ status: 1, data: countries });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getCountriesUAPost() {
    try {
      let data = this.req.body;
      let fieldsArray = ["name", "iso", "nickname"];
      let emptyFields = await this.requestBody.checkEmptyWithFields(
        this.req.body,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "not found" });
      } else {
        const neeAllpages = await new Model(Country).store(data);
        return this.res.send({ status: 1, message: "registered Successfully" });
      }
    } catch (error) {
      console.log("error = ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
  async getCategoryiesUA() {
    try {
      const categories = await Categories.find(
        { status: true, isEcommerce: true },
        { status: 0, _v: 0 },
      );
      const gamecategories = await Categories.find(
        { status: true, isGame: true },
        { status: 0, _v: 0 },
      );

      return this.res.send({
        status: 1,
        data: [...categories, ...gamecategories],
      });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
  async getBrandsUA() {
    try {
      const brand = await Brand.find({ status: true }, { status: 0, _v: 0 });
      return this.res.send({ status: 1, data: brand });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
  async getGameProductsUA() {
    try {
      const offset = this.req.query.offset || 0;
      const limit = this.req.query.limit || 10;
      const gameProduct = await GameProducts.find(
        { status: 1 },
        { status: 0, _v: 0 },
      )
        .limit(limit)
        .skip(offset);
      return this.res.send({
        status: 1,
        limit: limit,
        offset: offset,
        data: gameProduct,
      });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getGameProductsUAID() {
    try {
      let id = this.req.params.id;
      let fieldsArray = ["id"];
      let emptyFields = await this.requestBody.checkEmptyWithFields(
        this.req.params,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "not found" });
      } else {
        const gameProduct = await GameProducts.findOne({ _id: id });
        console.log(gameProduct);
        return this.res.send({
          status: 1,
          data: gameProduct,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
  async getEcommProductsUA() {
    try {
      let query = { status: true };
      if (this.req.query.category) query["category"] = this.req.query.category;

      const products = await Products.find(query, { status: 0, _v: 0 })
        .limit(this.req.query.limit || 10)
        .skip(this.req.query.offset || 0);
      return this.res.send({ status: 1, data: products });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getEcommProductsUAID() {
    try {
      let query = { status: true };
      if (this.req.query.category) query["category"] = this.req.query.category;
      const products = await Products.find(query, { status: 0, _v: 0 })
        .populate("category")
        .limit(this.req.query.limit || 10)
        .skip(this.req.query.offset || 0);
      return this.res.send({ status: 1, data: products });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getEcommProductsDetailUAID() {
    try {
      let id = this.req.params.id;
      const products = await Products.findOne({ _id: id });
      return this.res.send({ status: 1, data: products });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getDealDetailsAll() {
    try {
      const Deal = await Deals.find({ isDeleted: false }, { _v: 0 });
      // .populate("products.productId" );
      if (_.isEmpty(Deal)) {
        return this.res.send({ status: 0, message: "Deal details not found" });
      }
      return this.res.send({ status: 1, data: Deal });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
}

module.exports = WebsiteController;
