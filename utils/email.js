require('dotenv').config()
// import module
const nodemailer = require('nodemailer')
// declared variables
const EMAIL_HOST = process.env.EMAIL_HOST // email provider 
const EMAIL_TO = process.env.EMAIL_TO // email reciver
const EMAIL_FROM = process.env.EMAIL_FROM // email sender user
const EMAIL_PASS_WORD = process.env.EMAIL_PASS_WORD // email sender password
const sendEmail = (subject,html) => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth : {
            user : EMAIL_FROM,
            pass : EMAIL_PASS_WORD
        },
        tls: { 
            minVersion: 'TLSv1', // -> This is the line that solved my problem
            rejectUnauthorized: false,
        }
    });
    const emailOptions = {
        from : EMAIL_FROM,
        to : EMAIL_TO,
        subject : `Maltrans new entry for bill of lading no. ${subject}`,
        html:html
    }
    transporter.sendMail(emailOptions,(error,info) => {
        if (error){
            console.log(error)
        }
    })
}

module.exports = sendEmail