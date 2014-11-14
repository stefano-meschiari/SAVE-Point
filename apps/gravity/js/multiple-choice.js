/*
 Implements a multiple-choice component.
 */

"use strict";

var MultipleChoices = Backbone.ROComputedModel.extend({
    defaults: {
        prompt: "Prompt",
        choices: [],
        correctChoice: -1,
        firstTime: false
    }
});


var MultipleChoicesView = Backbone.View.extend({

    initialize: function() {
        this.render();
    },

    render: function() {
        
    }
    
});
