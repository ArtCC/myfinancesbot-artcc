const constants = require('./constants');
const helpers = require('./helpers');
const localization = require('./localization');
const QuickChart = require('quickchart-js');
const util = require('util');

function createChartForTotalWallet(languageCode) {
    return new Promise(function (resolve, reject) {
        let myChart = new QuickChart();
        myChart
            .setConfig({
                type: 'doughnut',
                data: {
                    labels: ["Data 1", "Data 2", "Data 3"],
                    datasets: [{
                        data: [300, 500, 900]
                    }]
                },
                options: {
                    plugins: {
                        datalabels: {
                            display: true,
                            backgroundColor: '#ccc',
                            borderRadius: 3,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        doughnutlabel: {
                            labels: [{
                                text: "Total: 1.700",
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }]
                        }
                    }
                }
            })
            .setWidth(800)
            .setHeight(400)
            .setBackgroundColor('transparent');

        let response = {
            message: "Mensaje",
            urlChart: myChart.getUrl()
        }

        resolve(response);
    });
};

module.exports.createChartForTotalWallet = createChartForTotalWallet;