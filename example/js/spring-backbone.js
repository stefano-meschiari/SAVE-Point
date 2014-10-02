"use strict";

var Spring = Backbone.Model.extend({
    defaults: {
        k: 10,
        f: 0.4,
        x: 500,
        x_resting: 400,
        v: 0,
        dt: 0.02
    },

    update: function() {
        var k = this.get('k'),
            f = this.get('f'),
            x = this.get('x'),
            v = this.get('v'),
            x_resting = this.get('x_resting'),
            dt = this.get('dt');

        var a = - k * (x-x_resting) - f * v;
        x = x + v * dt;
        v = v + a * dt;
        this.set('x', x);
        this.set('v', v);
    }
    
});

var MainView = Backbone.View.extend({
    el: $("body"),
    
    events: {
        "click #start-button" : function() {
            this.start();
        }
    },
    
    initialize: function() {
        this.listenTo(this.model, "change:x", this.render);
    },

    update: function() {
        this.model.update();
        var self = this;
        window.requestAnimationFrame(function() {
            self.update();
        });
    },
    
    start: function() {
        $("#start-button").attr('disabled', true);
        $("#start-button").text("Waiting...");
        
        this.update();
    },

    render: function() {        
        $("#spring").css("width", this.model.get('x'));
    }
});

var InfoView = Backbone.View.extend({
    el: $("#info-table"),

    initialize: function() {
        this.listenTo(this.model, 'change:x', this.renderX);
        this.listenTo(this.model, 'change:v', this.renderV);        
    },

    renderX: function() {
        $("#position").text(this.model.get('x').toFixed(2));
    },

    renderV: function() {
        $("#speed").text(this.model.get('v').toFixed(2));
    }
});


$(document).ready(function() {
    var spring = new Spring();
    var mainView = new MainView({ model: spring });
    var infoView = new InfoView({ model: spring });
});
