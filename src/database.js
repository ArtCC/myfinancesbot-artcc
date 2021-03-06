const axios = require('axios');
const charts = require('./charts');
const constants = require('./constants');
const helpers = require('./helpers');
const localization = require('./localization');
const { Pool } = require('pg');
const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
          rejectUnauthorized: false
     }
});
const util = require('util');

function addSubscription(userId, chatId, name, price, type, date, languageCode) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into subscriptions (user_id,chat_id,name,price,type,date) values (${userId},${chatId},'${name}',${price},'${type}','${date}');`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               let message = util.format(localization.getText("addSubscriptionText", languageCode), type, name, price);
               resolve(message);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function addTotalRevenue(userId, chatId, name, revenue, languageCode) {
     return new Promise(function (resolve, reject) {
          let createdAt = new Date().getTime();
          let insertQuery = `insert into users (user_id,chat_id,name,revenue,created_at) values (${userId},${chatId},'${name}',${revenue},${createdAt});`;
          let updateQuery = `update users set revenue = ${revenue} where user_id = ${userId};`

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("revenueInsertText", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               queryDatabase(updateQuery).then(function (result) {
                    helpers.log(result);
                    resolve(localization.getText("revenueUpdateText", languageCode));
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          });
     });
};

function deleteSubscription(userId, subscriptionId, languageCode) {
     return new Promise(function (resolve, reject) {
          let deleteQuery = `delete from subscriptions where id = ${subscriptionId} and user_id = ${userId};`;

          queryDatabase(deleteQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("deleteSubscriptionOkText", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function deleteUser(userId, languageCode) {
     return new Promise(function (resolve, reject) {
          let deleteUserQuery = `delete from users where user_id = ${userId};`;

          queryDatabase(deleteUserQuery).then(function (result) {
               helpers.log(result);

               let deleteSubscriptionsQuery = `delete from subscriptions where user_id = ${userId};`;

               queryDatabase(deleteSubscriptionsQuery).then(function (result) {
                    helpers.log(result);
                    resolve(localization.getText("deleteUserText", languageCode));
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getAllChatId() {
     return new Promise(function (resolve, reject) {
          let selectQuery = "select * from update;";

          queryDatabase(selectQuery).then(function (result) {
               var collection = [];
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let update = {
                         chatId: obj.chat_id
                    };
                    collection.push(update.chatId);
               }
               resolve(collection);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getAllSubscriptions() {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select * from subscriptions;`

          queryDatabase(selectQuery).then(function (result) {
               var subscriptions = [];
               for (let row of result.rows) {
                    let json = JSON.stringify(row);
                    let obj = JSON.parse(json);
                    let subscription = {
                         subscriptionId: obj.id,
                         userId: obj.user_id,
                         chatId: obj.chat_id,
                         name: obj.name,
                         price: obj.price,
                         type: obj.type,
                         date: obj.date
                    };
                    subscriptions.push(subscription);
               }
               resolve(subscriptions);
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getSubscriptions(userId, languageCode, forDelete, forResume) {
     return new Promise(function (resolve, reject) {
          var selectQuery = "";

          if (forResume) {
               selectQuery = `select * from subscriptions where user_id = ${userId} and type = 'mensual';`
          } else {
               selectQuery = `select * from subscriptions where user_id = ${userId};`
          }

          queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    resolve(localization.getText("zeroSubscriptionsText", languageCode));
               } else {
                    var subscriptions = [];
                    for (let row of result.rows) {
                         let json = JSON.stringify(row);
                         let obj = JSON.parse(json);
                         let subscription = {
                              subscriptionId: obj.id,
                              name: obj.name,
                              price: obj.price,
                              type: obj.type,
                              date: obj.date
                         };
                         subscriptions.push(subscription);
                    }

                    if (forDelete) {
                         var buttonData = []

                         let sortedSubscriptions = subscriptions.sort((a, b) => (a.name > b.name) ? 1 : -1);
                         sortedSubscriptions.forEach(sub => {
                              let nameText = helpers.capitalizeFirstLetter(sub.name);
                              let callbackData = localization.getText("subscriptionPreData", languageCode);
                              buttonData.push([{ text: nameText, callback_data: `${callbackData}${sub.subscriptionId}` }]);
                         });
                         buttonData.push([{
                              text: localization.getText("cancelText", languageCode),
                              callback_data: localization.getText("cancelText", languageCode)
                         }]);

                         resolve(buttonData);
                    } else if (forResume) {
                         resolve(subscriptions);
                    } else {
                         var message = util.format(localization.getText("AllSubscriptionsText", languageCode));

                         let sortedSubscriptions = subscriptions.sort((a, b) => (b.price > a.price) ? 1 : -1);
                         sortedSubscriptions.forEach(sub => {
                              let name = helpers.capitalizeFirstLetter(sub.name);
                              let price = helpers.formatterAmount(2, 2).format(sub.price);

                              message += `<b>${name}:</b> ${price} ??? / ${sub.type} / ${sub.date}\n`;
                         });

                         resolve(message);
                    }
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getTotalRevenue(userId, languageCode, forResume) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select revenue from users where user_id = '${userId}';`

          queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    resolve(localization.getText("zeroRevenueText", languageCode));
               } else {
                    let json = JSON.stringify(result.rows[0]);
                    let obj = JSON.parse(json);
                    let revenue = {
                         amount: obj.revenue
                    };

                    if (forResume) {
                         resolve(revenue.amount);
                    } else {
                         let total = util.format(localization.getText("totalRevenueText", languageCode), helpers.formatterAmount(2, 2).format(revenue.amount));

                         resolve(total);
                    }
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getUserDataSummary(userId, languageCode) {
     return new Promise(function (resolve, reject) {
          var totalRevenue = 0;
          var totalSubscriptions = 0;
          getTotalRevenue(userId, languageCode, true).then(function (total) {
               totalRevenue = total;

               getSubscriptions(userId, languageCode, false, true).then(function (subscriptions) {
                    subscriptions.forEach(subscription => {
                         totalSubscriptions += subscription.price;
                    });

                    let title = `${util.format(localization.getText("resumeTitle", languageCode), helpers.formatterAmount(2, 2).format(totalRevenue))} ???`;
                    let message = "";
                    let labels = [
                         localization.getText("resumeAvailableTitle", languageCode),
                         localization.getText("resumeSubscriptionsTitle", languageCode)
                    ];
                    let available = totalRevenue.toFixed(2) - totalSubscriptions.toFixed(2);
                    let data = [
                         available,
                         totalSubscriptions.toFixed(2)
                    ];

                    charts.createChartForTotalWallet(title, message, labels, data).then(function (response) {
                         resolve(response);
                    }).catch(function (err) {
                         helpers.log(err);
                         reject(err);
                    });
               }).catch(function (err) {
                    helpers.log(err);
                    reject(err);
               });
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function queryDatabase(query) {
     return new Promise(function (resolve, reject) {
          pool.connect(function (err, client, done) {
               if (err) {
                    reject(err);
               } else {
                    client.query(query, function (error, result) {
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

function setChatIdForUpdate(chatId, languageCode) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into update (chat_id) values (${chatId});`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("success", languageCode));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

module.exports.addSubscription = addSubscription;
module.exports.addTotalRevenue = addTotalRevenue;
module.exports.deleteSubscription = deleteSubscription;
module.exports.deleteUser = deleteUser;
module.exports.getAllChatId = getAllChatId;
module.exports.getAllSubscriptions = getAllSubscriptions;
module.exports.getTotalRevenue = getTotalRevenue;
module.exports.getSubscriptions = getSubscriptions;
module.exports.getUserDataSummary = getUserDataSummary;
module.exports.setChatIdForUpdate = setChatIdForUpdate;