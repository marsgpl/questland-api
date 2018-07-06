//

var nameFilter = /[^0-9a-z_]/ig;

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

var getQsParams = function(qs) {
    qs = (qs || window.location.search).replace(/^\?+/, "").split("&");
    var kv = {}, pair;
    for ( var i=0; i<qs.length; ++i ) {
        pair = qs[i].split("=");
        kv[pair.shift()] = pair.join("=");
    }
    return kv;
};

var showPrompt = function() {
    $("#introduce").removeClass("hidden");
    $("#events").addClass("inactive");
};

var hidePrompt = function() {
    $("#introduce").addClass("hidden");
    $("#events").removeClass("inactive");
};

var submitPrompt = function(uid) {
    if ( !uid && suggest.cursor > -1 ) {
        uid = suggest.match[suggest.cursor];
    }

    if ( !uid && suggest.first ) {
        uid = suggest.first;
    }

    if ( uid ) {
        window.location.href += "?uid=" + uid;
    }
};

var setNicknameBg = function(userName) {
    var curr = $("#nickname").val();
    $("#nicknamebg").val(curr + userName.substr(curr.length)).show();
};

var suggest = function(match = []) {
    suggest.first = null;
    suggest.match = match;
    suggest.cursor = -1;

    if ( suggest.match.length ) {
        $("#suggest").show().empty();
        $("#submit").show();

        for ( var i=0; i<suggest.match.length; ++i ) {
            var userId = suggest.match[i];
            var userName = suggest.membersOriginal[userId];

            $("#suggest").append('<div class="name" data-uid="'+userId+'">'+userName+'</div>');

            if ( !suggest.first ) {
                suggest.first = userId;
            }

            if ( (i == suggest.cursor) || (suggest.cursor < 0 && suggest.first == userId) ) {
                setNicknameBg(userName);
            }
        }
    } else {
        $("#suggest").hide().empty();
        $("#submit").hide();
        $("#nicknamebg").hide();
    }
};

var resuggest = function() {
    var nodes = $("#suggest").find(".name");

    for ( var i=0; i<nodes.length; ++i ) {
        if ( i===suggest.cursor ) {
            $(nodes[i]).addClass("cur");
            setNicknameBg(suggest.membersOriginal[suggest.match[i]]);
        } else {
            $(nodes[i]).removeClass("cur");
        }
    }
};

