const axios = require("axios").default;

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SEND_GRID_TOKEN);

// const mailgun = require('mailgun-js')
//   ({ apiKey: process.env.API_KEY, domain: process.env.DOMAIN });

// const mailTransporter = (data) => {
//   mailgun.messages().send(data, (error, body) => {
//     if (error) console.log(error)
//     else console.log(body);
//   });
// }

// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   ignoreTLS: false,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
class Services {
  async sendEmail(toEmail, subject, text, html) {
    try {
      // let sendMail = await transporter.sendMail({
      //   from: process.env.EMAIL, // sender address
      //   to: toEmail, // list of receivers
      //   subject: subject, // Subject line
      //   text: text, // plain text body
      //   html: html, // html body
      // });
      // let sendMail = await mailTransporter({
      //   from: `Salar Admin <${process.env.EMAIL}>`,
      //   to: `${toEmail}, Salar@${process.env.DOMAIN}`,
      //   subject: subject, // Subject line
      //   text: text, // plain text body
      //   html: html, // html body
      // });
      // console.log(`sendMail: ${sendMail}`)
      sgMail.setApiKey(process.env.SEND_GRID_TOKEN);
      return await sgMail
        .send({
          to: toEmail,
          from: "no-reply@salar.in",
          subject: subject,
          text: text,
          html: html,
        })
        .then((res) => {
          return {
            status: 1,
            message: res[0].statusCode,
          };
        })
        .catch((error) => {
          return {
            status: 0,
            message: error.response.body,
          };
        });
    } catch (error) {
      console.log(`mail error: ${error}`);
      return { status: 0, message: error.message };
    }
  }
  async sendSignupConfirmation(mobile, message) {
    try {
      /*
       *Message should be in below format its signup confirmation templet
       */
      // "Dear  " +
      // request.form["first_name"] +
      // ",Welcome to www.salar.in Your User ID is  " +
      // ref_id +
      // ",Your Password is  " +
      // request.form["password"] +
      // ",Regards Strawberri World Solutions Private Limited.";

      let sendMessage = await axios.post(
        `https://login.bulksmsgateway.in/sendmessage.php?user=surajm&password=SurajIndia1*&mobile=${mobile}&sender=SRAWPL&message=${message}&type=3&template_id=1207162960583934188`,
        ""
      );

      return {
        status: 1,
        message: "message send",
        result: sendMessage,
      };
    } catch (error) {
      return { status: 0, message: error.message };
    }
  }
  async sendTranxChangeOtp(mobile, message) {
    try {
      /*
       *Message should be in below format its Send OTP templet
       */
      //  "Dear User,Your OTP for Password Change is "+user.trnx_otp+",Regards Strawberri World Solutions Private Limited,www.salar.in"

      let sendMessage = await axios.post(
        `https://login.bulksmsgateway.in/sendmessage.php?user=surajm&password=SurajIndia1*&mobile=${mobile}&sender=SRAWPL&message=${message}&type=3&template_id=1207162736775796010`,
        ""
      );
      return {
        status: 1,
        message: sendMessage.data,
      };
    } catch (error) {
      return { status: 0, message: error.message };
    }
  }
}
module.exports = Services;
