const nodemailer = require('nodemailer');
const alertSettingsModel = require('../models/alertSettingsModel');

let sendMail = function(to){
    const mailConfig = JSON.parse(process.env.MAIL_CONFIG);
    let transporter = nodemailer.createTransport(JSON.parse(process.env.TRANSPORT_CONFIG));
    mailConfig.from = '"SynergyHub" <pitsprak@gmail.com>';
    mailConfig.to = to;
    transporter.sendMail(mailConfig, (error, info) => {});
};

let sendMailToMembers = async function(members, comment, alertType, collectionId) {
    const mailConfig = JSON.parse(process.env.MAIL_CONFIG);
    Promise.resolve(checkAlertSettings(collectionId, alertType)).then((result) => {
        if(result) {
            members.forEach(member => {
                let transporter = nodemailer.createTransport(JSON.parse(process.env.TRANSPORT_CONFIG));
                mailConfig.from = '"SynergyHub" <pitsprak@gmail.com>';
                mailConfig.to = member.email;
                mailConfig.subject = alertType;
                mailConfig.text = comment;
                transporter.sendMail(mailConfig, (error, info) => {});
            });
        }
    });
}

checkAlertSettings = async function(collectionId, alertType) {
    const alertSettings = (await alertSettingsModel.getSettingsByCollectionId(collectionId)).rows;
    return alertSettings.some(setting => {
        return (setting.setting.toLowerCase() === alertType) && setting.value === true;
    });
}

module.exports = {sendMail, sendMailToMembers}