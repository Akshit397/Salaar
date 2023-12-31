/** @format */

module.exports = (router, app) => {
  // Admin Routes
  require("../routes/admin/auth")(router, app);
  require("../routes/admin/supportTickets")(router, app);
  require("../routes/admin/adminSettings")(router, app);
  require("../routes/admin/games")(router, app);
  require("../routes/admin/products")(router, app);
  require("../routes/admin/settings")(router, app);
  require("../routes/admin/teamLevels")(router, app);
  require("../routes/admin/teamProducts")(router, app);
  require("../routes/admin/teamBonusSubscriptions")(router, app);
  require("../routes/admin/userManagement")(router, app);
  require("../routes/admin/sellerManagement")(router, app);
  require("../routes/admin/ticketCategories")(router, app);
  require("../routes/admin/walletManagement")(router, app);
  require("../routes/admin/adPositions")(router, app);
  require("../routes/admin/advertisements")(router, app);
  require("../routes/admin/manageApprovals")(router, app);
  require("../routes/admin/coupons")(router, app);
  require("../routes/admin/notifications")(router, app);
  require("../routes/admin/deals")(router, app);
  require("../routes/admin/subscriptions")(router, app);
  require("../routes/admin/user")(router, app);
  require("../routes/admin/cms")(router, app);
  require("../routes/admin/categories")(router, app);
  require("../routes/admin/travelTypes")(router, app);
  require("../routes/admin/recharges")(router, app);
  require("../routes/admin/plans")(router, app);
  require("../routes/admin/gameProducts")(router, app);
  require("../routes/admin/brands")(router, app);
  require("../routes/admin/units")(router, app);
  require("../routes/admin/attributes")(router, app);
  require("../routes/admin/gstCodes")(router, app);
  require("../routes/admin/commissions")(router, app);
  require("../routes/admin/returnTypes")(router, app);
  require("../routes/admin/networkCategories")(router, app);
  require("../routes/admin/sellerNetworkSettings")(router, app);
  require("../routes/admin/businessSegments")(router, app);
  require("../routes/admin/sellerNetworkCategories")(router, app);
  require("../routes/admin/foodProducts")(router, app);
  require("../routes/admin/roles")(router, app);
  require("../routes/admin/businessSubSegments")(router, app);
  require("../routes/admin/productReview")(router, app);
  require("../routes/admin/portfolioSubscriptions")(router, app);
  require("../routes/admin/gifts")(router, app);
  require("../routes/admin/giftOrders")(router, app);
  require("../routes/admin/staffManagement")(router, app);
  require("../routes/admin/razorpay")(router, app);
  // User Routes
  require("../routes/user/auth")(router, app);
  require("../routes/user/userProfile")(router, app);
  require("../routes/user/kycDetails")(router, app);
  require("../routes/user/orgDetails")(router, app);
  require("../routes/user/bankDetails")(router, app);
  require("../routes/user/orders")(router, app);
  require("../routes/user/website")(router, app);
  require("../routes/user/payments")(router, app);
  require("../routes/user/mlm")(router, app);
  require("../routes/user/mystuff")(router, app);
  require("../routes/user/myearnings")(router, app);
  require("../routes/user/mywallet")(router, app);
  require("../routes/user/tickets")(router, app);
  require("../routes/user/sponser_procom")(router, app);
  require("../routes/user/dashboard")(router, app);
  require("../routes/user/chat")(router, app);
  require("../routes/user/networkTeam")(router, app);
  require("../routes/user/cart")(router, app);
  require("../routes/user/games")(router, app);
  require("../routes/user/categories")(router, app);
  require("../routes/user/products")(router, app);
  require("../routes/user/productReview")(router, app);
  require("../routes/user/coupons")(router, app);
  require("../routes/user/portfolio")(router, app);
  require("../routes/user/giftOrders")(router, app);
  // Common Routes
  require("../routes/common/fileUpload")(router, app);
  require("../routes/common/supportTickets")(router, app);
  require("../routes/common/categories")(router, app);
  require("../routes/common/notifications")(router, app);
  require("../routes/common/blogs")(router, app);
  require("../routes/common/websitesettings")(router, app);
  require("../routes/common/cms")(router, app);
  require("../routes/common/websiteProducts")(router, app);
  require("../routes/common/ithink")(router, app);
  require("../routes/common/pdf")(router, app);

  // Seller Routes
  require("../routes/seller/auth")(router, app);
  require("../routes/seller/sellerProfile")(router, app);
  require("../routes/seller/kycDetails")(router, app);
  require("../routes/seller/bankDetails")(router, app);
  require("../routes/seller/etdDetails")(router, app);
  require("../routes/seller/fssaiDetails")(router, app);
  require("../routes/seller/signatureDetails")(router, app);
  require("../routes/seller/iecDetails")(router, app);
  require("../routes/seller/storeDetails")(router, app);
  require("../routes/seller/adPositions")(router, app);
  require("../routes/seller/advertisements")(router, app);
  require("../routes/seller/sellerBrands")(router, app);
  require("../routes/seller/sellerCategories")(router, app);
  require("../routes/seller/subscriptions")(router, app);
  require("../routes/seller/networkTeam")(router, app);
  require("../routes/seller/categories")(router, app);
  // Razorpay Routes
  require("../routes/common/razorpay")(router, app);
  require("../routes/common/payouts")(router, app);
  // Webhooks
  require("../routes/admin/webhook")(router, app);
};
