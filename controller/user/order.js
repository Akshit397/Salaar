
const _ = require("lodash");
const requestIp = require('request-ip');
const Razorpay = require("razorpay");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Orders } = require("../../models/s_orders");
const { Users } = require("../../models/s_users");
const { Cart } = require("../../models/s_cart");
const { GamesMLM, MLM, GameOrdersTracking } = require("../../models/s_game_mlm");
const { IthinkOrders } = require("../../models/s_ithink_logistics_orders");
const CartController = require('../user/cart');
const IthinkController = require('../common/ithink');

const Model = require("../../utilities/model");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const { GameProducts } = require("../../models/s_game_product");
const { Products } = require("../../models/s_products");
const { Coupons } = require("../../models/s_coupons");
const { GiftOrders } = require("../../models/s_gift_order");
const { Gifts } = require("../../models/s_gifts");

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY, // your `KEY_ID`
    key_secret: process.env.RAZORPAY_SECRET, // your `KEY_SECRET`
});

const gstStages = [
    { $lookup: { from: "gstcodes", localField: "productDetails.gstCodeId", foreignField: "_id", as: "gstCode" } },
    { $unwind: { "path": "$gstCode", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "adminsettings", localField: "productDetails.adminSettingsId", foreignField: "_id", as: "adminsettings" } },
    { $unwind: { "path": "$adminsettings", "preserveNullAndEmptyArrays": true } },
];
class OrderController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }
    /********************************************************
          Purpose: Validate sponserId of game product for order
          Method: Post
          Authorisation: true
          Parameter:
          {
               "sponserId": "",
               "gameProductId":""
           }
          Return: JSON String
          ********************************************************/
    async validateSponserId() {
        try {
            const data = this.req.body;
            if (!data.gameProductId || !data.sponserId) {
                return this.res.send({ status: 0, message: "Please send proper request params" });
            }
            const sponserAvailable = await MLM.findOne({ registerId: data.sponserId, gameProductId: data.gameProductId, levelsCompleted: false, autoRepurchase: false })
            if (_.isEmpty(sponserAvailable)) {
                return this.res.send({ status: 0, message: `Sponser with sponserId: ${data.sponserId} is not available` });
            }
            return this.res.send({ status: 1, message: "Sponser is available" });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /********************************************************
       Note: Adding shipping address  
       Purpose: for placing order from front-side
       Method: Post
       Authorisation: true
       Parameter:
       {
            "shippingAddress":{
                "name":",
                "addressLine1":"near govt hospital",
                "addressLine2":"seethanagaram",
                "city":"rajahmundry",
                "cityId":"12",
                "state":"Andhra Pradesh",
                "stateId": "2",
                "zipCode":"533287",
                "mobileNo":"7207334583",
                "landmark":"testing",
                "emailId":"attafreelancer@gmail.com",
                "countryId":"",
            }
        }
       Return: JSON String
       ********************************************************/
    async addShippingAddress() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const user = await Users.findOne({ _id: userId }, { fullName: 1, emailId: 1, registerId: 1, sponserId: 1 });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "User details not found" }); }
            /***** adding address of user to ship the order *****/
            if (!data.shippingAddress) { this.res.send({ status: 0, message: "Please send proper request params" }); }
            data['fullName'] = user.fullName;
            data['emailId'] = user.emailId;
            data['billingAddress'] = data.shippingAddress;
            data.userId = userId;
            let ord = await Orders.find()
            data.orderId = "S9897234" + (ord.length + 1);
            const { gameCart } = await Cart.findOne({ userId: userId }, { gameCart: 1 });
            for (let i = 0; i < gameCart.length; i++) {
                if (gameCart[i].sponserId) {
                    const sponserAvailable = await MLM.findOne({ registerId: gameCart[i].sponserId, gameProductId: gameCart[i].productId, levelsCompleted: false, autoRepurchase: false })
                    if (_.isEmpty(sponserAvailable)) {
                        return this.res.send({ status: 0, message: `Sponser with sponserId: ${gameCart[i].sponserId} is not available` });
                    }
                }
            }
            const newOrder = await new Model(Orders).store(data);
            if (_.isEmpty(newOrder)) { this.res.send({ status: 0, message: "Details not saved" }); }
            return this.res.send({
                status: 1, message: "Shipping details added successfully", data: newOrder
            });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /********************************************************
        Note: validate payment methods  
        Purpose: for placing order from front-side
        Method: Post
        Authorisation: true
        Parameter:
        (for razor pay)]
        {
            "orderId":"5e2033919cddb617450d3f54",
            "type": "isEcommerce" or "isFood" or "isGame",
            "paymentMethods":[ {"method": "Online", "amount": 226}]
        }
        Return: JSON String
        ********************************************************/
    async validatePaymentMethods() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const { gameCart } = await Cart.findOne({ userId: userId }, { gameCart: 1 });
            for (let i = 0; i < gameCart.length; i++) {
                if (gameCart[i].sponserId) {
                    const sponserAvailable = await MLM.findOne({ registerId: gameCart[i].sponserId, gameProductId: gameCart[i].productId, levelsCompleted: false, autoRepurchase: false })
                    if (_.isEmpty(sponserAvailable)) {
                        return this.res.send({ status: 0, message: `Sponser with sponserId: ${gameCart[i].sponserId} is not available` });
                    }
                }
            }
            const user = await Users.findOne({ _id: userId }, { fullName: 1, emailId: 1, registerId: 1, sponserId: 1 });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "User details not found" }); }
            /******* Payment process  *********/
            const fieldsArray = ["orderId", "paymentMethods", "type"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            // validating coupon details
            if (data.couponCode) {
                const couponDetails = await this.validateCouponDetails(data, userId)
                if (!couponDetails) {
                    return this.res.send({ status: 0, message: "Invalid coupon details" })
                } else {
                    data.discount = couponDetails.discount;
                }
            }
            const paymentDetails = await this.validatePaymentMethodDetails(data.paymentMethods, userId, data, this.req, this.res)
            return this.res.send(paymentDetails)

        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /********************************************************
      Note: Placing an order by verifying the payment   
      Purpose: for placing order from front-side
      Method: Post
      Authorisation: true
      Parameter:
        {
            "orderId":"5e2033919cddb617450d3f54",
            "razorPayPaymentId":"",
            "razorPaySignature":""
        }
      Return: JSON String
      ********************************************************/
    async placeOrder() {
        try {
            const userId = this.req.user;
            const data = this.req.body;
            const user = await Users.findOne({ _id: userId }, { fullName: 1, emailId: 1, registerId: 1, sponserId: 1 });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "User details not found" }); }
            const fieldsArray = ["orderId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const orderDetails = await Orders.findOne({ _id: data.orderId },
                { orderId: 1, _id: 1, razorPayOrderId: 1, type: 1, paymentMethods: 1, isOnlinePay: 1 });
            if (_.isEmpty(orderDetails)) {
                return this.res.send({ status: 0, message: "Order details not found" });
            }
            if ((orderDetails.isOnlinePay || orderDetails.isLivePay) && !data.razorPayPaymentId) {
                return this.res.send({ status: 0, message: "Please pay razor pay paymentId" });
            }
            // Need to check payment status from razorPayPaymentId
            if (data.razorPayPaymentId) {
                const payment = await rzp.payments.fetch(data.razorPayPaymentId);
                console.log(`payment: ${JSON.stringify(payment)}`)
                data.status = payment.status == 'captured' ? 'completed' : "pending";
                data.orderStatus = payment.status == 'captured' ? "paid" : ((payment.status == 'failed') ? 'failed' : 'pending')
            }
            else {
                data.status = 'completed';
                data.orderStatus = 'paid';
            }
            delete data.orderId;
            const paymentDetails = await Orders.findByIdAndUpdate({ _id: orderDetails._id }, data, { new: true, upsert: true })
            if (_.isEmpty(paymentDetails)) { return this.res.send({ status: 0, message: "Details not saved" }); }
            /******** Games mlm logic begins ******/
            if (orderDetails.type == 'isGame') {
                console.log(`****** in game logic ******`)
                data.orderId = orderDetails._id;
                this.res.send({ status: 1, message: "Order added successfully" });
                await this.gamesMlmLogic(userId, data)
            }
            /******** Games mlm logic ends ********/
            /**** Need to focus on ecommerce after phase-1 ********/
            else if (orderDetails.type == "isEcommerce") {
                // placing order in ithink logistics for shipping and tracking of the order
                const ithinkResponse = await this.placeOrderInIthinkLogistics(orderDetails._id, "forward");
                if (ithinkResponse.status_code == 200) {
                    const ithink = ithinkResponse.data['1']
                    let ithinkData = {
                        orderId: orderDetails._id,
                        ...ithink
                    }
                    const newIthinkOrder = await new Model(IthinkOrders).store(ithinkData);
                    // updating stock count for both Simple and Variant products
                    await this.updateStockOfEcommerceProducts(userId);
                    // sharing sponser commissions to users from ecommerce products purchased
                    // Need to implement this logic after return or refund is completed
                    // await this.ecommerceSponserCommisionToUser(orderDetails._id)
                    if (!_.isEmpty(newIthinkOrder)) {
                        return this.res.send({ status: 1, message: "Order added successfully", data: paymentDetails });
                    }
                } else {
                    return this.res.send({ status: 1, message: "Order is not placed due to technical issue" });
                }
            } else {
                // Need to write logic for food products
            }
        } catch (error) {
            console.log("error", error)
            if (error.statusCode == 400) {
                return this.res.send({ status: 0, message: "Failed in fetching payment details", data: error });
            }
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

    /******* validate coupon details *******/
    async validateCouponDetails(data, userId) {
        if (!data.type || !data.couponCode) {
            return this.res.send({ status: 0, message: "Please send type and couponCode" });
        }
        const cartController = await new CartController();
        const { cartValue } = await cartController.gettingCartTotal(userId, data.type)
        const date = new Date();
        const query =
        {
            startDate: { $lte: date },
            endDate: { $gte: date },
            minShoppingAmount: { $lte: cartValue },
            maxShoppingAmount: { $gte: cartValue },
            isDeleted: false, status: true, isCompleted: false,
            couponCode: data.couponCode
        }
        const couponDetails = await Coupons.findOne(query, { _id: 1, couponCode: 1, discount: 1, discountType: 1 });
        return couponDetails;
    }

    /******** games mlm logic ********/
    async gamesMlmLogic(userId, data) {
        try {
            const user = await Users.findOne({ _id: userId },
                { fullName: 1, emailId: 1, registerId: 1, sponserId: 1, countryId: 1, role: 1 });
            const orderDetails = await Orders.findOne({ _id: data.orderId },
                {
                    orderId: 1, _id: 1, razorPayOrderId: 1, type: 1, paymentMethods: 1,
                    couponCode: 1, totalAmount: 1, shippingAddress: 1, billingAddress: 1
                })
            let userQuery = {};
            let debitedDetails = {}
            const paymentMethods = orderDetails.paymentMethods;
            for (let i = 0; i < paymentMethods.length; i++) {
                if (paymentMethods[i].method != 'online') {
                    userQuery[paymentMethods[i].method] = - (paymentMethods[i].amount);
                    debitedDetails[paymentMethods[i].method] = paymentMethods[i].amount;
                }
            }
            // adding debited details game mlm begins
            if (debitedDetails && (debitedDetails.wallet || debitedDetails.salarCoins || debitedDetails.shoppingAmount)) {
                debitedDetails.type = "Debited";
                debitedDetails.registerId = user.registerId
                debitedDetails.userId = user._id;
                await new Model(GamesMLM).store(debitedDetails)
            }
            // adding debited details game mlm ends
            await Users.findOneAndUpdate({ _id: userId }, { $inc: userQuery }, { new: true, upsert: true })

            const { gameCart } = await Cart.findOne({ userId: userId }, { gameCart: 1 });
            let isSponserAvailable = false
            for (let i = 0; i < gameCart.length; i++) {
                if (gameCart[i].sponserId) {
                    const sponserAvailable = await MLM.findOne({ registerId: gameCart[i].sponserId, gameProductId: gameCart[i].productId, levelsCompleted: false, autoRepurchase: false })
                    if (!_.isEmpty(sponserAvailable)) {
                        isSponserAvailable = true
                    }
                }
                const gameProductDetails = await GameProducts.findOne(
                    { _id: gameCart[i].productId },
                    {
                        plandId: 1, levels: 1, points: 1, pointsValidity: 1,
                        sponserCommission: 1, autoRepurchaseCycle: 1, shoppingAmountCycle: 1, rewardsCycle: 1
                    },
                ).populate('planId', { width: 1, depth: 1 });
                const width = gameProductDetails.planId && gameProductDetails.planId.width ? gameProductDetails.planId.width : 1;
                const depth = gameProductDetails.planId && gameProductDetails.planId.depth ? gameProductDetails.planId.depth : 1;
                const levels = gameProductDetails.levels
                let requiredUsersCount = 0
                for (let i = 1; i <= depth; i++) {
                    requiredUsersCount += (width * (width ** (depth - i)))
                }
                console.log(`requiredUsersCount: ${requiredUsersCount}, width: ${width} and depth: ${depth}`)
                const { registerId, mlmId, updatedMlm } = await this.getUplinerId(gameCart[i].sponserId, gameCart[i].productId, isSponserAvailable)
                const mlm = {
                    gameProductId: gameCart[i].productId,
                    orderId: orderDetails._id,
                    userId: userId,
                    width: width,
                    depth: depth,
                    registerId: user.registerId,
                    uplinerId: registerId,
                    parentMlmId: mlmId,
                    orderType: "Original",
                    requiredUsersCount: requiredUsersCount
                };
                console.log(`mlm: ${JSON.stringify(mlm)}`)
                let newMLM = await new Model(MLM).store(mlm);
                // adding gift details begins
                const gifts = await Gifts.find({ gameProductId: gameCart[i].productId, isDeleted: false, status: true })
                if (!_.isEmpty(gifts)) {
                    for (let i = 0; i < gifts.length; i++) {
                        if (gifts[i].userType == 'all' || gifts[i].userType == user.role) {
                            const giftOrder = {
                                orderId: orderDetails._id,
                                userId: user._id,
                                countryId: user.countryId,
                                gameProductId: gameCart[i].productId,
                                giftOn: gifts[i].giftOn,
                                shippingAddress: orderDetails.shippingAddress,
                                billingAddress: orderDetails.billingAddress,
                                giftName: gifts[i].giftName,
                                giftId: gifts[i]._id,
                                finalPrice: gifts[i].finalPrice,
                                isApproved: gifts[i].giftOn == "OnPurchase" ? true : false,
                                isDelievered: gifts[i].type == "Portfolio" && gifts[i].giftOn == "OnPurchase" ? true : false,
                                orderStatus: gifts[i].type == "Portfolio" && gifts[i].giftOn == "OnPurchase" ? "Delievered" : "Pending"
                            };
                            const newGift = await new Model(GiftOrders).store(giftOrder);
                            console.log(`newGift: ${JSON.stringify(newGift)}`)
                        } else {
                            console.log(`no gifts for this game product: ${gameCart[i].productId}`)
                        }
                    }
                }
                // adding gift details ends
                const { bulkFlag, gameMlms } = await this.getUplinerIdOfGameProduct({
                    levels, productId: gameCart[i].productId, width,
                    depth, newMLM,
                    updatedMlm, autoRepurchaseCycle: gameProductDetails.autoRepurchaseCycle,
                    shoppingAmountCycle: gameProductDetails.shoppingAmountCycle,
                    rewardsCycle: gameProductDetails.rewardsCycle, userId,
                    totalAmount: orderDetails.totalAmount, isAutoRepurchase: false
                });
                if (bulkFlag) {
                    await new Model(GamesMLM).bulkInsert(gameMlms);
                    /***** updating user details after inserting bulk data *****/
                    for (i = 0; i < gameMlms.length; i++) {
                        await Users.updateOne(
                            { registerId: gameMlms[i].registerId },
                            {
                                $inc: {
                                    salarCoins: gameMlms[i].salarCoins,
                                    shoppingAmount: gameMlms[i].shoppingAmount,
                                    wallet: gameMlms[i].commissionAmount ? gameMlms[i].commissionAmount : 0,
                                    freezingAmount: gameMlms[i].freezingAmount,
                                }
                            }
                        )
                        const getParentMlmDetails = await MLM.findOne({ _id: gameMlms[i].mlmId, parentMlmId: { $exists: true } }, { parentMlmId: 1 })
                        if (!_.isEmpty(getParentMlmDetails)) {
                            await MLM.updateOne({ _id: getParentMlmDetails.parentMlmId }, {
                                $inc: {
                                    commissionAmountReceived: gameMlms[i].commissionAmount ? gameMlms[i].commissionAmount : 0,
                                    salarCoinsReceived: gameMlms[i].salarCoins ? gameMlms[i].salarCoins : 0,
                                    shoppingAmountReceived: gameMlms[i].shoppingAmount ? gameMlms[i].shoppingAmount : 0
                                },
                            })
                        }
                    }
                }
                // points details begins
                const date = new Date();
                const gamePoints = {
                    orderId: orderDetails._id,
                    productId: gameProductDetails._id,
                    userId: userId,
                    points: gameProductDetails.points,
                    pointsValidity: {
                        startDate: date,
                        endDate: new Date(date.setDate(date.getDate() + gameProductDetails.pointsValidity))
                    },
                    type: 'purchase',
                };
                await new Model(GameOrdersTracking).store(gamePoints);
                // points details ends
                // updating sponserCommission to users begins
                const sponserUser = await Users.findOne({ registerId: user.sponserId, isDeleted: false }, { wallet: 1 })
                if (!_.isEmpty(sponserUser)) {
                    const sponserWallet = sponserUser.wallet
                        ? sponserUser.wallet + gameProductDetails.sponserCommission
                        : gameProductDetails.sponserCommission;
                    await Users.updateOne(
                        { registerId: user.sponserId },
                        { $set: { wallet: sponserWallet } },
                        { upsert: true, new: true }
                    );
                    const gameMlms = {
                        orderId: orderDetails._id,
                        registerId: user.sponserId, // to whom we are crediting salar coins and shopping amount (uplinerId)
                        byUserId: user.registerId,
                        isAutoRepurchase: false,
                        userId: user._id,
                        sponserCommission: gameProductDetails.sponserCommission,
                    };
                    await new Model(GamesMLM).store(gameMlms)
                }
                // updating sponserCommission to users ends
                // updating coupon utilization code begins
                if (orderDetails.couponCode) {
                    const coupon = await Coupons.findOne({ couponCode: orderDetails.couponCode }, { userLimit: 1, usedBy: 1 })
                    if (coupon) {
                        const isCompleted = coupon.userLimit == coupon.usedBy + 1 ? true : false;
                        const usedBy = coupon.userLimit > coupon.usedBy ? coupon.usedBy + 1 : 1;
                        await Coupons.updateOne({ _id: coupon._id },
                            { $set: { isCompleted: isCompleted, usedBy: usedBy } },
                            { new: true, upsert: true })
                    }
                }
                // updating coupon utilization code ends
                // auto-repurchase code function begins
                const userDetails = await Users.findOne({ registerId: newMLM.uplinerId }, { _id: 1 })
                if (!_.isEmpty(userDetails)) {
                    const ordersCount = await Orders.count({
                        orderType: "Auto-Repurchase",
                        "products.productId": gameProductDetails._id,
                        userId: userDetails._id
                    });
                    const mlmOrders = await MLM.count({
                        orderType: "Original",
                        gameProductId: gameProductDetails._id,
                        userId: userDetails._id
                    });
                    const autoRepurchaseCycle = mlmOrders * gameProductDetails.autoRepurchaseCycle
                    console.log(`autoRepurchaseCycle: ${autoRepurchaseCycle} and ordersCount: ${ordersCount}`)
                    if (autoRepurchaseCycle > ordersCount) {
                        await this.autoRepurchase(width, depth, isSponserAvailable)
                    } else {
                        let mlmUsersCount = 0;
                        for (let i = 1; i <= depth; i++) {
                            mlmUsersCount += (width * (width ** (depth - i)))
                        }
                        const autoRepurchaseDetails = await MLM.aggregate([
                            { $match: { autoRepurchase: false, usersCount: { $gte: mlmUsersCount }, gameProductId: gameProductDetails._id } },
                            { $group: { _id: "$gameProductId", mlmIds: { $push: "$_id" }, orderIds: { $push: "$orderId" } } }
                        ]);
                        console.log(`autoRepurchaseDetails: ${JSON.stringify(autoRepurchaseDetails)}`)
                        if (!_.isEmpty(autoRepurchaseDetails) && autoRepurchaseDetails.length > 0) {
                            for (let x = 0; x < autoRepurchaseDetails.length; x++) {
                                await GiftOrders.updateMany(
                                    { orderId: { $in: autoRepurchaseDetails[x].orderIds }, isApproved: false },
                                    { $set: { isApproved: true } }
                                );
                                await MLM.updateMany(
                                    {
                                        userId: userId,
                                        _id: { $in: autoRepurchaseDetails[x].mlmIds },
                                        autoRepurchase: false, levelsCompleted: true
                                    },
                                    { $set: { autoRepurchase: true } },
                                    { new: true, upsert: true }
                                );
                            }
                        }
                    }
                }
                // auto-repurchase code function ends
            }
            await Cart.findOneAndUpdate({ userId: userId }, { $set: { gameCart: [] } }, { new: true, upsert: true })

        } catch (error) {
            console.log("error", error)
        }
    }
    /****** user details of auto-repurchase order*/
    async autoRepurchase(width, depth, isSponserAvailable) {
        let mlmUsersCount = 0;
        for (let i = 1; i <= depth; i++) {
            console.log(`i: ${i} and depth: ${depth} width: ${width}`)
            mlmUsersCount += (width * (width ** (depth - i)))
            console.log(`mlmUsersCount: ${mlmUsersCount}`)
        }
        console.log(`autoRepurchase mlmUsersCount: ${JSON.stringify(mlmUsersCount)}`)
        const autoRepurchaseDetails = await MLM.aggregate([
            { $match: { autoRepurchase: false, usersCount: { $gte: mlmUsersCount } } },
            { $project: { orderId: 1, userId: 1, gameProductId: 1 } }
        ]);
        console.log(`autoRepurchaseDetails: ${JSON.stringify(autoRepurchaseDetails)}`)
        for (let i = 0; i < autoRepurchaseDetails.length; i++) {
            let orderDetails = await Orders.findOne({ _id: autoRepurchaseDetails[i].orderId },
                { createdAt: 0, updateAt: 0 }).lean();
            console.log(`autoRepurchase orderDetails: ${orderDetails._id}`)
            if (!_.isEmpty(orderDetails)) {
                orderDetails.orderType = "Auto-Repurchase";
                orderDetails.isLivePay = false;
                orderDetails.isOnlinePay = false;
                orderDetails.reOrderId = orderDetails._id;
                delete orderDetails.razorPayOrderId;
                delete orderDetails.razorPayPaymentId;
                delete orderDetails.razorPaySignature;
                delete orderDetails._id;
                let finalPrice = 0
                await orderDetails.products.map(details => {
                    finalPrice += details.finalPrice
                });
                const user = await Users.findOne({ _id: autoRepurchaseDetails[i].userId, isDeleted: false, wallet: { $gte: finalPrice } })
                if (!_.isEmpty(user)) {
                    orderDetails.paymentMethods = [
                        { method: 'wallet', amount: finalPrice }
                    ]
                    let ord = await Orders.find()
                    orderDetails.orderId = "S9897234" + (ord.length + 1);
                    orderDetails.orderStatus = 'paid';
                    const newOrder = await new Model(Orders).store(orderDetails);
                    console.log(`autoRepurchase newOrder._id: ${newOrder._id}`)
                    if (!_.isEmpty(newOrder)) {
                        // updating details in mlm
                        await MLM.updateOne(
                            {
                                userId: autoRepurchaseDetails[i].userId,
                                gameProductId: autoRepurchaseDetails[i].gameProductId,
                                autoRepurchase: false, levelsCompleted: true
                            },
                            { $set: { autoRepurchase: true, autoRepurchaseCycleExists: true } },
                            { new: true, upsert: true }
                        );
                        // gifts isApproved key updation code for CompletionOfLevels begins
                        await GiftOrders.updateMany(
                            { orderId: autoRepurchaseDetails[i].orderId, isApproved: false },
                            { $set: { isApproved: true } },
                        );
                        // gifts isApproved key updation code for CompletionOfLevels ends
                        /***** logic for mlm begins ******/
                        const { products } = await Orders.findOne({ _id: newOrder._id }, { products: 1 });
                        for (let j = 0; j < products.length; j++) {
                            const productId = products[j].productId;
                            const gameProductDetails = await GameProducts.findOne(
                                { _id: products[j].productId },
                                {
                                    plandId: 1, levels: 1, autoPoints: 1, autoPointsValidity: 1,
                                    autoRepurchaseCommission: 1, autoRepurchaseCycle: 1, shoppingAmountCycle: 1, rewardsCycle: 1
                                },
                            ).populate('planId', { width: 1, depth: 1 });
                            const width = gameProductDetails.planId && gameProductDetails.planId.width ? gameProductDetails.planId.width : 1;
                            const depth = gameProductDetails.planId && gameProductDetails.planId.depth ? gameProductDetails.planId.depth : 1;
                            const levels = gameProductDetails.levels
                            let requiredUsersCount = 0
                            for (let i = 1; i <= depth; i++) {
                                requiredUsersCount += (width * (width ** (depth - i)))
                            }
                            console.log(`requiredUsersCount: ${requiredUsersCount}, width: ${width} and depth: ${depth}`)
                            const { registerId, mlmId, updatedMlm } = await this.getUplinerId(undefined, products[j].productId, isSponserAvailable)
                            const mlm = {
                                gameProductId: products[j].productId,
                                orderId: newOrder._id,
                                userId: autoRepurchaseDetails[i].userId,
                                width: width,
                                depth: depth,
                                registerId: user.registerId,
                                uplinerId: registerId,
                                parentMlmId: mlmId,
                                orderType: "Auto-Repurchase",
                                requiredUsersCount: requiredUsersCount
                            };
                            const newMLM = await new Model(MLM).store(mlm);
                            const { bulkFlag, gameMlms } = await this.getUplinerIdOfGameProduct({
                                levels, productId: products[j].productId, width, depth, newMLM,
                                updatedMlm, autoRepurchaseCycle: gameProductDetails.autoRepurchaseCycle,
                                shoppingAmountCycle: gameProductDetails.shoppingAmountCycle,
                                rewardsCycle: gameProductDetails.rewardsCycle, userId: autoRepurchaseDetails[i].userId,
                                totalAmount: orderDetails.totalAmount, isAutoRepurchase: true
                            });
                            if (bulkFlag) {
                                await new Model(GamesMLM).bulkInsert(gameMlms);
                                /***** updating user details after inserting bulk data *****/
                                for (let s = 0; s < gameMlms.length; s++) {
                                    await Users.updateOne(
                                        { registerId: gameMlms[s].registerId },
                                        {
                                            $inc: {
                                                salarCoins: gameMlms[s].salarCoins,
                                                shoppingAmount: gameMlms[s].shoppingAmount,
                                                wallet: gameMlms[s].commissionAmount ? gameMlms[s].commissionAmount : 0,
                                                freezingAmount: gameMlms[s].freezingAmount,
                                            }
                                        }
                                    );
                                    const getParentMlmDetails = await MLM.findOne({ _id: gameMlms[i].mlmId, parentMlmId: { $exists: true } }, { parentMlmId: 1 })
                                    if (!_.isEmpty(getParentMlmDetails)) {
                                        await MLM.updateOne({ _id: getParentMlmDetails.parentMlmId }, {
                                            $inc: {
                                                commissionAmountReceived: gameMlms[i].commissionAmount ? gameMlms[i].commissionAmount : 0,
                                                salarCoinsReceived: gameMlms[i].salarCoins ? gameMlms[i].salarCoins : 0,
                                                shoppingAmountReceived: gameMlms[i].shoppingAmount ? gameMlms[i].shoppingAmount : 0
                                            },
                                        })
                                    }
                                }
                            }
                            console.log(`autoRepurchaseDetails[i].userId: ${JSON.stringify(autoRepurchaseDetails[i])}`)
                            const userDetails = await Users.findOne({ _id: autoRepurchaseDetails[i].userId },
                                { fullName: 1, emailId: 1, registerId: 1, sponserId: 1 });
                            console.log(`autoRepurchase userDetails: ${JSON.stringify(userDetails)}`)
                            if (_.isEmpty(userDetails)) { return this.res.send({ status: 0, message: "User details not found" }); }
                            // points details begins
                            const date = new Date();
                            const gamePoints = {
                                orderId: newOrder._id,
                                productId: productId,
                                userId: userDetails._id,
                                points: gameProductDetails.autoPoints,
                                pointsValidity: {
                                    startDate: date,
                                    endDate: new Date(date.setDate(date.getDate() + gameProductDetails.autoPointsValidity))
                                },
                                type: 'autoPurchase',
                            };
                            await new Model(GameOrdersTracking).store(gamePoints);
                            // points details ends

                            // updating sponserCommission to users begins
                            const sponserUser = await Users.findOne({ registerId: userDetails.sponserId, isDeleted: false },
                                { wallet: 1 });
                            if (!_.isEmpty(sponserUser)) {
                                const sponserWallet = sponserUser.wallet
                                    ? sponserUser.wallet + gameProductDetails.autoRepurchaseCommission
                                    : gameProductDetails.autoRepurchaseCommission;
                                await Users.updateOne(
                                    { registerId: userDetails.sponserId },
                                    { $set: { wallet: sponserWallet } },
                                    { upsert: true, new: true }
                                );
                                const gameMlms = {
                                    orderId: newOrder._id,
                                    registerId: user.sponserId, // to whom we are crediting salar coins and shopping amount (uplinerId)
                                    byUserId: user.registerId,
                                    userId: user._id,
                                    isAutoRepurchase: true,
                                    sponserCommission: gameProductDetails.autoRepurchaseCommission,
                                };
                                await new Model(GamesMLM).store(gameMlms)
                            }
                            // updating sponserCommission to users ends
                            await Users.findOneAndUpdate({ _id: autoRepurchaseDetails[i].userId }, { $inc: { wallet: -(finalPrice) } }, { new: true, upsert: true })
                            // auto-repurchase code function begins
                            const userDetails1 = await Users.findOne({ registerId: newMLM.uplinerId }, { _id: 1 })
                            if (!_.isEmpty(userDetails1)) {
                                const ordersCount = await Orders.count({
                                    orderType: "Auto-Repurchase",
                                    "products.productId": gameProductDetails._id,
                                    userId: userDetails1._id
                                });
                                const mlmOrders = await MLM.count({
                                    orderType: "Original",
                                    gameProductId: gameProductDetails._id,
                                    userId: userDetails1._id
                                });
                                const autoRepurchaseCycle = mlmOrders * gameProductDetails.autoRepurchaseCycle
                                console.log(`autoRepurchase autoRepurchaseCycle: ${autoRepurchaseCycle} and ordersCount: ${ordersCount}`)
                                if (autoRepurchaseCycle > ordersCount) {
                                    await this.autoRepurchase(width, depth, isSponserAvailable)
                                } else {
                                    let mlmUsersCount = 0;
                                    for (let i = 1; i <= depth; i++) {
                                        mlmUsersCount += (width * (width ** (depth - i)))
                                    }
                                    const autoRepurchaseDetails = await MLM.aggregate([
                                        { $match: { autoRepurchase: false, usersCount: { $gte: mlmUsersCount }, gameProductId: gameProductDetails._id } },
                                        { $group: { _id: "$gameProductId", mlmIds: { $push: "$_id" }, orderIds: { $push: "$orderId" } } }
                                    ]);
                                    console.log(`autoRepurchase autoRepurchaseDetails: ${JSON.stringify(autoRepurchaseDetails)}`)
                                    if (!_.isEmpty(autoRepurchaseDetails) && autoRepurchaseDetails.length > 0) {
                                        for (let x = 0; x < autoRepurchaseDetails.length; x++) {
                                            await GiftOrders.updateMany(
                                                { orderId: { $in: autoRepurchaseDetails[x].orderIds }, isApproved: false },
                                                { $set: { isApproved: true } },
                                            );
                                            await MLM.updateMany(
                                                {
                                                    _id: { $in: autoRepurchaseDetails[x].mlmIds },
                                                    autoRepurchase: false, levelsCompleted: true
                                                },
                                                { $set: { autoRepurchase: true } },
                                                { new: true, upsert: true }
                                            );
                                        }
                                    }
                                }
                            }
                            // auto-repurchase code function ends
                        }
                        /***** logic for mlm ends ******/
                    }
                }
            } else {
                console.log(`Order details not found`)
            }
        }
    }

    /******** sharing sponser commission to users ******/
    async ecommerceSponserCommisionToUser(orderId) {
        const { products } = await Orders.findOne({ _id: orderId }, { products: 1 })
        if (_.isEmpty(products)) { return this.res.send({ status: 0, message: "Order details not found" }); }
        for (let i = 0; i < products.length; i++) {
            const { sponserCommission } = await Products.findOne({ _id: products[i].productId }, { sponserCommission: 1 })
            const { uplinerId } = await Users.findOne({ _id: products[i].userId }, { uplinerId: 1 })
            if (sponserCommission > 0) {
                // Need to implement logic for sponser commission history
                await Users.findOneAndUpdate({ registerId: uplinerId }, { $inc: { wallet: sponserCommission * 1 } })
            }
        }
    }

    /***** Updating ecommerce products stock  ******/
    async updateStockOfEcommerceProducts(userId) {
        const { ecommerceCart } = await Cart.findOne({ userId: userId }, { ecommerceCart: 1 });
        for (let i = 0; i < ecommerceCart.length; i++) {
            if (ecommerceCart[i].productType == 'Simple') {
                await Products.findOneAndUpdate({ _id: ecommerceCart[i].productId }, { $inc: { stock: ecommerceCart[i].quantity * -1 } })
            } else {
                await Products.findOneAndUpdate({
                    _id: ecommerceCart[i].productId,
                },
                    { $inc: { "attributes.$[e1].values.$[e2].stock": ecommerceCart[i].quantity * -1 } },
                    {
                        arrayFilters: [
                            { "e1._id": ecommerceCart[i].attributeId },
                            { "e2._id": ecommerceCart[i].sizeId },
                        ]
                    }
                )
            }
        }
    }
    /****** getting date in a dd-mm-yyyy format */
    async getDateFormat(date) {
        try {
            const objectDate = new Date(date);
            const day = objectDate.getDate();
            const month = objectDate.getMonth();
            const year = objectDate.getFullYear();
            console.log(`date format: ${`${day}-${month}-${year}`}`)
            return `${day}-${month}-${year}`
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
    /******* placing order in ithink logistics
     * Need to finalize this code
     *  ********/
    async placeOrderInIthinkLogistics(orderId, orderType) {
        const orderDetails = await Orders.findOne({ _id: orderId })
            .populate(`shippingAddress.countryId`, { name: 1 })
            .populate(`billingAddress.countryId`, { name: 1 })
        if (_.isEmpty(orderDetails)) { return this.res.send({ status: 0, message: "Order details not found" }); }
        let finalProducts = []
        orderDetails.products && orderDetails.products.length > 0 &&
            await orderDetails.products.map(res => {
                const obj = {
                    "product_name": res.productName,
                    // "product_sku": "GC001-1", 
                    "product_quantity": res.quantity,
                    "product_price": res.finalPrice,
                    // "product_tax_rate": "5",
                    // "product_hsn_code": "91308",
                    // "product_discount": "0"
                }
                finalProducts.push(obj)
            })
        const finalData = {
            "shipments": [{
                "waybill": "",
                "order": orderDetails.orderId,
                "sub_order": "",
                "order_date": await this.getDateFormat(orderDetails.createdAt),
                "total_amount": orderDetails.totalAmount,
                "name": orderDetails.shippingAddress.name,
                "company_name": "",
                "add": orderDetails.shippingAddress.addressLine1,
                "add2": orderDetails.shippingAddress.addressLine2,
                "add3": "",
                "pin": orderDetails.shippingAddress.zipCode,
                "city": orderDetails.shippingAddress.city,
                "state": orderDetails.shippingAddress.state,
                "country": orderDetails.shippingAddress.countryId.name,
                "phone": orderDetails.shippingAddress.mobileNo,
                "alt_phone": "",
                "email": orderDetails.shippingAddress.emailId,
                "is_billing_same_as_shipping": "no",
                "billing_name": orderDetails.billingAddress.name,
                "billing_company_name": "",
                "billing_add": orderDetails.billingAddress.addressLine1,
                "billing_add2": orderDetails.billingAddress.addressLine2,
                "billing_add3": "",
                "billing_pin": orderDetails.billingAddress.zipCode,
                "billing_city": orderDetails.billingAddress.city,
                "billing_state": orderDetails.billingAddress.state,
                "billing_country": orderDetails.billingAddress.countryId.name,
                "billing_phone": orderDetails.billingAddress.mobileNo,
                "billing_alt_phone": "",
                "billing_email": orderDetails.billingAddress.emailId,
                "products": finalProducts,
                "shipment_length": "10", // max value of the products
                "shipment_width": "10",// max value of the products
                "shipment_height": "5",// max value of the products
                "weight": "40", // adding product weight
                "shipping_charges": orderDetails.shippingCharges,
                "giftwrap_charges": "0",
                "transaction_charges": "0",
                "total_discount": "0",
                "first_attemp_discount": "0",
                "cod_charges": "0",
                "advance_amount": "0",
                "cod_amount": "300",
                "payment_mode": "COD", // Prepaid
                "reseller_name": "",
                "eway_bill_number": "",
                "gst_number": "",
                "return_address_id": "2370",
                "api_source": "0",
                "store_id": "2370"
            }],
            "pickup_address_id": "2370",
            "logistics": "",
            "s_type": "",
            "order_type": orderType
        }
        // console.log(`finalData: ${JSON.stringify(finalData)}`)
        const ithinkController = await new IthinkController();
        const response = await ithinkController.placeOrder({ ithinkData: finalData });
        console.log(`response: ${JSON.stringify(response)} `)
        return response.data;
    }
    /****** getting UplinerId ********/
    async getUplinerId(sponserId, productId, isSponserAvailable) {
        const filter = isSponserAvailable ? { registerId: sponserId } : {}
        const mlm = await MLM.findOne({ levelsCompleted: false, autoRepurchase: false, ...filter, gameProductId: productId }).sort({ _id: 1 });
        if (!_.isEmpty(mlm)) {
            const registerId = mlm && mlm.registerId ? mlm.registerId : "";
            const mlmId = mlm && mlm._id ? mlm._id : null
            let data = {}
            data.count = mlm.count ? (mlm.count) : 0;
            data.count += 1
            data.usersCount = mlm.usersCount ? (mlm.usersCount) : 0;
            data.usersCount += 1
            data.levelsCompleted = false;
            if (data.count == mlm.width) {
                data.levelsCompleted = true;
            }
            const updatedMlm = await MLM.findOneAndUpdate({ _id: mlm._id, autoRepurchase: false }, data, { new: true, upsert: true });
            return { registerId, mlmId, updatedMlm };
        } else {
            return { registerId: "" }
        }
    }

    async getUplinerIdOfGameProduct({
        levels, productId, width, depth, newMLM, updatedMlm, autoRepurchaseCycle,
        shoppingAmountCycle, rewardsCycle, userId, totalAmount, isAutoRepurchase
    }) {
        let gameMlms = []; let mlmIds = []; // involved in team tree 
        let bulkFlag = false;
        const freezingLevelBeginsFrom = depth > 1 ? width * (width ** (depth - 2)) : 0;
        const freezingAmount = Math.ceil(totalAmount / width * (width ** (depth - 1)));
        let mlmCount = await MLM.count({ gameProductId: productId });
        if (mlmCount == 0) {
            return { bulkFlag };
        } else {
            const filter = updatedMlm && updatedMlm._id ? { _id: updatedMlm._id } : {};
            let query = {
                autoRepurchase: false, gameProductId: productId,
                $and: [{ _id: { $ne: newMLM._id } }, filter]
            }
            // used to find auto-repurchase cycle count
            const ordersCount = await Orders.count({
                orderType: "Auto-Repurchase",
                "products.productId": productId,
                userId: userId
            });
            for (let i = 0; i < levels.length; i++) {
                let presentLevelRegisterIds = []
                const { level, salarCoins, shoppingAmount, commissionAmount } = levels[i];
                const latestSalarCoins = autoRepurchaseCycle > ordersCount && autoRepurchaseCycle >= rewardsCycle ?
                    salarCoins : 0;
                const latestShoppingAmount = autoRepurchaseCycle > ordersCount && autoRepurchaseCycle >= shoppingAmountCycle ?
                    shoppingAmount : 0;
                let mlmDetails;
                mlmDetails = await MLM.findOne(query).sort({ _id: 1 });
                console.log(`query: ${JSON.stringify(query)}`)
                console.log(`ordersCount: ${JSON.stringify(ordersCount)}`)
                console.log(`mlmDetails: ${JSON.stringify(mlmDetails)}`)
                if (!_.isEmpty(mlmDetails)) {
                    query = {
                        registerId: mlmDetails.uplinerId,
                        gameProductId: productId
                    }
                    await gameMlms.push({
                        mlmId: newMLM._id,
                        orderId: newMLM.orderId,
                        registerId: mlmDetails.registerId,
                        byUserId: newMLM.registerId,
                        level, salarCoins: latestSalarCoins,
                        shoppingAmount: latestShoppingAmount,
                        commissionAmount,
                        isAutoRepurchase: isAutoRepurchase,
                        freezingAmount: mlmDetails.usersCount > freezingLevelBeginsFrom ? freezingAmount : 0,
                        createdAt: new Date(), updatedAt: new Date(),
                        type: "Credited",
                        userId: userId
                    });
                } else {
                    if (i == 0 && updatedMlm) {
                        mlmDetails = await MLM.findOne({
                            levelsCompleted: true,
                            gameProductId: productId,
                            $and: [{ _id: { $ne: newMLM._id } }, filter]
                        }, { registerId: 1, usersCount: 1 }).sort({ _id: 1 });
                        console.log(`mlmDetails 2: ${JSON.stringify(mlmDetails)} `);
                        // Need to change logic here
                        if (!_.isEmpty(mlmDetails)) {
                            await gameMlms.push({
                                mlmId: newMLM._id,
                                orderId: newMLM.orderId,
                                registerId: mlmDetails.registerId,
                                byUserId: newMLM.registerId,
                                isAutoRepurchase: isAutoRepurchase,
                                level, salarCoins: latestSalarCoins, shoppingAmount: latestShoppingAmount,
                                commissionAmount, freezingAmount: mlmDetails.usersCount >= freezingLevelBeginsFrom ? freezingAmount : 0
                            });
                        }
                    }
                }
                // updating count in mlms table for mlm tree
                if (mlmDetails && mlmDetails.parentMlmId) {
                    presentLevelRegisterIds.push(mlmDetails.parentMlmId)
                }
                if (presentLevelRegisterIds.length > 0) {
                    const registeredMLM = await MLM.find({ _id: { $in: presentLevelRegisterIds }, autoRepurchase: false });
                    presentLevelRegisterIds = registeredMLM && registeredMLM.length > 0 ?
                        await registeredMLM.map(register => {
                            return register._id
                        }) : [];
                    console.log(`presentLevelRegisterIds: ${JSON.stringify(presentLevelRegisterIds)}`)
                    mlmIds.push(...presentLevelRegisterIds);
                }
            }
            mlmIds = mlmIds.filter(e => e);
            // updating count in mlm table
            if (mlmIds && mlmIds.length > 0) {
                await MLM.updateMany({ _id: { $in: mlmIds }, autoRepurchase: false }, { $inc: { usersCount: 1 } }, { upsert: true, new: true })
            }
            if (gameMlms && gameMlms.length > 0) {
                bulkFlag = true;
            }
            return { gameMlms, bulkFlag };
        }
    }

    /******* razor pay payment process includes in this method  ********/
    async paymentProcess(value, userId, onlinePayAmount, isOnlinePay, req, res) {
        return new Promise(async (resolve, reject) => {
            try {
                const { cartValue, cartDetails } = await this.gettingCartProducts(userId, value.type);
                let amount = cartValue;
                /****** Checking stock of the product *****/
                if (value.type == "isEcommerce") {
                    const noStockItems = await cartDetails.find((product) => {
                        return product.stock == false
                    })
                    if (noStockItems && noStockItems.length > 0) {
                        resolve({ status: 0, message: "Products are out of stock", data: { products: noStockItems } });
                    }
                }
                /***** Getting count of the products in an order ******/
                let count = 0
                await cartDetails.map((cart) => {
                    count = count + cart.quantity
                });

                const orderDetails = await Orders.findOne({ _id: value.orderId }, { orderId: 1, _id: 1, shippingAddress: 1 })
                if (_.isEmpty(orderDetails)) { resolve({ status: 0, message: "Order details not found" }); }
                // for getting ip address of other's/request's pc
                const ipAddress = await requestIp.getClientIp(req)
                let data = value;
                data.orderStatus = 'pending'
                data.products = cartDetails
                data.count = count
                data.type = value.type;
                data.ipAddress = (ipAddress) ? ipAddress : 0
                data.discount = data.discount ? data.discount : 0;
                data.commission = 0;
                data.shippingCharges = 0;
                /****** adding shipping charges to the total amount *******/
                const cartController = await new CartController();
                if (value.type == "isEcommerce") {
                    const chargesResult = await cartController.getShippingCharges({
                        details: { cartValue, cartDetails },
                        userPincode: orderDetails.shippingAddress.zipCode
                    });
                    console.log(`chargesResult: ${JSON.stringify(chargesResult)} `)
                    if (chargesResult.status == 1) {
                        data.shippingCharges = chargesResult.data
                    } else {
                        resolve({ status: 0, message: "Unable to fetch shipping charges" });
                    }
                }
                /****** adding packaging and delivery charges to the total amount *******/
                if (value.type == "isFood") {
                    const chargesResult = await cartController.getPackagingAndDelieveryCharges({ details: { cartValue, cartDetails } });
                    if (chargesResult.status == 1) {
                        data.packagingCharges = chargesResult.data.packagingCharges
                        data.deliveryCharges = chargesResult.data.deliveryCharges
                    } else {
                        resolve({ status: 0, message: "Unable to fetch packaging and delivery charges" });
                    }
                }
                data.totalAmount = value.type == "isGame" ? amount :
                    (value.type == "isEcommerce" ? amount + data.shippingCharges :
                        amount + data.packagingCharges + data.deliveryCharges);
                // need to implement logic for shipping cost
                if (isOnlinePay) {
                    const razorPayInput = {
                        "amount": onlinePayAmount * 100,
                        "currency": "INR",
                        "receipt": orderDetails.orderId, // salar orderId autogenerated in orders
                        "notes": {
                            "orderId": orderDetails._id, // salar _id of orders
                        }
                    }
                    console.log(`razorPayInput: ${JSON.stringify(razorPayInput)} `)
                    /****** Razor pay payment begins *******/
                    const razorOrder = await rzp.orders.create(razorPayInput);
                    console.log(`razorOrder: ${JSON.stringify(razorOrder)}`)
                    if (_.isEmpty(razorOrder)) {
                        return this.res.send({
                            status: 0,
                            message: "razorpay create order failed",
                        });
                    }
                    console.log(`razorOrder: ${JSON.stringify(razorOrder)} `);
                    data.razorPayOrderId = razorOrder.id
                }
                /********* Razor pay payment ends  *******/
                delete data.orderId;
                const paymentDetails = await Orders.findByIdAndUpdate({ _id: orderDetails._id }, data, { upsert: true, new: true })
                if (_.isEmpty(paymentDetails)) { resolve({ status: 0, message: "Details not saved" }); }
                resolve({ status: 1, message: "Payment details added successfully", data: paymentDetails });
                // Need to remove products from the cart
            } catch (error) {
                console.log("error", error)
                reject({ status: 0, message: "Internal server error" })
            }
        });
    }

    /************** Validating payment method details **************/
    async validatePaymentMethodDetails(paymentMethods, userId, data, req, res) {
        return new Promise(async (resolve, reject) => {
            try {
                const userDetails = await Users.findOne({ _id: userId, isDeleted: false }, { freezingAmount: 1 })
                const freezingAmount = userDetails && userDetails.freezingAmount ? userDetails.freezingAmount : 0;
                let totalAmount = 0;
                let onlinePayAmount = 0; let methodsAvailable = []; let isOnlinePay = false;
                for (let i = 0; i < paymentMethods.length; i++) {
                    if (paymentMethods[i].method == 'wallet') {
                        const walletAmount = paymentMethods[i].amount + freezingAmount;
                        console.log(`walletAmount: ${walletAmount}`)
                        const user = await Users.findOne({ _id: userId, isDeleted: false, wallet: { $gte: walletAmount } })
                        if (_.isEmpty(user)) {
                            resolve({ status: 0, message: `There is no enough balance in the wallet to place the order` });
                            break;
                        }
                        totalAmount += paymentMethods[i].amount
                        methodsAvailable.push(paymentMethods[i].method)
                    }
                    if (paymentMethods[i].method == 'shoppingAmount') {
                        const user = await Users.findOne({ _id: userId, isDeleted: false, shoppingAmount: { $gte: paymentMethods[i].amount } })
                        if (_.isEmpty(user)) {
                            resolve({ status: 0, message: `There is no enough balance in the shopping Amount to place the order` });
                            break;
                        }
                        totalAmount += paymentMethods[i].amount
                        methodsAvailable.push(paymentMethods[i].method)
                    }
                    if (paymentMethods[i].method == 'salarCoins') {
                        const user = await Users.findOne({ _id: userId, isDeleted: false, salarCoins: { $gte: paymentMethods[i].amount } })
                        if (_.isEmpty(user)) {
                            resolve({ status: 0, message: `There is no enough balance in the salar coins to place the order` });
                            break;
                        }
                        totalAmount += paymentMethods[i].amount
                        methodsAvailable.push(paymentMethods[i].method)
                    }
                    if (paymentMethods[i].method == 'online' || paymentMethods[i].method == 'livePay') {
                        onlinePayAmount = paymentMethods[i].amount
                        totalAmount += paymentMethods[i].amount
                        methodsAvailable.push(paymentMethods[i].method)
                        isOnlinePay = true
                    }
                    if (paymentMethods[i].method == 'coupon') {
                        onlinePayAmount = paymentMethods[i].amount
                        totalAmount += paymentMethods[i].amount
                        methodsAvailable.push(paymentMethods[i].method)
                    }

                }
                if (methodsAvailable.length != paymentMethods.length) {
                    resolve({ status: 0, message: `Please select proper payment method` });
                }
                // console.log(`totalAmount: ${totalAmount}`);
                const { cartValue } = await this.gettingCartProducts(userId, data.type);
                // console.log(`cartValue: ${cartValue}`);

                if (cartValue > totalAmount) {
                    resolve({ status: 0, message: `Please send full amount to place an order` });
                }
                const paymentDetails = await this.paymentProcess(data, userId, onlinePayAmount, isOnlinePay, req, res)
                resolve(paymentDetails)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**** Getting cart total ******/
    async gettingCartProducts(userId, type) {
        return new Promise(async (resolve, reject) => {
            try {
                const cartKey = type == "isEcommerce" ? "ecommerceCart" : (type == "isFood" ? "foodCart" : "gameCart")
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
                            }, ecommerceCart: 1, gst: "$gstCode.gst", adminsettings: 1, sku: "$productDetails.sku",
                            sellerName: "$seller.fullName", sellerEmailId: "$seller.emailId",
                            brandName: "$brand.name",
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
                            otherTaxes: "$productDetails.otherTaxes", gst: 1, discount: "$productDetails.discount",
                            length: "$productDetails.length",
                            width: "$productDetails.width",
                            height: "$productDetails.height",
                            weight: "$productDetails.weight",
                            attributeId: "$ecommerceCart.attributeId",
                            valueId: "$ecommerceCart.sizeId",
                            productId: "$ecommerceCart.productId",
                            sellerId: "$productDetails.sellerId",
                            sellerName: 1, sellerEmailId: 1, brandName: 1,
                            name: "$productDetails.name", productImage: "$productDetails.productImage",
                            customUrl: "$productDetails.customUrl", productId: "$productDetails._id",
                            stock: {
                                $cond: {
                                    if: { $eq: ["$productDetails.productType", "Variant"] },
                                    then: "$productDetails.attributes.values.stock", else: "$productDetails.stock"
                                }
                            }, quantity: `$${cartKey}.quantity`,
                            productType: `$${cartKey}.productType`,
                            size: "$productDetails.attributes.values.size", color: "$productDetails.attributes.color", adminsettings: 1,
                            returnDays: "$productDetails.returnDays", replacementAvailability: "$productDetails.replacementAvailability"
                        }
                    },
                    {
                        $project: {
                            price: {
                                $sum: ["$unitPrice", "$otherTaxes"]
                            }, discount: 1,
                            adminsettings: 1, sellerName: 1, sellerEmailId: 1, brandName: 1, sku: 1,
                            name: 1, productImage: 1, productId: 1, unitPrice: 1, otherTaxes: 1, length: 1, width: 1, weight: 1,
                            height: 1, sellerId: 1, attributeId: 1, valueId: 1, productId: 1, gst: 1,
                            customUrl: 1, stock: {
                                $cond: { if: { $gte: ["$stock", `$quantity`] }, then: true, else: false }
                            }, quantity: 1, productType: 1, size: 1, color: 1, returnDays: 1, replacementAvailability: 1
                        }
                    },
                    {
                        $project: {
                            discountPrice: {
                                $multiply: [{
                                    $divide: ["$discount", 100]
                                }, "$price"]
                            }, discount: 1, price: 1, gst: 1,
                            adminsettings: 1, sellerName: 1, sellerEmailId: 1, brandName: 1, sku: 1,
                            name: 1, productImage: 1, productId: 1, unitPrice: 1, otherTaxes: 1, length: 1, width: 1, weight: 1,
                            height: 1, sellerId: 1, attributeId: 1, valueId: 1, productId: 1,
                            gstAmount: {
                                $multiply: [{
                                    $divide: ["$gst", 100]
                                }, "$price"]
                            },
                            customUrl: 1, stock: 1, quantity: 1, productType: 1, size: 1,
                            color: 1, returnDays: 1, replacementAvailability: 1
                        }
                    },
                    {
                        $project: {
                            finalPrice: { $subtract: ["$price", "$discountPrice"] }, price: 1,
                            discountPrice: 1, discount: 1, gst: 1,
                            adminsettings: 1, sellerName: 1, sellerEmailId: 1, brandName: 1, sku: 1,
                            name: 1, productImage: 1, productId: 1, unitPrice: 1, otherTaxes: 1, length: 1, width: 1, weight: 1,
                            height: 1, sellerId: 1, attributeId: 1, valueId: 1, productId: 1,
                            gstAmount: 1, customUrl: 1, stock: 1, quantity: 1, productType: 1, size: 1, color: 1, returnDays: 1, replacementAvailability: 1
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
                            sellerName: 1, sellerEmailId: 1, brandName: 1, sku: 1,
                            name: 1, productImage: 1, productId: 1, unitPrice: 1, otherTaxes: 1, length: 1, width: 1, weight: 1,
                            height: 1, sellerId: 1, attributeId: 1, valueId: 1, productId: 1,
                            gstAmount: 1, customUrl: 1, stock: 1, quantity: 1, productType: 1, size: 1, color: 1, returnDays: 1, replacementAvailability: 1
                        }
                    },
                    { $lookup: { from: "stores", localField: `sellerId`, foreignField: "sellerId", as: "store" } },
                    { $unwind: { path: "$store" } },
                    {
                        $project: {
                            finalPrice: 1, totalPrice: 1, discountPrice: 1, discount: 1, price: 1, storeAddress: "$store.storeAddress", length: 1, width: 1, weight: 1, height: 1,
                            sku: 1, unitPrice: 1, otherTaxes: 1, gstAmount: 1, sellerId: 1,
                            productName: 1, productImage: 1, productId: 1, sellerName: 1, sellerEmailId: 1, brandName: 1,
                            customUrl: 1, stock: 1, quantity: 1, productType: 1, attributeId: 1, productId: 1, valueId: 1, size: 1, color: 1,
                            returnDays: 1, replacementAvailability: 1, userId: userId
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
                            gstAmount: {
                                $multiply: [{
                                    $divide: ["$gstCode.gst", 100]
                                }, "$productDetails.unitPrice"]
                            },
                            adminsettings: 1, unitPrice: "$productDetails.unitPrice",
                            otherTaxes: "$productDetails.otherTaxes",
                            sellerName: "$seller.fullName", sellerEmailId: "$seller.emailId",
                            brandName: "$brand.name", sku: "$productDetails.sku",
                            name: "$productDetails.name", productImage: "$productDetails.productImage",
                            customUrl: "$productDetails.customUrl", productId: "$productDetails._id",
                            stock: "$productDetails.availability", quantity: `$${cartKey}.quantity`,
                            packagingCharges: "$productDetails.packagingCharges",
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
                            }, unitPrice: 1, otherTaxes: 1, gstAmount: 1,
                            sellerName: 1, sellerEmailId: 1, brandName: 1, sku: 1,
                            productName: "$name", productImage: 1, customUrl: 1,
                            customUrl: 1, stock: 1, quantity: 1, productType: "Simple",
                            packagingCharges: 1, deliveryCharges: 1,
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
                            transactionFee: {
                                $multiply: [{
                                    $divide: ["$adminsettings.transactionFeeLocal", 100]
                                }, "$productDetails.finalPrice"]
                            },
                            unitPrice: 1, gstAmount: 1, otherTaxes: 1,
                            productName: "$productDetails.name",
                            description: "$productDetails.description",
                            productImage: "$productDetails.image",
                            productId: "$productDetails._id",
                            product_id: "$productDetails.productId",
                            quantity: `$${cartKey}.quantity`,
                            productType: `Simple`, sku: 1,
                            customUrl: "$productDetails.customUrl",
                            unitPrice: "$productDetails.unitPrice",
                            gstPercentage: "$productDetails.gstPercentage",
                            gstAmount: "$productDetails.gstAmount",
                            otherTaxes: "$productDetails.otherTaxes",
                            sellerName: "S World Solutions Private Limited", sellerEmailId: "", brandName: "",
                            stock: { $toBool: "true" }
                        }
                    }
                ]
                const projectData = type == "isEcommerce" ? ecomProductsProjection :
                    (type == "isFood" ? foodProductsProjection : gameProductsProjection)
                const ecomProductsStages = [
                    { $lookup: { from: "products", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails", "preserveNullAndEmptyArrays": true } },
                    { $lookup: { from: "sellers", localField: `productDetails.sellerId`, foreignField: "_id", as: "seller" } },
                    { $unwind: { path: "$seller", "preserveNullAndEmptyArrays": true } },
                    { $lookup: { from: "brands", localField: `productDetails.brandId`, foreignField: "_id", as: "brand" } },
                    { $unwind: { path: "$brand", "preserveNullAndEmptyArrays": true } },
                ]
                const foodProductsStages = [
                    { $lookup: { from: "foodproducts", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails", "preserveNullAndEmptyArrays": true } },
                    { $lookup: { from: "sellers", localField: `productDetails.sellerId`, foreignField: "_id", as: "seller" } },
                    { $unwind: { path: "$seller", "preserveNullAndEmptyArrays": true } },
                    { $lookup: { from: "brands", localField: `productDetails.brandId`, foreignField: "_id", as: "brand" } },
                    { $unwind: { path: "$brand", "preserveNullAndEmptyArrays": true } },
                ]
                const gameProductsStages = [
                    { $lookup: { from: "gameproducts", localField: `${cartKey}.productId`, foreignField: "_id", as: "productDetails" } },
                    { $unwind: { path: "$productDetails", "preserveNullAndEmptyArrays": true } },
                ]
                const stages = type == "isEcommerce" ? ecomProductsStages :
                    (type == "isFood" ? foodProductsStages : gameProductsStages);
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

    /********************************************************
    Purpose: for getting user Address
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getUserAddress() {
        try {
            let responseAddress;
            let user = await Users.findOne({ _id: this.req.user });
            if (_.isEmpty(user)) { return this.res.send({ status: 0, message: "Details not found" }); }
            user.shippingAddresses.map((data1, key) => {
                if (key == 0) { responseAddress = data1 }
                if (data1.defaultAddress === true) { responseAddress = data1 }
            })
            if (_.isEmpty(responseAddress)) { return this.res.send({ status: 0, message: "Details not found" }); }
            return this.res.send({ status: 1, message: "Details are: ", data: responseAddress });
        } catch (error) {
            console.log(`error: ${error} `)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: getting order tracking details
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getOrderTrackingDetails() {
        try {
            const data = this.req.params;
            if (!data.orderId) { return this.res.send({ status: 0, message: "Please send orderId" }); }
            const orderDetails = await Orders.findOne({ _id: data.orderId, userId: this.req.user }, { _id: 1 })
            if (_.isEmpty(orderDetails)) { return this.res.send({ status: 0, message: "Order details not found" }); }
            const ithinkOrderDetails = await IthinkOrders.findOne({ orderId: data.orderId }, { waybill: 1 })
            if (_.isEmpty(ithinkOrderDetails)) { return this.res.send({ status: 0, message: "Ithink order details not found" }); }
            const ithinkController = await new IthinkController();
            const response = await ithinkController.orderTracking({ ithinkData: { awb_number_list: ithinkOrderDetails.waybill } });
            console.log(`response: ${JSON.stringify(response)} `)
            const ithinkResponse = response.data;
            if (ithinkResponse.status_code == 200) {
                return this.res.send({ status: 1, message: "Details are: ", data: ithinkResponse.data });
            } else {
                return this.res.send({ status: 0, message: "Unable to fetch order details due to technical issue" });
            }
        } catch (error) {
            console.log("error", error)
            if (error.statusCode == 400) {
                return this.res.send({ status: 0, message: "Failed in fetching order details", data: error });
            }
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
     Purpose: getting order tracking details
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getShipmentLabelOfOrder() {
        try {
            const data = this.req.params;
            if (!data.orderId) { return this.res.send({ status: 0, message: "Please send orderId" }); }
            const orderDetails = await Orders.findOne({ _id: data.orderId }, { _id: 1 })
            if (_.isEmpty(orderDetails)) { return this.res.send({ status: 0, message: "Order details not found" }); }
            const ithinkOrderDetails = await IthinkOrders.findOne({ orderId: data.orderId }, { waybill: 1 })
            if (_.isEmpty(ithinkOrderDetails)) { return this.res.send({ status: 0, message: "Ithink order details not found" }); }
            const ithinkController = await new IthinkController();
            const ithinkData = {
                awb_numbers: ithinkOrderDetails.waybill,
                page: 'A4',
                "display_cod_prepaid": "1",
                "display_shipper_mobile": "1",
                "display_shipper_address": "1"
            }
            const response = await ithinkController.getShipmentLabelOfOrder({ ithinkData });
            if (response && response.data && response.data.status_code == 200) {
                return this.res.send({ status: 1, message: "Details are: ", data: { pdfFile: response.data.file_name } });
            } else {
                return this.res.send({ status: 0, message: "Unable to print shipment label of an order details due to technical issue" });
            }
        } catch (error) {
            console.log("error", error)
            if (error.statusCode == 400) {
                return this.res.send({ status: 0, message: "Unable to print shipment label of an order details", data: error });
            }
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: getting order tracking details
  Method: GET
  Authorisation: true
  Return: JSON String
  ********************************************************/
    async getManifestDetailsOfOrder() {
        try {
            const data = this.req.params;
            if (!data.orderId) { return this.res.send({ status: 0, message: "Please send orderId" }); }
            const orderDetails = await Orders.findOne({ _id: data.orderId }, { _id: 1 })
            if (_.isEmpty(orderDetails)) { return this.res.send({ status: 0, message: "Order details not found" }); }
            const ithinkOrderDetails = await IthinkOrders.findOne({ orderId: data.orderId }, { waybill: 1 })
            if (_.isEmpty(ithinkOrderDetails)) { return this.res.send({ status: 0, message: "Ithink order details not found" }); }
            const ithinkController = await new IthinkController();
            const ithinkData = {
                awb_numbers: ithinkOrderDetails.waybill,
            }
            const response = await ithinkController.getManifestDetailsOfOrder({ ithinkData });
            console.log(`response: ${JSON.stringify(response)} `)
            if (response && response.data && response.data.status_code == 200) {
                return this.res.send({ status: 1, message: "Details are: ", data: { pdfFile: response.data.file_name } });
            } else {
                return this.res.send({ status: 0, message: "Unable to print manifest details of an order due to technical issue" });
            }
        } catch (error) {
            console.log("error", error)
            if (error.statusCode == 400) {
                return this.res.send({ status: 0, message: "Unable to print manifest details of an order", data: error });
            }
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
   Purpose: getting order tracking details
  Method: GET
  Authorisation: true
  Return: JSON String
  ********************************************************/
    async cancelOrder() {
        try {
            const data = this.req.params;
            if (!data.orderId) { return this.res.send({ status: 0, message: "Please send orderId" }); }
            const orderDetails = await Orders.findOne({ _id: data.orderId, userId: this.req.user }, { _id: 1 })
            if (_.isEmpty(orderDetails)) { return this.res.send({ status: 0, message: "Order details not found" }); }
            const ithinkOrderDetails = await IthinkOrders.findOne({ orderId: data.orderId }, { waybill: 1 })
            if (_.isEmpty(ithinkOrderDetails)) { return this.res.send({ status: 0, message: "Ithink order details not found" }); }
            const ithinkController = await new IthinkController();
            const ithinkData = {
                awb_numbers: ithinkOrderDetails.waybill,
            }
            const response = await ithinkController.cancelOrder({ ithinkData });
            console.log(`response: ${JSON.stringify(response)} `)
            if (response && response.data && response.data.status_code == 200) {
                const { products } = await Orders.findOne({ _id: data.orderId }, { products: 1 });
                for (let i = 0; i < products.length; i++) {
                    if (products[i].productType == 'Simple') {
                        await Products.findOneAndUpdate({ _id: products[i].productId }, { $inc: { stock: products[i].quantity * -1 } })
                    } else {
                        await Products.findOneAndUpdate({
                            _id: products[i].productId,
                        },
                            { $inc: { "attributes.$[e1].values.$[e2].stock": products[i].quantity * 1 } },
                            {
                                arrayFilters: [
                                    { "e1._id": products[i].attributeId },
                                    { "e2._id": products[i].valueId },
                                ]
                            }
                        )
                    }
                }
                await Orders.findOneAndUpdate({ _id: data.orderId }, { orderStatus: 'cancelled' }, { new: true, upsert: true })
                // Need to implement logic to return amount from razor pay
                return this.res.send({ status: 1, message: "Order is cancelled successfully" });
            } else {
                return this.res.send({ status: 0, message: "Unable to cancel an order due to technical issue" });
            }
        } catch (error) {
            console.log("error", error)
            if (error.statusCode == 400) {
                return this.res.send({ status: 0, message: "Unable to cancel an order", data: error });
            }
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = OrderController
