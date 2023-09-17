const _ = require("lodash");
const QRCode = require('qrcode');
const path = require('path');

const Controller = require("../base");



class QrCodeController extends Controller {
    constructor() {
        super();
    }

    /********************************************************
      Purpose: Get QR Code path
      Method: 
      Authorisation: true
      Return: JSON String
      ********************************************************/
    async getQrCodePath(customUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                const url = `https://salar.in/Gamedetail/${customUrl}`;
                const qrCode = await QRCode.toDataURL(url, {
                    width: 800, scale: 2
                }).then(result => {
                    return result
                }).catch(err => {
                    console.error(err)
                });
                resolve(qrCode)
            } catch (error) {
                console.log(`error: ${error}`)
                resolve({ status: 0, message: "Internal server error" });
            }
        })
    }
}
module.exports = QrCodeController
