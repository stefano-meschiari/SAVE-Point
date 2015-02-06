"use strict";

var App = Backbone.ROComputedModel.extend({
    // Fill in model properties here
});

var AppView = Backbone.View.extend({
    // Fill in view properties here
});


var app = new App();

$(document).ready(function() {
    app.view = new AppView({ model: app });
});

