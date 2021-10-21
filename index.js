require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const emoji = require('node-emoji');
const helpers = require('./src/helpers');
const localization = require('./src/localization');
const moment = require('moment');
const updateToken = process.env.UPDATE_TOKEN;
const util = require('util');

bot.onText(/^\/acciones/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;

     let chartEmoji = emoji.get('bar_chart');
     let moneyEmoji = emoji.get('euro');
     let listEmoji = emoji.get('spiral_calendar_pad');
     let heartEmoji = emoji.get('heart');

     var buttonData = [[{
          text: `${chartEmoji} ${localization.getText("resumeFinancesOptionText", languageCode)}`,
          callback_data: localization.getText("resumeFinancesOptionText", languageCode)
     }],
     [{
          text: `${moneyEmoji} ${localization.getText("totalRevenueOptionText", languageCode)}`,
          callback_data: localization.getText("totalRevenueOptionText", languageCode)
     }], [{
          text: `${listEmoji} ${localization.getText("subscriptionsOptionText", languageCode)}`,
          callback_data: localization.getText("subscriptionsOptionText", languageCode)
     }], [{
          text: `${heartEmoji} ${localization.getText("donateOptionText", languageCode)}`,
          callback_data: localization.getText("donateOptionText", languageCode)
     }], [{
          text: localization.getText("cancelText", languageCode),
          callback_data: localization.getText("cancelText", languageCode)
     }]]

     let buttons = {
          reply_markup: {
               inline_keyboard: buttonData
          }
     }

     bot.sendMessage(chatId, localization.getText("actionsTitleText", languageCode), buttons);
});

bot.onText(/^\/borrar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;

     var buttonData = [[{
          text: localization.getText("deleteYesText", languageCode),
          callback_data: localization.getText("deleteYesText", languageCode)
     }], [{
          text: localization.getText("cancelText", languageCode),
          callback_data: localization.getText("cancelText", languageCode)
     }]]

     let buttons = {
          reply_markup: {
               inline_keyboard: buttonData
          }
     }

     bot.sendMessage(chatId, localization.getText("deleteTitleText", languageCode), buttons);
});

bot.onText(/^\/donar/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;

     donate(chatId, languageCode);
});

bot.onText(/^\/ingresos (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let revenue = match[1];

     database.addTotalRevenue(userId, chatId, name, revenue, languageCode).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
});

bot.onText(/^\/start/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;
     let userName = msg.from.first_name;

     database.setChatIdForUpdate(chatId, languageCode).then(function (result) {
          helpers.log(result);
     }).catch(function (err) {
          helpers.log(err);
     });

     bot.setMyCommands(helpers.getCommands(languageCode)).then(function (info) {
          helpers.log(info);
          sendInfo(chatId, userName, languageCode);
     }).catch(function (err) {
          helpers.log(err);
     });
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

     if (suscriptionName == localization.getText("deleteCommandText", languageCode)) {
          database.getSubscriptions(userId, languageCode, true, false).then(function (buttonData) {
               let buttons = {
                    reply_markup: {
                         inline_keyboard: buttonData
                    }
               }

               bot.sendMessage(chatId, localization.getText("deleteSubscriptionButtonsTitle", languageCode), buttons).then(function (result) {
                    helpers.log(result);
               }).catch(function (err) {
                    helpers.log(err);
                    bot.sendMessage(chatId, localization.getText("zeroSubscriptionsText", languageCode));
               });
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else {
          database.addSubscription(userId, chatId, suscriptionName, suscriptionPrice, suscriptionType, suscriptionDate, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     }
});

bot.onText(/^\/update (.+)/, (msg, match) => {
     let languageCode = msg.from.language_code;
     let data = match[1].split("-");
     let token = data[0];
     let message = data[1];

     if (token == updateToken) {
          database.getAllChatId().then(function (collection) {
               collection.forEach(chatId => {
                    bot.sendMessage(chatId, message);
               });
          }).catch(function (err) {
               helpers.log(err);
          });
     } else {
          helpers.log(localization.getText("tokenError", languageCode));
     }
});

bot.on('callback_query', function onCallbackQuery(action) {
     let languageCode = action.from.language_code;
     let chatId = action.message.chat.id;
     let userId = action.from.id;
     let data = action.data;

     if (data == localization.getText("totalRevenueOptionText", languageCode)) {
          database.getTotalRevenue(userId, languageCode, false).then(function (message) {
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
          database.getSubscriptions(userId, languageCode, false, false).then(function (message) {
               bot.sendMessage(chatId, message, { parse_mode: constants.parseMode });
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data.indexOf(localization.getText("subscriptionPreData", languageCode)) > -1) {
          let subscriptionId = data.replace(localization.getText("subscriptionPreData", languageCode), "");

          database.deleteSubscription(userId, subscriptionId, languageCode).then(function (message) {
               bot.sendMessage(chatId, message);
          }).catch(function (err) {
               helpers.log(err);
               sendErrorMessageToBot(chatId, languageCode);
          });
     } else if (data == localization.getText("donateOptionText", languageCode)) {
          donate(chatId, languageCode);
     } else if (data == localization.getText("resumeFinancesOptionText", languageCode)) {
          database.getUserDataSummary(userId, languageCode).then(function (response) {
               helpers.log(response);
               bot.sendPhoto(chatId, response.urlChart).then(function (result) {
                    helpers.log(result);
               }).catch(function (err) {
                    helpers.log(err);
                    sendErrorMessageToBot(chatId, languageCode);
               });
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

function donate(chatId, languageCode) {
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
};

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
     let warningEmoji = emoji.get('warning');
     let warningMessage = `${warningEmoji} ${localization.getText("warningMessageText", languageCode)}`;
     let helloText = util.format(localization.getText("sendInfoText", languageCode), name);
     let infoText = localization.getText("helloMessageText", languageCode);
     var message = `${warningMessage}${helloText}${infoText}`;

     bot.getMyCommands().then(function (info) {
          for (let obj of info) {
               message += `/${obj.command} - ${obj.description}\n`;
          }

          bot.sendMessage(chatId, message);
     });
};

function time() {
     let date = new Date();
     let hour = date.getHours();
     let minutes = date.getMinutes();

     var time;
     if (minutes < 10) {
          time = `${hour}:0${minutes}`;
     } else {
          time = `${hour}:${minutes}`;
     }
     return time;
};

cron.schedule('* * * * *', () => {
     if (time() === constants.morningNotification) {
          database.getAllSubscriptions().then(function (response) {
               response.forEach(subscription => {
                    let today = moment(new Date().toLocaleString('es-ES'), 'DD-MM-YYYY');

                    let subscriptionName = helpers.capitalizeFirstLetter(subscription.name);
                    let subscriptionDate = moment(subscription.date, 'DD-MM-YYYY');
                    let chatId = subscription.chatId;
                    let message = util.format(localization.getText("subscriptionRemember", constants.esLanguageCode), subscription.type, subscriptionName, subscription.price);

                    if (subscription.type == constants.monthSubscriptionType) {
                         if (subscriptionDate.date() == today.date()) {
                              bot.sendMessage(chatId, message);
                         }
                    } else if (subscription.type == constants.yearSubscriptionType) {
                         if (subscriptionDate.date() == today.date() && subscriptionDate.month() == today.month()) {
                              bot.sendMessage(chatId, message);
                         }
                    }
               });
          }).catch(function (err) {
               helpers.log(err);
          });
     }
});