const WebhookController = require('../../controller/admin/webhook');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/admin/razorpayWebhook', (req, res, next) => {
        const razorPayObj = (new WebhookController()).boot(req, res);
        return razorPayObj.razorpayWebhook();
    });
}