const QuickChart = require('quickchart-js');

function createChartForTotalWallet(message, labels, data) {
    return new Promise(function (resolve, reject) {
        let myChart = new QuickChart();
        myChart
            .setConfig({
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data
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
            message: message,
            urlChart: myChart.getUrl()
        }

        resolve(response);
    });
};

module.exports.createChartForTotalWallet = createChartForTotalWallet;