$(document).ready(function() {

    $("#menu").on("click", function() {
        $("#sidebar").toggleClass("expanded");
    });

    $("#help").on("click", function() {
        $("#help-bottom").toggleClass("expanded");
    });
    
});
