//

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
    return (score+"").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    var ms = Date.now();
    var tz = (new Date).getTimezoneOffset();

    $.get("/reforge/api/eventTeams?ms="+ms+"&tz="+tz, function(data) {
        var labels = [];

        var i;

        for ( i=0; i<data.labels.length; ++i ) {
            labels.push(new Date(data.labels[i] * 1000));
        }

        var datasets = [];

        var dataset, points, pk;

        for ( i=0; i<data.datasets.length; ++i ) {
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
                borderColor: dataset.color,
                backgroundColor: dataset.color,
                pointBorderColor: dataset.color,
                pointBackgroundColor: dataset.color,
                pointRadius: 1,
                pointHitRadius: 10,
                pointHoverRadius: 3,
                borderWeight: 0,
                data: points,
                cubicInterpolationMode: "monotone",
                borderWidth: 3,
                meta: {
                    personal: dataset.personal,
                    persons: dataset.persons,
                },
            });
        }

        var config = {
            type: "line",
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: "Teams event score",
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
                            labelString: "Trophies (skulls)",
                        },
                        ticks: {
                            min: 0,
                            max: (data.yMax * 1.1 - data.yMax * 1.1 % ((data.yMax/9) % 500000)) || 1000,
                            callback: function(value, index, values) {
                                return formatScore(value);
                            },
                        },
                    }],
                },
                tooltips: {
                    mode: "nearest",
                    callbacks: {
                        label: function(item, data) {
                            var dataset = data.datasets[item.datasetIndex];

                            var strings = [
                                dataset.label.split("  ")[0] + ": " + formatScoreCommas(item.yLabel),
                                "",
                            ];

                            var date = dataset.data[item.index].x;
                            var dateNumber = Math.round(date.getTime()/1000);

                            var members = [];

                            for ( var name in dataset.meta.personal ) {
                                members.push({
                                    name,
                                    score: parseInt(dataset.meta.personal[name][dateNumber], 10) || 0,
                                });
                            }

                            members.sort(function(a, b) {
                                if ( a.score > b.score ) {
                                    return -1;
                                } else if ( a.score < b.score ) {
                                    return +1;
                                } else {
                                    return 0;
                                }
                            });

                            for ( var mi=0; mi<members.length; ++mi ) {
                                strings.push(members[mi].name + ": " + formatScore(members[mi].score));
                            }

                            strings.push("");
                            strings.push(dataset.meta.persons + " members");

                            return strings;
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

        $("#loader").remove();
    });

    var now = new Date;
    var msToReload = (60 - now.getMinutes()) * 61 * 1000;

    if ( window.console ) { console.log("Reload in " + (msToReload/1000/60) + "m"); }

    setTimeout(function() {
        window.location.reload();
    }, msToReload);
});
