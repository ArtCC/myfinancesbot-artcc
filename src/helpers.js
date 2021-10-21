const localization = require('./src/localization');

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
module.exports.getCommands = getCommands;
module.exports.log = log;