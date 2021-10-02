require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');
const localization = require('./src/localization');
const util = require('util');

bot.onText(/^\/acciones/, (msg) => {
     let languageCode = msg.from.language_code;
     let chatId = msg.chat.id;

     var buttonData = []
     buttonData.push({
          text: localization.getText("totalRevenueOptionText", languageCode),
          callback_data: localization.getText("totalRevenueOptionText", languageCode)
     });
     buttonData.push({
          text: localization.getText("cancelText", languageCode),
          callback_data: localization.getText("cancelText", languageCode)
     });

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

     database.deleteUser(userId, languageCode).then(function (message) {
          bot.sendMessage(chatId, message);
     }).catch(function (err) {
          helpers.log(err);
          sendErrorMessageToBot(chatId, languageCode);
     });
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
     let message = util.format(localization.getText("helloText", languageCode), name);

     bot.sendMessage(chatId, message);
});

bot.on('callback_query', function onCallbackQuery(action) {
     let languageCode = msg.from.language_code;
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
     }
});

function sendErrorMessageToBot(chatId, languageCode) {
     bot.sendMessage(chatId, localization.getText("generalErrorText", languageCode));
};

/**
cron.schedule('* * * * *', () => {
}); */