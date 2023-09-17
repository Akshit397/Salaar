const _ = require("lodash");

const Controller = require("../base");
const { Products } = require("../../models/s_products");
const { GameProducts } = require("../../models/s_game_product");
const { FoodProducts } = require("../../models/s_food_products");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");

class ProductsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.requestBody = new RequestBody();
  }
  /********************************************************
    Purpose:Getting categories lists for website
    Method: Post
    Authorisation: true
    {
        "type":"subCategory1",
        "parentCategory":"5ccc4c8e5a16ae2b47ced986",
        "searchText":""
    }
    Return: JSON String
    ********************************************************/
  async getWebSiteProducts() {
    try {
      const result = await Products.find({}).limit(20);
      const result1 = await GameProducts.find({}).limit(20);
      // const result2 = await FoodProducts.find({}).limit(20);
      return this.res.send({
        status: 1,
        products: result,
        game: result1,
      });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getWebSiteGameProducts() {
    try {
      let game = await GameProducts.findOne({ _id: this.req.params.id });
      if (_.isEmpty(game))
        return this.res.send({ status: 0, message: "Details not found" });
      return this.res.send({ status: 1, data: game });
    } catch (error) {
      console.log(`error: ${error}`);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
}
module.exports = ProductsController;
