const emoji = require('node-emoji');
const localization = require('./localization');

function formatterAmount(minimum, maximum) {
    const formatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: minimum,
        maximumFractionDigits: maximum,
    });
    return formatter;
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

function getActions(languageCode) {
    let chartEmoji = emoji.get('bar_chart');
    let moneyEmoji = emoji.get('euro');
    let listEmoji = emoji.get('spiral_calendar_pad');
    let heartEmoji = emoji.get('heart');

    return [[{
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
};

function getCommands(languageCode) {
    return [{
        command: localization.getText("actionsCommandTitle", languageCode),
        description: localization.getText("actionsCommand", languageCode)
    },
    {
        command: localization.getText("deleteCommandTitle", languageCode),
        description: localization.getText("deleteCommand", languageCode)
    },
    {
        command: localization.getText("donateCommandTitle", languageCode),
        description: localization.getText("donateCommand", languageCode)
    },
    {
        command: localization.getText("revenueCommandTitle", languageCode),
        description: localization.getText("revenueCommand", languageCode)
    },
    {
        command: localization.getText("startCommandTitle", languageCode),
        description: localization.getText("startCommand", languageCode)
    },
    {
        command: localization.getText("subscriptionCommandTitle", languageCode),
        description: localization.getText("subscriptionCommand", languageCode)
    }];
};

function log(message) {
    console.log(message);
};

module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.formatterAmount = formatterAmount;
module.exports.getActions = getActions;
module.exports.getCommands = getCommands;
module.exports.log = log;