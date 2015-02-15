"use strict";

var SingleChoice = Backbone.View.extend({
    QUESTION_TITLE: '<div class="question-title"><%= message %></div>',
    QUESTION_ITEM: '<div><button class="question-option btn btn-lg btn-jrs " onClick="app.trigger(\'answer\', <%= index %>);"><%= message %></button></div>',
    QUESTION_BOTTOM: '<div class="question-title"><%= message %></div>',
    QUESTION_WRAPPER: '<div class="question"><%= message %></div>',
    
    initialize: function() {
        var app = this.model;
        var mission = app.mission();
        var help = app.templates.template({ message: mission.get('question') });
        help.message = _.template(this.QUESTION_TITLE)(help);

        var choices = mission.get('choices');
        for (var i = 0; i < choices.length; i++)
            help.message += _.template(this.QUESTION_ITEM)({ message: choices[i], index: i  });
        help.message += _.template(this.QUESTION_BOTTOM)({ message: mission.get('question-below') });
        help.message = _.template(this.QUESTION_WRAPPER)(help);
        
        this.help = help;
        this.render();
        $("#info-top").hide();

        this.listenTo(this.model, 'answer', this.answer);
    },

    render: function() {
        this.model.trigger('help', this.help);
    },

    answer: function(e) {
        if (e == this.model.mission().get('answer'))
            this.model.win();
        else
            this.model.lose();
    }
});

app.components['single-choice'] = SingleChoice;
