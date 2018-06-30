//

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    var formatScore = function(score) {
        score = parseInt(score, 10) || 0;

        if ( score < 1000 ) {
            return score;
        } else if ( score < 1000000 ) {
            return Math.floor(score / 100) / 10 + "k";
        } else {
            return Math.floor(score / 100000) / 10 + "M";
        }

        return score;
    };

    var formatScoreCommas = function(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    $.get("/reforge/api/event?ts=" + Date.now(), function(data) {
        var colors = [
            "#A8201A",
            "#EC9A29",
            "#0F8B8D",
            "#143642",
            "#DAD2D8",

            "#A9FFCB",
            "#B6EEA6",
            "#C0B298",
            "#A4778B",
            "#AA4586",

            "#FCB07E",
            "#3581B8",
            "#44AF69",
            "#F8333C",
            "#FCAB10",

            "#2B9EB3",
            "#3E78B2",
            "#004BA8",
            "#4A525A",
            "#24272B",
        ];

        var labels = [];

        var i;

        for ( i=0; i<data.labels.length; ++i ) {
            labels.push(new Date(data.labels[i] * 1000));
        }

        var datasets = [];

        var colorN = 0;
        var color, dataset, points, pk;

        for ( i=0; i<data.datasets.length; ++i ) {
            color = colors[colorN];

            colorN++;

            if ( colorN >= colors.length ) {
                colorN = 0;
            }

            dataset = data.datasets[i];

            points = [];

            for ( pk in dataset.data ) {
                points.push({
                    x: new Date(pk * 1000),
                    y: dataset.data[pk],
                })
            }

            datasets.push({
                label: dataset.label,
                fill: false,
                borderColor: color,
                backgroundColor: color,
                pointBorderColor: color,
                pointBackgroundColor: color,
                pointRadius: 0,
                pointHitRadius: 5,
                borderWeight: 0,
                data: points,
                cubicInterpolationMode: "monotone",
                borderWidth: 1,
            });
        }

        var config = {
            type: "line",
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: "Personal event score",
                },
                animation: {
                    duration: 0, // general animation time
                },
                hover: {
                    animationDuration: 0, // duration of animations when hovering an item
                },
                responsiveAnimationDuration: 0, // animation duration after a resize
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5,
                    }
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "Date",
                        },
                        type: "time",
                        time: {
                            unit: "day",
                            tooltipFormat: "DD MMMM  HH:mm",
                        },
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "Trophies",
                        },
                        ticks: {
                            min: 0,
                        },
                    }],
                },
                tooltips: {
                    callbacks: {
                        label: function(item, data) {
                            return data.datasets[item.datasetIndex].label.split("  ")[0]
                                + ": " + formatScoreCommas(item.yLabel)
                        },
                    },
                },
            },
            data: {
                labels,
                datasets,
            },
        };

        var myChart = new Chart(ctx, config);

        $("#toggle").click(function() {
            myChart.data.datasets.forEach(function(ds) {
                ds.hidden = !ds.hidden;
            });

            myChart.update();
        });

        $("#loader").remove();
    });

    setTimeout(function() {
        window.location.reload();
    }, 30 * 60 * 1000);
});
