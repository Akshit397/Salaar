const PDFController = require('../../controller/common/pdf');

module.exports = (router, app) => {
    router.get('/downloadGameInvoice/:gameOrderId', (req, res, next) => {
        const pdfObj = (new PDFController()).boot(req, res);
        return pdfObj.downloadGameInvoice();
    });

    router.get('/download/payoutInvoice/:withdrawal_id', (req, res, next) => {
        const pdfObj = (new PDFController()).boot(req, res);
        return pdfObj.downloadPayoutInvoice();
    });
}