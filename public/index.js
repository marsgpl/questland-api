//

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    $.get("/reforge/api/event?ts=" + Date.now(), function(data) {
        var i;

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

        for ( i=0; i<data.labels.length; ++i ) {
            labels.push(new Date(data.labels[i] * 1000));
        }

        var datasets = [];

        var colorN = 0;
        var color, dataset, points, pi;

        for ( i=0; i<data.datasets.length; ++i ) {
            color = colors[colorN];

            colorN++;

            if ( colorN >= colors.length ) {
                colorN = 0;
            }

            dataset = data.datasets[i];

            points = [];

            for ( p=0; p<dataset.data.length; p+=2 ) {
                points.push({
                    x: new Date(dataset.data[p] * 1000),
                })
            }

            for ( pi=0,p=1; p<dataset.data.length; p+=2, pi++ ) {
                points[pi].y = dataset.data[p];
            }

            datasets.push({
                label: dataset.label,
                score: dataset.score,
                fill: false,
                borderColor: color,
                backgroundColor: color,
                pointBorderColor: color,
                pointBackgroundColor: color,
                pointRadius: 0,
                pointHitRadius: 30,
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
                    text: "Trophies dynamics",
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
