require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');
const localization = require('./src/localization');
const util = require('util');

bot.onText(/^\/acciones/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;

     var buttonData = [[{
          text: localization.getText("totalRevenueOptionText", languageCode),
          callback_data: localization.getText("totalRevenueOptionText", languageCode)
     }], [{
          text: localization.getText("subscriptionsOptionText", languageCode),
          callback_data: localization.getText("subscriptionsOptionText", languageCode)
     }], [{
          text: localization.getText("cancelText", languageCode),
          callback_data: localization.getText("cancelText", languageCode)
     }]]

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     }

     bot.sendMessage(chatId, localization.getText("actionsTitleText", languageCode), buttons);
});

bot.onText(/^\/borrar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;

     var buttonData = [[{
          text: localization.getText("deleteYesText", languageCode),
          callback_data: localization.getText("deleteYesText", languageCode)
     }], [{
          text: localization.getText("cancelText", languageCode),
          callback_data: localization.getText("cancelText", languageCode)
     }]]

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     }

     bot.sendMessage(chatId, localization.getText("deleteTitleText", languageCode), buttons);
});

bot.onText(/^\/donar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let buttons = {
          reply_markup: {
               inline_keyboard: [[{
                    text: localization.getText("oneCoinText", languageCode),
                    callback_data: localization.getText("oneCoinText", languageCode)
               },
               {
                    text: localization.getText("threeCoinText", languageCode),
                    callback_data: localization.getText("threeCoinText", languageCode)
               },
               {
                    text: localization.getText("fiveCoinText", languageCode),
                    callback_data: localization.getText("fiveCoinText", languageCode)
               }], [{
                    text: localization.getText("cancelText", languageCode),
                    callback_data: localization.getText("cancelText", languageCode)
               }]]
          }
     };

     bot.sendMessage(chatId, localization.getText("coinPaymentTitleText", languageCode), buttons);
});

bot.onText(/^\/ingresos (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let revenue = match[1];

     database.addTotalRevenue(userId, name, revenue, languageCode).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.onText(/^\/start/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let name = msg.from.first_name;

     sendInfo(chatId, name, languageCode);
});

bot.onText(/^\/suscripcion (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let data = match[1].split(" ");
     let suscriptionName = data[0];
     let suscriptionPrice = data[1];
     let suscriptionType = data[2];
     let suscriptionDate = data[3];

     database.addSubscription(userId, suscriptionName, suscriptionPrice, suscriptionType, suscriptionDate, languageCode).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.on('callback_query', function onCallbackQuery(action) {
     let languageCode = action.from.language_code;
     let chatId = action.message.chat.id;
     let userId = action.from.id;
     let data = action.data;

     if (data == localization.getText("totalRevenueOptionText", languageCode)) {
          database.getTotalRevenue(userId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data == localization.getText("cancelText", languageCode)) {
          bot.sendMessage(chatId, localization.getText("cancelActionsText", languageCode));
     } else if (data == localization.getText("oneCoinText", languageCode)) {
          paymentWithAmount(chatId, 100, languageCode);
     } else if (data == localization.getText("threeCoinText", languageCode)) {
          paymentWithAmount(chatId, 300, languageCode);
     } else if (data == localization.getText("fiveCoinText", languageCode)) {
          paymentWithAmount(chatId, 500, languageCode);
     } else if (data == localization.getText("deleteYesText", languageCode)) {
          database.deleteUser(userId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data == localization.getText("subscriptionsOptionText", languageCode)) {
          database.getSubscriptions(userId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message, { parse_mode: constants.parseMode });
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     }
});

bot.on('pre_checkout_query', function onCallbackQuery(result) {
     helpers.log(result)
     bot.answerPreCheckoutQuery(result.id, true);
});

bot.on('shipping_query', function onCallbackQuery(result) {
     helpers.log(result)
     bot.answerShippingQuery(result.id, false);
});

bot.on('successful_payment', function onCallbackQuery(result) {
     helpers.log(result)
});

function paymentWithAmount(chatId, amount, languageCode) {
     let title = localization.getText("paymentTitleText", languageCode);
     let description = localization.getText("paymentDescriptionText", languageCode);
     let payload = localization.getText("paymentPayloadText", languageCode);
     let providerToken = process.env.STRIPE_PAYMENT_TOKEN;
     let startParameter = localization.getText("paymentStartParameterText", languageCode);
     let currency = localization.getText("paymentCurrencyText", languageCode);
     let prices = [{ "label": localization.getText("paymentPriceLabelText", languageCode), "amount": amount }];
     let options = {
          photo_url: constants.donatePhotoUrl,
          photo_width: 480,
          photo_height: 320,
          is_flexible: false,
          need_shipping_address: false
     }

     bot.sendInvoice(chatId, title, description, payload, providerToken, startParameter, currency, prices, options).then(function (result) {
          helpers.log(result);
     }).catch(function (err) {
          helpers.log(err);
     });
};

function sendErrorMessageToBot(chatId, languageCode) {
     bot.sendMessage(chatId, localization.getText("generalErrorText", languageCode));
};

function sendInfo(chatId, name, languageCode) {
     let helloText = util.format(localization.getText("sendInfoText", languageCode), name);
     let infoText = localization.getText("helloMessageText", languageCode);
     var message = `${helloText}${infoText}`;

     bot.getMyCommands().then(function (info) {
          for (let obj of info) {
               message += `/${obj.command} - ${obj.description}\n`;
          }

          bot.sendMessage(chatId, message);
     });
};

cron.schedule('* * * * *', () => {
});