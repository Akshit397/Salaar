/** @format */

const _ = require("lodash");
const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const {
  WalletHistory,
  FundReceived,
  FundTransfer,
} = require("../../models/s_wallet_management");
const {
  SponsorCommission,
  AurCommission,
  ProCommission,
  MemberShipCommission,
  TeamIncome,
} = require("../../models/s_myearnings");

const { ShippingAmount } = require("../../models/s_mystuff");

const { KycDetails } = require("../../models/s_kyc");
const { TicketsList } = require("../../models/s_ticket");

const { Order } = require("../../models/s_orders");
const { SponsorId } = require("../../models/s_sponser_team");
const { Users } = require("../../models/s_users");

class UserDashboardController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  getUserDashboardData = async (id = null) => {
    try {
      let data = {};
      if (this.req?.params) {
        data = this.req.params;
      } else {
        data.user_id = id;
      }
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );

      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let _UserD = await Users.find({ _id: data?.user_id });
        let withdrawls = await WalletHistory.find({
          user_id: data?.user_id,
        }).count();

        let fund_recevied = await FundReceived.find({
          user_id: data?.user_id,
        }).count();

        let fundtransfer = await FundTransfer.find({
          user_id: data?.user_id,
        }).count();

        let shippingamount = await ShippingAmount.find({
          user_id: data?.user_id,
        }).count();

        let order = await Order.find({
          user_id: data?.user_id,
        }).count();

        let OP = await Order.find({
          user_id: data?.user_id,
          status: "order_processing",
        }).count();

        let ODP = await Order.find({
          user_id: data?.user_id,
          status: "order_dispateched",
        }).count();

        let OFD = await Order.find({
          user_id: data?.user_id,
          status: "out_for_delivery",
        }).count();

        let OD = await Order.find({
          user_id: data?.user_id,
          status: "delivery",
        }).count();

        let OC = await Order.find({
          user_id: data?.user_id,
          status: "calcelled",
        }).count();

        let OR = await Order.find({
          user_id: data?.user_id,
          status: "refunded",
        }).count();
        let ORR = await Order.find({
          user_id: data?.user_id,
          status: "return_replace",
        }).count();

        let ORF = await Order.find({
          user_id: data?.user_id,
          status: "order_refused",
        }).count();

        let OU = await Order.find({
          user_id: data?.user_id,
          status: "order_undelivered",
        }).count();

        const Team = await TeamIncome.find({ user_id: data?.user_id });
        const Member = await MemberShipCommission.find({
          user_id: data?.user_id,
        });
        const Pro = await ProCommission.find({ user_id: data?.user_id });
        const Aur = await AurCommission.find({ user_id: data?.user_id });
        const Sponsor = await SponsorCommission.find({
          user_id: data?.user_id,
        });
        const TeamTotal = this.sumArray(Team.flatMap(num => num.teamIncome));
        const MemberTotal = this.sumArray(
          Member.flatMap(num => num.commissionEarned),
        );
        const ProTotal = this.sumArray(Pro.flatMap(num => num.proCommission));
        const AurTotal = this.sumArray(Aur.flatMap(num => num.aurCommission));
        const SponserTotal = this.sumArray(
          Sponsor.flatMap(num => num.sponsorCommission),
        );
        const total =
          TeamTotal + MemberTotal + ProTotal + AurTotal + SponserTotal;

        const kyc = await KycDetails.find({ userId: data?.user_id });
        const kycstatus = kyc.map(item => item.status);

        const sponsorteam = await SponsorId.find({
          sponsor_id: _UserD[0].registerId,
        }).count();

        const tickets = await TicketsList.find({
          userId: data?.user_id,
        }).count();

        let returnResponse = {
          status: 1,
          payload: {
            myearning: {
              team: TeamTotal ? TeamTotal : null,
              member: MemberTotal ? MemberTotal : null,
              pro: ProTotal ? ProTotal : null,
              aur: AurTotal ? AurTotal : null,
              sponsor: SponserTotal ? SponserTotal : null,
              total: total ? total : null,
            },
            kyc: kycstatus ? kycstatus : null,
            team_subcription: "Inactive",
            sponsor_team: sponsorteam ? sponsorteam : null,
            tickets: tickets ? tickets : null,
            withdrawls: withdrawls ? withdrawls : null,
            fund_recevied: fund_recevied ? fund_recevied : null,
            fund_transfer: fundtransfer ? fundtransfer : null,
            shippingamount: shippingamount ? shippingamount : null,
            order: {
              order: order ? order : null,
              op: OP ? OP : null,
              ou: OU ? OU : null,
              orf: ORF ? ORF : null,
              orr: ORR ? ORR : null,
              or: OR ? OR : null,
              oc: OC ? OC : null,
              od: OD ? OD : null,
              ofd: OFD ? OFD : null,
              od: OD ? OD : null,
              ofd: ODP ? ODP : null,
            },
          },
        };

        if (this.req?.params) {
          return this.res.send({
            status: 1,
            payload: {
              myearning: {
                team: TeamTotal ? TeamTotal : null,
                member: MemberTotal ? MemberTotal : null,
                pro: ProTotal ? ProTotal : null,
                aur: AurTotal ? AurTotal : null,
                sponsor: SponserTotal ? SponserTotal : null,
                total: total ? total : null,
              },
              kyc: kycstatus ? kycstatus : null,
              team_subcription: "Inactive",
              sponsor_team: sponsorteam ? sponsorteam : null,
              tickets: tickets ? tickets : null,
              withdrawls: withdrawls ? withdrawls : null,
              fund_recevied: fund_recevied ? fund_recevied : null,
              fund_transfer: fundtransfer ? fundtransfer : null,
              shippingamount: shippingamount ? shippingamount : null,
              order: {
                order: order ? order : null,
                op: OP ? OP : null,
                ou: OU ? OU : null,
                orf: ORF ? ORF : null,
                orr: ORR ? ORR : null,
                or: OR ? OR : null,
                oc: OC ? OC : null,
                od: OD ? OD : null,
                ofd: OFD ? OFD : null,
                od: OD ? OD : null,
                ofd: ODP ? ODP : null,
              },
            },
          });
        } else {
          return returnResponse;
        }
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getSponserIdDetails = async () => {
    try {
      let data = this.req.params;

      const fieldsArray = ["sponsor_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );

      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const getData = await SponsorId.find({
          sponsor_id: data.sponsor_id,
        });

        if (_.isEmpty(getData)) {
          return this.res.send({
            status: 0,
            message: "Sponser Id is invalid",
          });
        }

        return this.res.send({
          status: 1,
          payload: getData,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getSponserIdUserID = async () => {
    try {
      let data = this.req.params;

      const fieldsArray = ["sponsor_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );

      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const getData = await SponsorId.find({
          user_id: data.sponsor_id,
        });

        if (_.isEmpty(getData)) {
          return this.res.send({
            status: 0,
            message: "Sponser Id is invalid",
          });
        }

        return this.res.send({
          status: 1,
          payload: getData,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  sumArray = array => {
    let sum = 0;

    array.forEach(item => {
      sum += item;
    });
    return sum;
  };
}

module.exports = UserDashboardController;
