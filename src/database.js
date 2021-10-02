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

function addSuscription(userId, name, price, type, languageCode) {
     return new Promise(function (resolve, reject) {
          let insertQuery = `insert into suscription (user_id,name,price,type) values (${userId},'${name}',${price},${type});`;

          queryDatabase(insertQuery).then(function (result) {
               helpers.log(result);
               resolve(util.format(localization.getText("addSuscriptionText", languageCode), type, name, price));
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
          let deleteQuery = `delete from users where id = ${userId};`;

          queryDatabase(deleteQuery).then(function (result) {
               helpers.log(result);
               resolve(localization.getText("deleteUserText", languageCode));
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

module.exports.addSuscription = addSuscription;
module.exports.addTotalRevenue = addTotalRevenue;
module.exports.deleteUser = deleteUser;
module.exports.getTotalRevenue = getTotalRevenue;