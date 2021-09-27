require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require('axios');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const constants = require('./src/constants');
const cron = require('node-cron');
const database = require('./src/database');
const helpers = require('./src/helpers');

/**
 * Telegram bot functions.
 */
bot.onText(/^\/acciones/, (msg) => {
     let chatId = msg.chat.id;

     var buttonData = []
     buttonData.push({ text: constants.totalRevenueOptionText, callback_data: constants.totalRevenueOptionText });
     buttonData.push({ text: constants.cancelText, callback_data: constants.cancelText });

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     }

     bot.sendMessage(chatId, constants.actionsTitleText, buttons);
});

bot.onText(/^\/borrar/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let deleteQuery = `delete from users where id = ${userId};`;

     database.queryDatabase(deleteQuery).then(function (result) {
          log(result);
          bot.sendMessage(chatId, constants.deleteUserText);
     }).catch(function (err) {
          log(err);
          sendErrorMessageToBot(chatId);
     });
});

bot.onText(/^\/ingresos (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let revenue = match[1];
     let createdAt = new Date().getTime();
     let insertQuery = `insert into users (id,name,revenue,created_at) values (${userId},'${name}',${revenue},${createdAt});`;
     let updateQuery = `update users set revenue = ${revenue} where id = ${userId};`

     database.queryDatabase(insertQuery).then(function (result) {
          log(result);
          bot.sendMessage(chatId, constants.revenueInsertText);
     }).catch(function (err) {
          log(err);
          database.queryDatabase(updateQuery).then(function (result) {
               log(result);
               bot.sendMessage(chatId, constants.revenueUpdateText);
          }).catch(function (err) {
               log(err);
               sendErrorMessageToBot(chatId);
          });
     });
});

bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${constants.startText}`;

     bot.sendMessage(chatId, message);
});

bot.on('callback_query', function onCallbackQuery(action) {
     let chatId = action.message.chat.id;
     let userId = action.from.id;
     let data = action.data;
     let selectQuery = `select revenue from users where id = '${userId}';`

     if (data == constants.totalRevenueOptionText) {
          database.queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    bot.sendMessage(chatId, constants.zeroRevenueText);
               } else {
                    let json = JSON.stringify(result.rows[0]);
                    let obj = JSON.parse(json);
                    let revenue = {
                         amount: obj.revenue
                    };

                    bot.sendMessage(chatId, `Tus ingresos totales son ${helpers.formatter.format(revenue.amount)} €.`);
               }
          }).catch(function (err) {
               sendErrorMessageToBot(chatId);
          });
     } else if (data == constants.cancelText) {
          bot.sendMessage(chatId, constants.cancelActionsText);
     }
});

/**
 * Scheduler functions.
 */
/**
cron.schedule('* * * * *', () => {
});*/

/**
 * Helper functions.
 */
function sendErrorMessageToBot(chatId) {
     bot.sendMessage(chatId, constants.generalErrorText);
};

/**
 * Logs.
 */
function log(message) {
     console.log(message);
};