const axios = require('axios');
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

function addSubscription(userId, name, price, type, date, languageCode) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into subscriptions (user_id,name,price,type,date) values (${userId},'${name}',${price},'${type}','${date}');`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve(util.format(localization.getText("addSubscriptionText", languageCode), type, name, price));
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function addTotalRevenue(userId, name, revenue, languageCode) {
     return new Promise(function (resolve, reject) {
          let createdAt = new Date().getTime();
          let insertQuery = `insert into users (id,name,revenue,created_at) values (${userId},'${name}',${revenue},${createdAt});`;
          let updateQuery = `update users set revenue = ${revenue} where id = ${userId};`

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

function deleteUser(userId, languageCode) {
     return new Promise(function (resolve, reject) {
          let deleteUserQuery = `delete from users where id = ${userId};`;

          queryDatabase(deleteUserQuery).then(function (result) {
               helpers.log(result);

               let deleteSubscriptionsQuery = `delete from subscriptions where id = ${userId};`;

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

function getTotalRevenue(userId, languageCode) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select revenue from users where id = '${userId}';`

          queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    resolve(localization.getText("zeroRevenueText", languageCode));
               } else {
                    let json = JSON.stringify(result.rows[0]);
                    let obj = JSON.parse(json);
                    let revenue = {
                         amount: obj.revenue
                    };

                    let total = util.format(localization.getText("totalRevenueText", languageCode), helpers.formatterAmount(2, 2).format(revenue.amount));

                    resolve(total);
               }
          }).catch(function (err) {
               helpers.log(err);
               reject(err);
          });
     });
};

function getSubscriptions(userId, languageCode) {
     return new Promise(function (resolve, reject) {
          let selectQuery = `select (name,price,type,date) from subscriptions where user_id = ${userId};`

          queryDatabase(selectQuery).then(function (result) {
               if (result.rows.length == 0) {
                    resolve(localization.getText("zeroSubscriptionsText", languageCode));
               } else {
                    var message = util.format(localization.getText("AllSubscriptionsText", languageCode));

                    for (let row of result.rows) {
                         let json = JSON.stringify(row);
                         let obj = JSON.parse(json);
                         let subscription = {
                              name: obj.name,
                              price: obj.price,
                              type: obj.type,
                              date: obj.date
                         };

                         message += `<b>${obj.name}:</b> ${helpers.formatterAmount(2, 2).format(obj.price)} € - ${obj.type} - ${obj.date}\n`;
                    }

                    resolve(message);
               }
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

module.exports.addSubscription = addSubscription;
module.exports.addTotalRevenue = addTotalRevenue;
module.exports.deleteUser = deleteUser;
module.exports.getTotalRevenue = getTotalRevenue;
module.exports.getSubscriptions = getSubscriptions;