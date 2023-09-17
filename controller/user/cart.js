const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Cart } = require("../../models/s_cart");
const { Products } = require("../../models/s_products");
const { MLM } = require("../../models/s_game_mlm");
const { Users } = require("../../models/s_users");
const { FoodProducts } = require("../../models/s_food_products");
const { GameProducts } = require("../../models/s_game_product");
const { Coupons } = require("../../models/s_coupons");
const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const IthinkController = require('../common/ithink');


const gstStages = [
    { $lookup: { from: "gstcodes", localField: "productDetails.gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "adminsettings", localField: "productDetails.adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
];

class CartController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add and update products details in cart
    Method: Post
    Authorisation: true
    Parameter:
    {
        "quantity":2,
        "productId":"641b4911c56ee001379dd87e",
        "productType":"Variant",
        "attributeId":"641b4911c56ee001379dd87f",
        "sizeId":"641b4911c56ee001379dd880",
        "type":"isEcommerce" or "isFood" or "isGame",
        "isInput": true,
        "isIncrement": false
    }
    Return: JSON String
    ********************************************************/
    async addToCart() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const fields = ["productId", "productType", "quantity", "type"]
            const fieldsArray = data.productType == 'Simple' ?
                fields : [...fields, "attributeId", "sizeId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const checkingDetails = await Cart.findOne({ userId: userId });
            if (data.type == "isEcommerce") {
                const productDetails = await Products.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isFood") {
                const productDetails = await FoodProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isGame") {
                data.ecommerceProducts = data.ecommerceProducts ? data.ecommerceProducts : []
                const productDetails = await GameProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            const value = {
                quantity: (data.quantity > 0) ? data.quantity : 1,
                productId: data.productId,
                productType: data.productType,
                attributeId: data.attributeId,
                sizeId: data.sizeId,
                sponserId: data.sponserId,
                ecommerceProducts: data.ecommerceProducts
            }
            const cartKey = data.type == "isEcommerce" ? "ecommerceCart" : (data.type == "isFood" ? "foodCart" : "gameCart")
            const updateCartProductsQuantity = data.type == "isEcommerce" ? "ecommerceCart.$.quantity" :
                (data.type == "isFood" ? "foodCart.$.quantity" : "gameCart.$.quantity")
            const updateCartProductsSponserId = data.type == "isEcommerce" ? "ecommerceCart.$.sponserId" :
                (data.type == "isFood" ? "foodCart.$.sponserId" : "gameCart.$.sponserId")
            const query = (data.isInput) ? { $set: { [updateCartProductsQuantity]: value.quantity } } :
                ((data.isIncrement) ?
                    { $inc: { [updateCartProductsQuantity]: value.quantity * 1 } } :
                    { $inc: { [updateCartProductsQuantity]: value.quantity * -1 } })
            if (_.isEmpty(checkingDetails)) {
                const data = {
                    userId: userId,
                    [cartKey]: [value]
                }
                const newCart = await new Model(Cart).store(data);
                if (_.isEmpty(newCart)) { return this.res.send({ status: 0, message: "Details not saved" }); }
                /****** getting cart Total *******/
                const details = await this.gettingCartTotal(userId, data.type)
                /****** getting cart Quantity *******/
                const quantity = await this.gettingCartQuantity(userId, data.type)
                const data1 = { cartTotal: details.cartValue, quantity }
                return this.res.send({ status: 1, message: "Details added successfully", data: data1 });
            }
            else {
                const cartProductId = data.type == "isEcommerce" ? "ecommerceCart.productId" :
                    (data.type == "isFood" ? "foodCart.productId" : "gameCart.productId")

                const cartDetails = await Cart.findOne({ userId: userId, [cartProductId]: value.productId });
                console.log(`cartDetails: ${JSON.stringify(cartDetails)}`)
                if (_.isEmpty(cartDetails)) {
                    const cartUpdate = await Cart.findOneAndUpdate({ userId: userId }, { $push: { [cartKey]: value } }, { upsert: true, new: true });
                    if (_.isEmpty(cartUpdate)) { return this.res.send({ status: 0, message: "Details not saved" }); }
                    /****** getting cart Total *******/
                    const details = await this.gettingCartTotal(userId, data.type)
                    /****** getting cart Quantity *******/
                    const quantity = await this.gettingCartQuantity(userId, data.type)
                    const data1 = { cartTotal: details.cartValue, quantity }
                    return this.res.send({ status: 1, message: "Details added successfully", data: data1 });
                }
                else {
                    const sponserAvailable = await MLM.findOne({ registerId: data.sponserId, gameProductId: data.productId, levelsCompleted: false, autoRepurchase: false })
                    if (_.isEmpty(sponserAvailable)) {
                        return this.res.send({ status: 1, message: `Sponser with sponserId: ${data.sponserId} is not available` });
                    }
                    const cartUpdateDetails = await Cart.findOneAndUpdate({ userId: userId, [cartProductId]: value.productId }, { ...query, $set: { [updateCartProductsSponserId]: data.sponserId } }, { new: true, upsert: true })
                    if (_.isEmpty(cartUpdateDetails)) { return this.res.send({ status: 0, message: "Details not updated" }); }
                    /****** getting cart Total *******/
                    const details = await this.gettingCartTotal(userId, data.type)
                    /****** getting cart Quantity *******/
                    const quantity = await this.gettingCartQuantity(userId, data.type)
                    const data1 = { cartTotal: details.cartValue, quantity }
                    return this.res.send({ status: 1, message: "Details updated successfully", data: data1 });
                }
            }
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
  Purpose: Add and update products details in saveForLater
  Method: Post
  Authorisation: true
  Parameter:
  {
       "quantity":2,
       "productId":"5cd00e988566d30c6b8553cc",
       "productType":"Variant",
       "attributeId":"641b4911c56ee001379dd87f",
       "sizeId":"641b4911c56ee001379dd880",
       "type":"isEcommerce" or "isFood" or "isGame",
       "isBack": true
  }
  Return: JSON String
  ********************************************************/
    async saveForLater() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const fields = ["productId", "productType", "quantity", "type"]
            const fieldsArray = data.productType == 'Simple' ?
                fields : [...fields, "attributeId", "sizeId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const cartKey = data.type == "isEcommerce" ? "ecommerceCart" : (data.type == "isFood" ? "foodCart" : "gameCart")
            const saveForLaterKey = data.type == "isEcommerce" ? "ecommerceSaveForLater" : (data.type == "isFood" ? "foodSaveForLater" : "gameSaveForLater")
            const cartProductId = data.type == "isEcommerce" ? "ecommerceCart.productId" :
                (data.type == "isFood" ? "foodCart.productId" : "gameCart.productId")
            const updateCartProductsQuantity = data.type == "isEcommerce" ? "ecommerceCart.$.quantity" :
                (data.type == "isFood" ? "foodCart.$.quantity" : "gameCart.$.quantity")
            const saveForLaterProductId = data.type == "isEcommerce" ? "ecommerceSaveForLater.productId" :
                (data.type == "isFood" ? "foodSaveForLater.productId" : "gameSaveForLater.productId")
            const updateSaveForLaterProductsQuantity = data.type == "isEcommerce" ? "ecommerceSaveForLater.$.quantity" :
                (data.type == "isFood" ? "foodSaveForLater.$.quantity" : "gameSaveForLater.$.quantity")

            const changingTerm = (data.isBack) ? [saveForLaterKey] : [cartKey]
            const key = (data.isBack) ? [cartKey] : [saveForLaterKey]
            const changingKey = (data.isBack) ? [cartProductId] : [saveForLaterProductId]
            const changingQuantity = (data.isBack) ? [updateCartProductsQuantity] : [updateSaveForLaterProductsQuantity]
            const checkingDetails = await Cart.findOne({ userId: userId });
            if (data.type == "isEcommerce") {
                const productDetails = await Products.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isFood") {
                const productDetails = await FoodProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            if (data.type == "isGame") {
                const productDetails = await GameProducts.findOne({ _id: data.productId, isDeleted: false })
                if (_.isEmpty(productDetails)) { return this.res.send({ status: 0, message: "Product details not found" }); }
            }
            const value = {
                quantity: (data.quantity > 0) ? data.quantity : 1,
                productId: data.productId,
                productType: data.productType,
                attributeId: data.attributeId,
                sizeId: data.sizeId,
            }
            if (_.isEmpty(checkingDetails)) {
                const data = {
                    userId: userId,
                    [key]: [value]
                }
                const newCart = await new Model(Cart).store(data);
                if (_.isEmpty(newCart))
                    return this.res.send({ status: 0, message: "Details not saved" });
                return this.res.send({ status: 1, message: "Details added successfully" });
            }
            else {
                const cartDetails = await Cart.findOne({ userId: userId, [changingKey]: value.productId });
                if (_.isEmpty(cartDetails)) {
                    await Cart.findOneAndUpdate({ userId: userId }, { $pull: { [changingTerm]: { productId: data.productId } } });
                    const cartUpdate = await Cart.findOneAndUpdate({ userId: userId }, { $push: { [key]: value } }, { upsert: true, new: true });
                    if (_.isEmpty(cartUpdate))
                        return this.res.send({ status: 0, message: "Details not saved" });
                    return this.res.send({ status: 1, message: "Details added successfully" });
                }
                else {
                    await Cart.findOneAndUpdate({ userId: userId }, { $pull: { [changingTerm]: { productId: data.productId } } });
                    const cartUpdateDetails = await Cart.findOneAndUpdate({ userId: userId, [changingKey]: value.productId }, { $inc: { [changingQuantity]: value.quantity } }, { new: true, upsert: true })
                    if (_.isEmpty(cartUpdateDetails))
                        return this.res.send({ status: 0, message: "Details not updated" });
                    return this.res.send({ status: 1, message: "Details updated successfully" });
                }
            }
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Product in Cart 
    Method: Post
    Authorisation: true
    Parameter:
    {
        "productId":"5cd01da1371dc7190b085f86",
        "type":"isEcommerce" or "isFood" or "isGame",
        "isCart": true,
    }
    Return: JSON String
    ********************************************************/
    async deleteCartProducts() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const fieldsArray = ["productId", "type"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const cartKey = data.type == "isEcommerce" ? "ecommerceCart" : (data.type == "isFood" ? "foodCart" : "gameCart")
            const saveForLaterKey = data.type == "isEcommerce" ? "ecommerceSaveForLater" : (data.type == "isFood" ? "foodSaveForLater" : "gameSaveForLater")
            const cartProductId = data.type == "isEcommerce" ? "ecommerceCart.productId" :
                (data.type == "isFood" ? "foodCart.productId" : "gameCart.productId")
            const saveForLaterProductId = data.type == "isEcommerce" ? "ecommerceSaveForLater.productId" :
                (data.type == "isFood" ? "foodSaveForLater.productId" : "gameSaveForLater.productId")
            const deleteKey = (data.isCart) ? [cartProductId] : [saveForLaterProductId]
            const deleteTerm = (data.isCart) ? [cartKey] : [saveForLaterKey];
            const cartDetails = await Cart.findOne({ userId: userId, [deleteKey]: data.productId });
            if (_.isEmpty(cartDetails)) {
                return this.res.send({ status: 0, message: "Details not found" });
            }
            else {
                const cartUpdateDetails = await Cart.findOneAndUpdate({ userId: userId, [deleteKey]: data.productId }, { $pull: { [deleteTerm]: { productId: this.req.body.productId } } })
                if (_.isEmpty(cartUpdateDetails)) { return this.res.send({ status: 0, message: "Details not deleted" }); }
                /****** getting cart Total *******/
                const details = await this.gettingCartTotal(userId, data.type)
                const data1 = { cartTotal: details.cartValue }
                return this.res.send({ status: 1, message: "Deleted successfully", data: data1 });
            }
        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Getting Cart Details
    Method: POST
    {
        "type": "isEcommerce" or "isFood" or "isGame"
    }
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getCartDetails() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send a type value" })
            }
            /****** getting cart Total *******/
            const details = await this.gettingCartTotal(userId, data.type)
            const saveForLaterDetails = await this.gettingCartTotal(userId, data.type, true) // for getting saveForLater details
            const cartDetails = details.cartDetails;
            const cart = { cartDetails }
            cart.cartTotal = details.cartValue
            cart.saveForLater = saveForLaterDetails.cartDetails;
            return this.res.send({ status: 1, message: "Listing details are: ", data: cart });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /**** Getting cart total ******/
    async gettingCartTotal(userId, type, isSaveForLater) {
        return new Promise(async (resolve, reject) => {
            try {
                let cartKey = type == "isEcommerce" ? "ecommerceCart" : (type == "isFood" ? "foodCart" : "gameCart")
                if (isSaveForLater) {
                    cartKey = type == "isEcommerce" ? "ecommerceSaveForLater" : (type == "isFood" ? "foodSaveForLater" : "gameSaveForLater")
                }
                const ecomProductsProjection = [
                    { $unwind: { "path": "$productDetails.attributes", "preserveNullAndEmptyArrays": true } },
                    { $unwind: { "path": "$productDetails.attributes.values", "preserveNullAndEmptyArrays": true } },
                    {
                        $project: {
                            productDetails: 1, attributeId: {
                                $toString: "$productDetails.attributes._id"
                            },
                            sizeId: {
                                $toString: "$productDetails.attributes.values._id"
                            }, ecommerceCart: 1, gst: "$gstCode.gst", adminsettings: 1
                        }
                    },
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    {
                                        $and: [
                                            { $eq: ["$sizeId", "$ecommerceCart.sizeId"] },
                                            { $eq: ["$attributeId", "$ecommerceCart.attributeId"] },
                                            { $eq: ["$productDetails.productType", "Variant"] },
                                            { $eq: ["$productDetails.isDeleted", false] },
                                        ]
                                    },
                                    {
                                        $and: [
                                            { $eq: ["$productDetails.productType", "Simple"] },
                                            { $eq: ["$productDetails.isDeleted", false] },
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            unitPrice: {
                                $cond: {
                                    if: { $gte: ["$productDetails.productType", "Variant"] },
                                    then: "$productDetails.attributes.values.price", else: "$productDetails.unitPrice"
                                }
                            },
                            length: "$productDetails.length",
                            width: "$productDetails.width",
                            height: "$productDetails.height",
                            weight: "$productDetails.weight",
                            sellerId: "$productDetails.sellerId",
                            otherTaxes: "$productDetails.otherTaxes",
                            discount: "$productDetails.discount", gst: 1,
                            name: "$productDetails.name", productImage: "$productDetails.productImage",
                            customUrl: "$productDetails.customUrl", productId: "$productDetails._id",
                            stock: {
                                $cond: {
                                    if: { $eq: ["$productDetails.productType", "Variant"] },
                                    then: "$productDetails.attributes.values.stock", else: "$productDetails.stock"
                                }
                            }, quantity: `$${cartKey}.quantity`,
                            productType: `$${cartKey}.productType`,
                            size: "$productDetails.attributes.values.size",
                            color: "$productDetails.attributes.color", adminsettings: 1
                        }
                    },
                    {
                        $project: {
                            price: {
                                $sum: ["$unitPrice", "$otherTaxes"]
                            },
                            adminsettings: 1, sellerId: 1, discount: 1, gst: 1,
                            name: 1, description: 1, productImage: 1, attributes: 1,
                            customUrl: 1, stock: {
                                $cond: { if: { $gte: ["$stock", `$quantity`] }, then: true, else: false }
                            }, productType: 1, size: 1, color: 1, sellerId: 1, brandId: 1
                        }
                    },
                    {
                        $project: {
                            discountPrice: {
                                $multiply: [{
                                    $divide: ["$discount", 100]
                                }, "$price"]
                            }, discount: 1, price: 1,
                            adminsettings: 1, sellerId: 1, gst: 1,
                            name: 1, description: 1, productImage: 1, attributes: 1,
                            customUrl: 1, stock: {
                                $cond: {
                                    if: { $gte: ["$stock", `$quantity`] }, then: true, else: false
                                }
                            }, productType: 1, size: 1, color: 1, sellerId: 1, brandId: 1
                        }
                    },
                    {
                        $project: {
                            finalPrice: { $subtract: ["$price", "$discountPrice"] }, price: 1,
                            discountPrice: 1, discount: 1, adminsettings: 1, gst: 1,
                            name: 1, description: 1, productImage: 1, attributes: 1,
                            customUrl: 1, stock: 1, productType: 1, size: 1, color: 1,
                            sellerId: 1, brandId: 1
                        }
                    },
                    {
                        $project: {
                            finalPrice: {
                                $sum: ["$finalPrice", {
                                    $multiply: [{
                                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                                    }, "$finalPrice"]
                                }, {
                                        $multiply: [{
                                            $divide: ["$gst", 100]
                                        }, "$finalPrice"]
                                    }]
                            },
                            totalPrice: {
                                $sum: ["$price", {
                                    $multiply: [{
                                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                                    }, "$price"]
                                }, {
                                        $multiply: [{
                                            $divide: ["$gst", 100]
                                        }, "$price"]
                                    }]
                            },
                            discountPrice: 1, discount: 1, price: 1,
                            name: 1, description: 1, productImage: 1, attributes: 1,
                            customUrl: 1, stock: 1, productType: 1, sellerId: 1, size: 1, color: 1, brandId: 1,
                        }
                    },
                ]
                const foodProductsProjection = [
                    {
                        $project: {
                            finalPrice: {
                                $sum: ["$productDetails.unitPrice", "$productDetails.otherTaxes", {
                                    $multiply: [{
                                        $divide: ["$gstCode.gst", 100]
                                    }, "$productDetails.unitPrice"]
                                }]
                            },
                            adminsettings: 1,
                            name: "$productDetails.name", productImage: "$productDetails.productImage",
                            customUrl: "$productDetails.customUrl", productId: "$productDetails._id",
                            stock: "$productDetails.availability", quantity: `$${cartKey}.quantity`,
                            productType: `$${cartKey}.productType`, packagingCharges: "$productDetails.packagingCharges",
                            deliveryCharges: "$productDetails.deliveryCharges"
                        }
                    },
                    {
                        $project: {
                            finalPrice: {
                                $sum: ["$finalPrice", {
                                    $multiply: [{
                                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                                    }, "$finalPrice"]
                                }]
                            },
                            transactionFee: {
                                $multiply: [{
                                    $divide: ["$adminsettings.transactionFeeLocal", 100]
                                }, "$finalPrice"]
                            },
                            name: 1, productImage: 1, productId: 1, packagingCharges: 1, deliveryCharges: 1,
                            customUrl: 1, stock: 1, quantity: 1, productType: 1
                        }
                    }
                ]
                const gameProductsProjection = [
                    {
                        $project: {
                            finalPrice: {
                                $sum: ["$productDetails.finalPrice", {
                                    $multiply: [{
                                        $divide: ["$adminsettings.transactionFeeLocal", 100]
                                    }, "$productDetails.finalPrice"]
                                }]
                            },
                            name: "$productDetails.name", productImage: "$productDetails.image",
                            productId: "$productDetails._id",
                            product_id: "$productDetails.productId",
                            customUrl: "$productDetails.customUrl",
                            quantity: `$${cartKey}.quantity`,
                            productType: `$${cartKey}.productType`,
                            stock: {
                                $toBool: "true"
                            },
                            "gifts.giftOn": 1, "gifts.image": 1, "gifts.quantity": 1, "gifts.giftName": 1,
                            "gifts.finalPrice": 1
                        }
                    },
                ]
                const projectData = type == "isEcommerce" ? ecomProductsProjection :
                    (type == "isFood" ? foodProductsProjection : gameProductsProjection)
                const ecomProductsStages = [
                    { $lookup: { from: "products", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails" } },
                ]
                const foodProductsStages = [
                    { $lookup: { from: "foodproducts", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails" } },
                ]
                const gameProductsStages = [
                    { $lookup: { from: "gameproducts", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails" } },
                    {
                        $lookup: {
                            from: "gifts",
                            let: { gameProductId: "$productDetails._id" },
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
                const stages = type == "isEcommerce" ? ecomProductsStages :
                    (type == "isFood" ? foodProductsStages : gameProductsStages)
                const cartDetails = await Cart.aggregate([
                    { $match: { userId: ObjectID(userId) } },
                    { $unwind: { path: `$${cartKey}` } },
                    ...stages,
                    { $match: { "productDetails.isDeleted": false } },
                    ...gstStages,
                    ...projectData,
                ]);
                let cartValue = 0
                await cartDetails.map(data => { cartValue = cartValue + (data.quantity * data.finalPrice) })
                resolve({ cartValue, cartDetails })
            } catch (error) {
                reject(error)
            }
        })
    }
    /****** getting cart Quantity of the particular product in the cart *******/
    async gettingCartQuantity(userId, type) {
        return new Promise(async (resolve, reject) => {
            try {
                const cartKey = type == "isEcommerce" ? "ecommerceCart" : (type == "isFood" ? "foodCart" : "gameCart")
                const cartDetails = await Cart.findOne({ userId: userId }, { [cartKey]: 1 });
                if (_.isEmpty(cartDetails)) { return this.res.send({ status: 0, message: "There is no data to display" }); }
                console.log(`cartDetails: ${JSON.stringify(cartDetails)}`)
                let quantity = 0;
                const productsArray = cartDetails[cartKey]
                await productsArray.map(data => {
                    quantity += data.quantity;
                })
                resolve(quantity)
            } catch (error) {
                reject(error)
            }
        })
    }

    /********************************************************
   Purpose: Getting order summary
   Method: POST
   {
       "type": "isEcommerce" or "isFood" or "isGame",
       "couponCode":"HFPVAJKK",
       "pincode":"533287"
   }
   Authorisation: true
   Return: JSON String
   ********************************************************/
    async getOrderSummary() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send a type value" })
            }
            if (data.type == "isEcommerce" && !data.pincode) {
                return this.res.send({ status: 0, message: "Please send a pincode details" })
            }


            /****** getting cart Total *******/
            const details = await this.gettingCartTotal(userId, data.type);
            console.log(`details: ${JSON.stringify(details)}`)
            if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "There is no data to display" }); }
            const quantity = await this.gettingCartQuantity(userId, data.type);
            const userDetails = await Users.findOne({ _id: userId, isDeleted: false },
                { wallet: 1, shoppingAmount: 1, salarCoins: 1, freezingAmount: 1, _id: 0 }).lean();
            if (_.isEmpty(userDetails)) { return this.res.send({ status: 0, message: "User details not found" }); }
            /*** order summary after coupon code *******/
            let couponAmount = 0;
            if (data.couponCode) {
                const date = new Date();
                const query =
                {
                    startDate: { $lte: date },
                    endDate: { $gte: date },
                    minShoppingAmount: { $lte: details.cartValue },
                    maxShoppingAmount: { $gte: details.cartValue },
                    isDeleted: false, status: true, isCompleted: false,
                    couponCode: data.couponCode
                }
                const couponDetails = await Coupons.findOne(query,
                    { _id: 1, couponCode: 1, discount: 1, discountType: 1 });
                if (_.isEmpty(couponDetails)) {
                    return this.res.send({ status: 0, message: "Coupon details not found" });
                }
                couponAmount = couponDetails.discountType == 'Percentage' ?
                    (details.cartValue / 100) * couponDetails.discount : couponDetails.discount
                console.log(`couponAmount: ${couponAmount}`)
            }

            let data1 = {
                cartTotal: details.cartValue, quantity, shoppingAmount: userDetails.shoppingAmount,
                salarCoins: userDetails.salarCoins,
                wallet: (userDetails.wallet - userDetails.freezingAmount),
                couponAmount
            }
            if (data.type == "isEcommerce") {
                const chargesResult = await this.getShippingCharges({ details, userPincode: data.pincode });
                if (chargesResult.status == 1) {
                    data1.shippingCharges = chargesResult.data
                } else {
                    return this.res.send({ status: 0, message: "Unable to fetch shipping charges" });
                }
            }
            if (data.type == "isFood") {
                const chargesResult = await this.getPackagingAndDelieveryCharges({ details });
                if (chargesResult.status == 1) {
                    data1.packagingCharges = chargesResult.data.packagingCharges
                    data1.deliveryCharges = chargesResult.data.deliveryCharges
                } else {
                    return this.res.send({ status: 0, message: "Unable to fetch packaging and delivery charges" });
                }
            }
            return this.res.send({ status: 1, message: "Listing details are: ", data: data1 });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    async getShippingCharges({ details, userPincode }) {
        return new Promise(async (resolve, reject) => {
            try {
                let shippingCharges = 0;
                const cartDetails = details.cartDetails
                for (let i = 0; i < cartDetails.length; i++) {
                    const data = {
                        "from_pincode": cartDetails[i].storeAddress.pincode,
                        "to_pincode": userPincode,
                        "shipping_length_cms": cartDetails[i].length,
                        "shipping_width_cms": cartDetails[i].width,
                        "shipping_height_cms": cartDetails[i].height,
                        "shipping_weight_kg": cartDetails[i].weight / 1000, // converting gms into Kgs
                        "order_type": "forward",
                        "payment_method": "prepaid",
                        "product_mrp": details.cartValue
                    }
                    console.log(`ithink data: ${JSON.stringify(data)}`)
                    const ithinkController = await new IthinkController();
                    const response = await ithinkController.getRateDetails({ ithinkData: data });
                    if (response.status == 1) {
                        const requiredData = response.data.data;
                        console.log(`requiredData: ${JSON.stringify(requiredData)}`)
                        const finalData = requiredData && requiredData.length > 0 ? await requiredData.find(res => {
                            return (res.prepaid == "Y" && res.cod == "Y" && res.pickup == "Y" && res.rev_pickup == "Y")
                        }) : 0;
                        console.log(`finalData: ${JSON.stringify(finalData)}`)
                        if (finalData) {
                            shippingCharges += (finalData.rate * cartDetails[i].quantity)
                        }
                    }
                }
                resolve({ status: 1, data: shippingCharges })
            } catch (error) {
                console.log("error", error)
                resolve({ status: 0, message: "Internal server error" });
            }
        })
    }

    async getPackagingAndDelieveryCharges({ details }) {
        return new Promise(async (resolve, reject) => {
            try {
                let packagingCharges = 0, deliveryCharges = 0;
                const cartDetails = details.cartDetails
                for (let i = 0; i < cartDetails.length; i++) {
                    packagingCharges += cartDetails[i].packagingCharges * cartDetails[i].quantity;
                    deliveryCharges += cartDetails[i].deliveryCharges;
                }
                resolve({ status: 1, data: { packagingCharges, deliveryCharges } })
            } catch (error) {
                console.log("error", error)
                resolve({ status: 0, message: "Internal server error" });
            }
        })
    }
}
module.exports = CartController
