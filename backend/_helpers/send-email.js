/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
const nodemailer = require('nodemailer');
const config = require('../config.json');

// set up our Winston logger (same instance, cached by node)
const winstonErrorHandler = require('./winston-logger')

module.exports = sendEmail;

async function sendEmail({
  to, subject, html, from = config.emailFrom,
}) {
  try {
    const transporter = nodemailer.createTransport(config.smtpOptions);

    transporter.verify().then(
      // maybe log, maybe not
    ).catch(
      // log
    );
    
    await transporter.sendMail({
      from, to, subject, html, function(err, info) {
        if (err) {
          winstonErrorHandler.error(err.message);;
        } else {
          winstonErrorHandler.error(info);
        }
      }
    });
  } catch (error) {
    winstonErrorHandler.error(new Error(`Whoops, something bad happened: [${error}]`));
  }
}