var autocompletePrompt = function() {
    var value = $("#nickname").val().replace(nameFilter, "");

    if ( value != $("#nickname").val() ) {
        $("#nickname").val(value);
    }

    value = value.toLowerCase();

    if ( value === autocompletePrompt.value ) {
        return;
    }

    autocompletePrompt.value = value;

    var match = [];

    if ( value.length > 0 ) {
        for ( var userId in suggest.members ) {
            if ( value === suggest.members[userId].substr(0, value.length) ) {
                match.push(userId);

                if ( match.length > 5 ) {
                    break;
                }
            }
        }
    }

    suggest(match);
};

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    var uid = getQsParams().uid;

    var ms = Date.now();
    var tz = (new Date).getTimezoneOffset();

    $.get("/reforge/api/event?ms="+ms+"&tz="+tz, function(data) {
        suggest.members = {};
        suggest.membersOriginal = data.members;

        for ( var userId in data.members ) {
            suggest.members[userId] = data.members[userId].replace(nameFilter, "").toLowerCase();
        }

        if ( !uid ) {
            $("#introduce").on("click", function(e) {
                if ( $(e.target).hasClass("shadow") ) {
                    hidePrompt();
                }
            });

            $("#introduce .body .close").on("click", hidePrompt);

            $("#submit").on("click", function() { submitPrompt(); });

            $(window).on("keydown", function(e) {
                var key = e.keyCode || e.which;

                if ( key == 27 ) { // esc
                    hidePrompt();
                }
            });

            $("#nickname").on("keydown", function(e) {
                var key = e.keyCode || e.which;

                if ( key == 13 ) { // enter
                    submitPrompt();
                } else if ( key == 38 ) { // up
                    if ( suggest.match.length < 1 ) {
                        return;
                    }

                    suggest.cursor--;

                    if ( suggest.cursor < 0 ) {
                        suggest.cursor = suggest.match.length - 1;
                    }

                    resuggest();
                } else if ( key == 40 ) { // down
                    if ( suggest.match.length < 1 ) {
                        return;
                    }

                    suggest.cursor++;

                    if ( suggest.cursor >= suggest.match.length ) {
                        suggest.cursor = 0;
                    }

                    resuggest();
                }
            });

            $("#nickname").on("keypress keyup change focus blur input cut copy paste propertychange", function(e) {
                var key = e.keyCode || e.which;

                if ( key != 13 ) { // enter
                    autocompletePrompt();
                }
            });

            $("#suggest").on("click", function(e) {
                var target = $(e.target);

                if ( target.hasClass("name") ) {
                    submitPrompt(target.data("uid"));
                }
            });

            showPrompt();

            $("#nickname").focus();
        }

        var colors = [
            "#A8201A",
            "#EC9A29",
            "#0F8B8D",
            "#143642",
            "#266F34",

            "#9D1DB2",
            "#EC1562",
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

        var colorCurrent = "#FF852D";
        var colorFaded = "#B1B1B1";

        var labels = [];

        var i;

        for ( i=0; i<data.labels.length; ++i ) {
            labels.push(new Date(data.labels[i] * 1000));
        }

        var datasets = [];

        var colorN = 0;
        var color, dataset, points, pk;

        var hasCurrent = !!uid;
        var currentDatasetIndex = null;

        for ( i=0; i<data.datasets.length; ++i ) {
            var userId = data.datasets[i].userId;
            var current = (uid == userId);

            if ( hasCurrent ) {
                if ( current ) {
                    color = colorCurrent;
                    currentDatasetIndex = i;
                } else {
                    color = colorFaded;
                }
            } else {
                color = colors[colorN];

                colorN++;

                if ( colorN >= colors.length ) {
                    colorN = 0;
                }
            }

            dataset = data.datasets[i];

            points = [];

            for ( pk in dataset.data ) {
                points.push({
                    x: new Date(pk * 1000),
                    y: dataset.data[pk],
                });
            }

            datasets.push({
                label: (current ? "#"+i : "") + dataset.label,
                fill: false,
                borderColor: color,
                backgroundColor: color,
                pointBorderColor: color,
                pointBackgroundColor: color,
                pointRadius: 0,
                pointHitRadius: 10,
                pointHoverRadius: 3,
                borderWeight: 0,
                data: points,
                cubicInterpolationMode: "monotone",
                borderWidth: current ? 3 : 1,
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
                            labelString: "Trophies (skulls)",
                        },
                        ticks: {
                            min: 0,
                            max: data.yMax * 1.2 - data.yMax * 1.2 % 500000,
                            callback: function(value, index, values) {
                                return formatScoreCommas(value);
                            },
                        },
                    }],
                },
                tooltips: {
                    mode: "nearest",
                    callbacks: {
                        label: function(item, data) {
                            var userAndScore = data.datasets[item.datasetIndex].label.split("  ")[0]
                                + ": " + formatScoreCommas(item.yLabel);

                            var rank = 0;

                            var ranked = [];

                            for ( var di=0; di<data.datasets.length; ++di ) {
                                ranked.push({
                                    v: data.datasets[di].data[item.index] && data.datasets[di].data[item.index].y || 0,
                                    di,
                                })
                            }

                            ranked.sort(function(a, b) {
                                if ( a.v > b.v ) {
                                    return -1;
                                } else if ( a.v < b.v ) {
                                    return +1;
                                } else {
                                    return 0;
                                }
                            });

                            for ( var i=0; i<ranked.length; ++i ) {
                                if ( ranked[i].di == item.datasetIndex ) {
                                    if ( ranked[i].v == 0 ) {
                                        rank = "N/A";
                                    } else {
                                        rank = "#"+(i+1);
                                    }

                                    break;
                                }
                            }

                            return [
                                userAndScore,
                                "Rank " + rank,
                            ];
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

    var now = new Date;
    var msToReload = (60 - now.getMinutes()) * 61 * 1000;

    if ( window.console ) { console.log("Reload in " + (msToReload/1000/60) + "m"); }

    setTimeout(function() {
        window.location.reload();
    }, msToReload);
});
