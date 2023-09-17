const _ = require("lodash");
const { ObjectID } = require("mongodb");

const Controller = require("../base");
const { Coupons } = require('../../models/s_coupons');
const CartController = require('../user/cart')


class CouponsController extends Controller {
    constructor() {
        super();
    }
    /********************************************************
     Purpose: Get available coupons details
     Method: Get
     Return: JSON String
     ********************************************************/
    async getAvailableCoupons() {
        try {
            const date = new Date()
            const query = {
                $and: [{ startDate: { $lte: date } },
                { endDate: { $gte: date } },
                { isDeleted: false, status: true, isCompleted: false }
                ]
            };
            console.log(`query: ${JSON.stringify(query)}`)
            const coupons = await Coupons.find(query, {
                type: 1, couponCode: 1, minShoppingAmount: 1,
                maxShoppingAmount: 1, startDate: 1, endDate: 1, discount: 1, discountType: 1,
            });
            if (_.isEmpty(coupons)) {
                return this.res.send({ status: 0, message: "Coupon details not found" });
            }
            return this.res.send({ status: 1, data: coupons });

        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Validate coupon details
    Method: POST
    {
        "type":"isGame",
        "couponCode":""
    }
    Return: JSON String
    ********************************************************/
    async validateCouponDetails() {
        try {
            const data = this.req.body;
            const userId = this.req.user;
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
            if (_.isEmpty(couponDetails)) {
                return this.res.send({ status: 0, message: "Coupon details not found" });
            }
            return this.res.send({ status: 1, message: "Coupon is valid", data: couponDetails });
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = CouponsController


