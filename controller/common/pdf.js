const _ = require("lodash");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
const format = require('format-number');
const myFormat = format({ prefix: '₹' });
const converter = require('number-to-words');

const { Orders } = require("../../models/s_orders");
const Controller = require("../base");
const QrCodeController = require('../common/qrCode');

class PDFController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
  Purpose: Download game invoice
  Method: GET
  Authorisation: false   
  Return: JSON String
  ********************************************************/
    async downloadGameInvoice() {
        try {
            const data = this.req.params;
            if (!data.gameOrderId) {
                return this.res.send({ status: 0, message: "Please send game orderId" });
            }
            const gameOrderDetails = await Orders.findOne({ _id: data.gameOrderId, status: { $exists: true } },
                { products: 1, billingAddress: 1, shippingAddress: 1, orderId: 1, discount: 1, totalAmount: 1 })
            if (_.isEmpty(gameOrderDetails)) {
                return this.res.send({ status: 0, message: "Order details not found" });
            }
            const customUrl = gameOrderDetails.products[0].customUrl;
            // get qrcode begins
            const qrCodeController = await new QrCodeController();
            const qrCodeDetails = await qrCodeController.getQrCodePath(customUrl);
            // get qrcode ends

            let loc = path.join(__dirname, '..', '..', 'public', 'gameInvoice.html');
            let html = fs.readFileSync(loc, 'utf8');
            let billingAddress = `
            <p class="text-sm mb-0 mt-2">{userName}</p>
            <p class="text-sm mb-0">{address1}</p>
            <p Class="text-sm mb-0">{address2}</p>
            <p Class="text-sm mb-0">{city}</p>
            <p Class="text-sm mb-0">{state}</p>
            <p Class="text-sm mb-0">IN</p>
            <b Class="text-md d-flex justify-content-end">
            State/UT Code: <p Class="mx-1 mt-0">{stateId}</p>
            </b>`;
            billingAddress = billingAddress.replace(`{userName}`, gameOrderDetails.billingAddress.name)
            billingAddress = billingAddress.replace(`{address1}`,
                `${gameOrderDetails.billingAddress.addressLine1}`)
            billingAddress = billingAddress.replace(`{address2}`, `${gameOrderDetails.billingAddress.addressLine2}`)
            billingAddress = billingAddress.replace(`{city}`, `${gameOrderDetails.billingAddress.city}`)
            billingAddress = billingAddress.replace(`{state}`,
                `${gameOrderDetails.billingAddress.state} - ${gameOrderDetails.billingAddress.zipCode}`)
            billingAddress = billingAddress.replace(`{stateId}`, `${gameOrderDetails.billingAddress.stateId}`)

            let productsTable = `
                <tr>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                           {sNo}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            <p>
                               {name}
                            </p>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {unitPrice}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {discount}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {quantity}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {gstType}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {gstPrice}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex px-2 justify-content-center">
                            {finalPrice}
                        </div>
                    </td>
                </tr>`;
            const gstType = (gameOrderDetails.billingAddress.state).toLowerCase() == 'andhra pradesh' ? 'GST' : 'IGST'
            const product = gameOrderDetails.products[0];
            const quantity = 1;
            console.log(`product: ${JSON.stringify(product)}`)
            productsTable = productsTable.replace(`{sNo}`, 1)
            productsTable = productsTable.replace(`{name}`, product.productName)
            productsTable = productsTable.replace(`{unitPrice}`, myFormat(product.unitPrice, { noSeparator: false }))
            productsTable = productsTable.replace(`{discount}`, myFormat(gameOrderDetails.discount, { noSeparator: false }))
            productsTable = productsTable.replace(`{quantity}`, quantity)
            productsTable = productsTable.replace(`{gstType}`, gstType)
            productsTable = productsTable.replace(`{gstPrice}`, myFormat(product.gstAmount, { noSeparator: false }))
            productsTable = productsTable.replace(`{finalPrice}`, myFormat(product.finalPrice, { noSeparator: false }))

            html = html.replace('{deliveredDate}', moment(gameOrderDetails.createdAt).locale('es-US').format("DD/MM/YYYY"))
            html = html.replace('{billingAddress}', billingAddress)
            html = html.replace('{qrCodeDetails}', qrCodeDetails)
            html = html.replace('{orderId}', gameOrderDetails.orderId)
            html = html.replace('{orderDate}', moment(gameOrderDetails.createdAt).locale('es-US').format("DD/MM/YYYY"))
            html = html.replace('{invoiceNumber}', gameOrderDetails.orderId)
            html = html.replace('{invoiceDate}', moment(gameOrderDetails.createdAt).locale('es-US').format("DD/MM/YYYY"))
            html = html.replace(`{productsTable}`, productsTable)
            html = html.replace(`{totalAmount}`, myFormat(gameOrderDetails.totalAmount, { noSeparator: false }))
            html = html.replace('{totalAmountInWords}', `${(converter.toWords(gameOrderDetails.totalAmount)).toUpperCase()} ONLY`)
            const filePathAndName = "invoice-pdf-" + Date.now() + ".pdf";
            const filePath = path.join(__dirname, "../..", "public/pdf/", filePathAndName);
            let data1 = { filePathAndName }
            const options = { format: 'A2', border: "1px", timeout: 300000 };
            await pdf.create(html, options).toFile(filePath, function (err) {
                if (err) { throw err }
            });
            return this.res.send({ status: 1, message: "PDF downloaded successfully", data: data1 })
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = PDFController