/** @format */

const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const { GameProducts } = require('../../models/s_game_product');
const { Categories } = require('../../models/s_category');
const { Orders } = require('../../models/s_orders');
const { Gifts } = require('../../models/s_gifts');

const gameStages = [
    { $unwind: { "path": "$games", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "games",
            let: { gameId: "$games" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$_id", "$$gameId"] },
                                { $eq: ["$status", true] },
                                { $eq: ["$isDeleted", false] }
                            ]
                        }
                    }
                }
            ],
            as: "games"
        }
    },
    { $unwind: { "path": "$games", "preserveNullAndEmptyArrays": true } },
]
const giftStages = [
    {
        $lookup: {
            from: "gifts",
            let: { gameProductId: "$gameproducts._id" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [{ $eq: ["$gameProductId", "$$gameProductId"] },
                            { $eq: ["$isDeleted", false] },
                            { $eq: ["$status", true] },
                            ]
                        },
                    },
                },
            ],
            as: "gifts",
        },
    },
]
const gameProductsListingStages = [
    {
        $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
        },
    },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
    ...gameStages,
    {
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            finalPrice: { $first: "$finalPrice" }, points: { $first: "$points" },
            image: { $first: "$image" },
            customUrl: { $first: "$customUrl" },
            totalGames: { $sum: { $cond: { if: { $eq: ["$games.isDeleted", false] }, then: 1, else: 0 } } }, products: { $first: "$products" }
        }
    },
    { $unwind: { "path": "$products", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "products",
            let: {
                productId: "$products"
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$_id", "$$productId"] },
                                { $eq: ["$status", "Published"] },
                                { $eq: ["$isDeleted", false] },
                                { $eq: ["$isEcommerce", true] }
                            ]
                        }
                    }
                }
            ],
            as: "products"
        }
    },
    { $unwind: { "path": "$products", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            _id: 1, name: 1, finalPrice: 1, points: 1, image: 1, customUrl: 1, totalGames: 1, products: 1, stock: {
                $cond: {
                    if: { $eq: ["$product.productType", "Variant"] },
                    then: "$product.attributes.values.stock", else: "$product.stock"
                }
            }
        }
    },
    {
        $project: {
            _id: 1, name: 1, finalPrice: 1, points: 1, image: 1, customUrl: 1, totalGames: 1, products: 1, stock: {
                $cond: {
                    if: {
                        $gte: ["$stock", 0]
                    }, then: true, else: false
                }
            }
        }
    },
    {
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            finalPrice: { $first: "$finalPrice" }, points: { $first: "$points" },
            image: { $first: "$image" },
            customUrl: { $first: "$customUrl" },
            totalGames: { $first: "$totalGames" },
            products: { $push: { _id: "$products._id", name: "$products.name", "productImage": "$products.productImage", stockAvailable: "$stock" } }
        }
    },
];

const userGameProductListingStages = [
    { $unwind: { "path": "$products", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "gameproducts",
            localField: "products.productId",
            foreignField: "_id",
            as: "gameproducts",
        },
    },
    { $unwind: { "path": "$gameproducts", "preserveNullAndEmptyArrays": true } },
    ...giftStages,
    {
        $project: {
            gameproducts: 1, productId: "$gameproducts._id", "gifts.giftOn": 1, "gifts.image": 1, "gifts.quantity": 1, "gifts.giftName": 1,
            "gifts.finalPrice": 1
        }
    },
    { $unwind: { "path": "$gameproducts.games", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "games",
            let: { gameId: "$gameproducts.games" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$_id", "$$gameId"] },
                                { $eq: ["$status", true] },
                                { $eq: ["$isDeleted", false] }
                            ]
                        }
                    }
                }
            ],
            as: "games"
        }
    },
    { $unwind: { "path": "$games", "preserveNullAndEmptyArrays": true } },
    {
        $group: {
            _id: "$_id",
            name: { $first: "$gameproducts.name" },
            totalGames: { $sum: { $cond: { if: { $eq: ["$games.isDeleted", false] }, then: 1, else: 0 } } },
            productId: { $first: "$productId" },
            gifts: { $first: "$gifts" }
        }
    },
    {
        $group: {
            _id: "$productId",
            name: { $first: "$name" },
            totalGames: { $first: "$totalGames" },
            gifts: { $first: "$gifts" },
            orderedTimes: { $sum: 1 }
        }
    },
]

