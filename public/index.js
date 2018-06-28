//

$(function() {
    var htmlCanvas = document.getElementById("events");
    var ctx = htmlCanvas.getContext("2d");

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    $.get("/reforge/api/event?ts=" + Date.now(), function(config) {
        var myChart = new Chart(ctx, config);
    });
});
