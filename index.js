require("dotenv").config();

const axios = require('axios');
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
     polling: true
});
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});
const formatter = new Intl.NumberFormat('de-DE', {
     minimumFractionDigits: 2,
     maximumFractionDigits: 8,
});
const startText = "\nEscribe la barra / para ver en qué te puedo ayudar.\n\nMás información: https://github.com/ArtCC/myfinancesbot-artcc";
const revenueUpdateText = "Tus ingresos totales han sido actualizados correctamente.";
const revenueInsertText = "Tus ingresos totales han sido añadidos correctamente.";
const deleteUserText = "Tu usuario ha sido eliminado correctamente.";
const generalErrorText = "¡Vaya! Parece que ha habido un problema con tu solicitud. Inténtalo de nuevo por favor.";
const actionsTitleText = "Elige una de las opciones disponibles";
const totalRevenueOptionText = "Ingresos";
const zeroRevenueText = "Tus ingresos totales son 0 €.";
const cancelText = "Cancelar";
const cancelActionsText = "De acuerdo.";

bot.onText(/^\/start/, (msg) => {
     let chatId = msg.chat.id;
     let name = msg.from.first_name;
     let message = `¡Hola ${name}!${startText}`;
     
     bot.sendMessage(chatId, message);
});

bot.onText(/^\/ingresos (.+)/, (msg, match) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let name = msg.from.first_name;
     let revenue = match[1];
     let createdAt = new Date().getTime();
     let insertQuery = `insert into users (id,name,revenue,created_at) values (${userId},'${name}',${revenue},${createdAt});`;
     let updateQuery = `update users set revenue = ${revenue} where id = ${userId};`

     queryDatabase(insertQuery).then(function (result) {
          bot.sendMessage(chatId, revenueInsertText);
     }).catch(function (err) {
          queryDatabase(updateQuery).then(function (result) {
               bot.sendMessage(chatId, revenueUpdateText);
          }).catch(function (err) {
               sendErrorMessageToBot(chatId);
          });
     });
});

bot.onText(/^\/acciones/, (msg) => {
     let chatId = msg.chat.id;

     var buttonData = []               
     buttonData.push({text: totalRevenueOptionText, callback_data: totalRevenueOptionText}); 
     buttonData.push({text: cancelText, callback_data: cancelText});

     let buttons = {
          reply_markup: {
               inline_keyboard: [
                    buttonData
               ]
          }
     }
     
     bot.sendMessage(chatId, actionsTitleText, buttons);
});

bot.onText(/^\/borrar/, (msg) => {
     let chatId = msg.chat.id;
     let userId = msg.from.id;
     let deleteQuery = `delete from users where id = ${userId};`;

     queryDatabase(deleteQuery).then(function (result) {
          bot.sendMessage(chatId, deleteUserText);
     }).catch(function (err) {
          sendErrorMessageToBot(chatId);
     });
});

bot.on('callback_query', function onCallbackQuery(action) {
     let chatId = action.message.chat.id;
     let userId = action.from.id;
     let data = action.data;
     let selectQuery = `select revenue from users where id = '${userId}';`

     if (data == totalRevenueOptionText) {
          queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    bot.sendMessage(chatId, zeroRevenueText);
               } else {
                    let json = JSON.stringify(result.rows[0]);
                    let obj = JSON.parse(json);
                    let revenue = {
                         amount: obj.revenue
                    };
                    
                    bot.sendMessage(chatId, `Tus ingresos totales son ${formatter.format(revenue.amount)} €.`);
               }
          }).catch(function (err) {
               sendErrorMessageToBot(chatId);
          });
     } else if (data == cancelText) {
          bot.sendMessage(chatId, cancelActionsText);
     }
});

function queryDatabase(query) {
     return new Promise(function (resolve, reject) {
          pool.connect(function(err, client, done) {
               if (err) {
                    reject(err);
               } else {
                    client.query(query, function(error, result) {
                         done();
                         if (error) {
                              reject(error);
                         } else {
                              resolve(result);
                         }
                    });
               }
          });
     });
};

function sendErrorMessageToBot(chatId) {
     bot.sendMessage(chatId, generalErrorText);
};