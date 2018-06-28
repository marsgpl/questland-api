//

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    $.get("/reforge/api/event?ts=" + Date.now(), function(config) {
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