const userGamesListStages = [
    { $unwind: { "path": "$products", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "gameproducts",
            localField: "products.productId",
            foreignField: "_id",
            as: "gameproducts",
        },
    },
    { $unwind: { "path": "$gameproducts", "preserveNullAndEmptyArrays": true } },
    { $project: { gameproducts: 1, productId: "$gameproducts._id" } },
    { $unwind: { "path": "$gameproducts.games", "preserveNullAndEmptyArrays": true } },
    {
        $lookup: {
            from: "games",
            let: { gameId: "$gameproducts.games" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$_id", "$$gameId"] },
                                { $eq: ["$status", true] },
                                { $eq: ["$isDeleted", false] }
                            ]
                        }
                    }
                }
            ],
            as: "games"
        }
    },
    { $unwind: { "path": "$games", "preserveNullAndEmptyArrays": true } },
    {
        $group: {
            _id: "$games._id",
            name: { $first: "$games.name" },
            gameUrl: { $first: "$games.gameUrl" },
            image: { $first: "$games.image" }
        }
    },
]

class GamesController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
     Purpose: Get games list
    Method: Post
    Authorisation: False
    Parameter:
    {
        "categoryId": "",
        "page":1,
        "pagesize": 3,
        "sort":{ _id:-1 },
        "searchText":""
    }               
    Return: JSON String
      ********************************************************/
    async gameProductsListing() {
        try {
            const data = this.req.body;
            const skip = data.page && data.pagesize ? (parseInt(data.page) - 1) * parseInt(data.pagesize) : 1;
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize ? data.pagesize : 20;
            const categories = await Categories.find({ isGame: true, isDeleted: false, isPublish: true, type: "category" }, { categoryName: 1, image: 1 })
            let query = {};
            query = data.categoryId ? { categoryId: ObjectID(data.categoryId) } : {};
            let finalQuery = [{}]
            if (this.req.body.searchText) {
                const regex = { $regex: `.* ${this.req.body.searchText}.* `, $options: 'i' };
                finalQuery.push({ $or: [{ name: regex }] })
            }
            const result = await GameProducts.aggregate([
                { $match: { isGame: true, status: true, isDeleted: false, finalPrice: { $ne: null }, ...query } },
                ...gameProductsListingStages,
                { $match: { $and: finalQuery } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await GameProducts.aggregate([
                { $match: { isGame: true, status: true, isDeleted: false, finalPrice: { $ne: null }, ...query } },
                ...gameProductsListingStages,
                { $match: { $and: finalQuery } },
                { $project: { _id: 1 } }
            ]);
            return this.res.send({ status: 1, message: "Game product listing are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length, categories });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose: Get Game Details
    Method: GET
    Authorisation: False            
    Return: JSON String
    ********************************************************/
    async getGameProductDetails() {
        try {
            const data = this.req.params;
            if (!data.customUrl) {
                return this.res.send({ status: 0, message: "Please send customUrl" });
            }
            // getting game product details using customUrl as customUrl of each game product has unique value
            const game = await GameProducts.findOne({ customUrl: data.customUrl, isDeleted: false })
                .populate('categoryId', { categoryName: 1 })
                .populate('countryId', { name: 1 })
                .populate('planId', { name: 1 }).lean();
            if (_.isEmpty(game)) {
                return this.res.send({ status: 0, message: "Game details not found" });
            }
            const gifts = await Gifts.find({ status: true, isDeleted: false, gameProductId: game._id },
                { giftName: 1, giftOn: 1, image: 1, quantity: 1, finalPrice: 1 })
            // fetching game details
            const games = await GameProducts.aggregate([
                { $match: { customUrl: data.customUrl, isGame: true, status: true, isDeleted: false, } },
                {
                    $lookup: {
                        from: "games",
                        localField: "games",
                        foreignField: "_id",
                        as: "games",
                    },
                },
                { $unwind: { "path": "$games", "preserveNullAndEmptyArrays": true } },
                { $match: { "games.status": true, "games.isDeleted": false } },
                { $project: { games: 1, _id: 0 } }
            ]);
            const finalGames = await games.map(res => {
                return res.games;
            })
            // fetching ecommerce products details
            const products = await GameProducts.aggregate([
                { $match: { customUrl: data.customUrl, isGame: true, status: true, isDeleted: false, } },
                {
                    $lookup: {
                        from: "products",
                        localField: "products",
                        foreignField: "_id",
                        as: "products",
                    },
                },
                { $unwind: { "path": "$products", "preserveNullAndEmptyArrays": true } },
                {
                    $project: {
                        _id: 1, name: 1, finalPrice: 1, points: 1, image: 1, customUrl: 1, totalGames: 1, products: 1, stock: {
                            $cond: {
                                if: { $eq: ["$product.productType", "Variant"] },
                                then: "$product.attributes.values.stock", else: "$product.stock"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1, name: 1, finalPrice: 1, points: 1, image: 1, customUrl: 1, totalGames: 1, products: 1, stock: {
                            $cond: { if: { $gte: ["$stock", `$quantity`] }, then: true, else: false }
                        }
                    }
                },
                {
                    $match: {
                        "products.isEcommerce": true, "products.isDeleted": false,
                        "products.status": "Published",
                    }
                },
                { $project: { products: 1, stockAvailable: "$stock", _id: 0 } }
            ]);
            const finalProducts = await products.map(res => {
                return { ...res.products, stockAvailable: res.stockAvailable }
            });
            return this.res.send({ status: 1, message: "Game product details are: ", data: { ...game, gifts, games: finalGames, products: finalProducts } });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get users game product list
   Method: Post
   Authorisation: true
   Parameter:
   {
       "page":1,
       "pagesize": 3,
       "sort":{ _id:-1 },
       "searchText":""
   }               
   Return: JSON String
     ********************************************************/
    async userGameProductsListing() {
        try {
            const currentUserId = this.req.user;
            const data = this.req.body;
            if (!data.page || !data.pagesize) {
                return this.res.send({ status: 0, message: "Please send proper request params" });
            }
            const skip = data.page && data.pagesize ? (parseInt(data.page) - 1) * parseInt(data.pagesize) : 1;
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize ? data.pagesize : 20;
            let finalQuery = [{}]
            if (this.req.body.searchText) {
                const regex = { $regex: `.* ${this.req.body.searchText}.* `, $options: 'i' };
                finalQuery.push({ $or: [{ name: regex }] })
            }
            const result = await Orders.aggregate([
                { $match: { userId: ObjectID(currentUserId), orderStatus: "paid" } },
                ...userGameProductListingStages,
                { $match: { $and: finalQuery } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Orders.aggregate([
                { $match: { userId: ObjectID(currentUserId), orderStatus: "paid" } },
                ...userGameProductListingStages,
                { $match: { $and: finalQuery } },
                { $project: { _id: 1 } }
            ]);
            return this.res.send({ status: 1, message: "Game product listing are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Get users game product list
  Method: GET
  Authorisation: true               
  Return: JSON String
    ********************************************************/
    async gamesListInGameProducts() {
        try {
            const currentUserId = this.req.user;
            const data = this.req.params;
            if (!data.gameProductId) {
                return this.res.send({ status: 0, message: "Please send gameProductId" });
            }
            let gamesList = await Orders.aggregate([
                { $match: { "userId": ObjectID(currentUserId), orderStatus: "paid", "products.productId": ObjectID(data.gameProductId) } },
                ...userGamesListStages
            ]);
            gamesList = gamesList.filter((res) => {
                return res._id != null;
            });
            if (_.isEmpty(gamesList)) {
                return this.res.send({ status: 0, message: "Game details not found" });
            }
            return this.res.send({ status: 1, message: "Game product details are: ", data: gamesList });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: Get users gifts product list
  Method: GET
  Authorisation: true               
  Return: JSON String
    ********************************************************/
    async giftsListInGameProducts() {
        try {
            const data = this.req.params;
            if (!data.gameProductId) {
                return this.res.send({ status: 0, message: "Please send gameProductId" });
            }
            const giftsList = await Gifts.find({ gameProductId: data.gameProductId, isDeleted: false, status: true },
                { giftName: 1, giftOn: 1, quantity: 1, finalPrice: 1, image: 1 })
            if (_.isEmpty(giftsList)) {
                return this.res.send({ status: 0, message: "Gift details not found" });
            }
            return this.res.send({ status: 1, message: "Gift product details are: ", data: giftsList });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = GamesController;
