/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const nodemailer = require('nodemailer');
const config = require('../config.json');

module.exports = sendEmail;

async function sendEmail({
  to, subject, html, from = config.emailFrom,
}) {
  try {
    const transporter = nodemailer.createTransport(config.smtpOptions);

    transporter.verify().then(console.log).catch(console.error);
    
    await transporter.sendMail({
      from, to, subject, html, function(err, info) {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
      }
    });
  } catch (error) {
    console.log(new Error(`Whoops, something bad happened: [${error}]`));
  }
}
