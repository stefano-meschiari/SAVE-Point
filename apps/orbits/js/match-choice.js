"use strict";

var MatchChoice = Backbone.View.extend({
    QUESTION_TITLE: '<div class="question-title"><%= message %></div>',
    QUESTION_ITEM: '<div class="question-row"><div class="question-label"><%= message %></div><div class="question-options uk-form"><select><%= options %></select></div></div>',    
    QUESTION_BOTTOM: '<div class="question-title"><button class="question-option btn btn-lg btn-jrs" onClick="app.trigger(\'answer\');">Answer</button></div>',
    QUESTION_WRAPPER: '<div class="question"><%= message %></div>',
    SEPARATOR: '<div class="separator-center"></div>',
    
    initialize: function() {
        var self = this;
        var app = this.model;
        var mission = app.mission();
        var help = app.templates.template({ message: mission.get('question') });
        help.message = _.template(this.QUESTION_TITLE)(help);

        this.options = mission.get('options');
        var choices = mission.get('choices');
        

        
        var options_html = _.map([""].concat(_.shuffle(_.clone(this.options))), function(c) { return "<option>" + c + "</option>"; }).join("");
        
        for (var i = 0; i < choices.length; i++) {
            help.message += this.SEPARATOR;
            var choice = choices[i];
            help.message += _.template(this.QUESTION_ITEM)({ message: choice, options:options_html });
        }
        
        help.message += this.SEPARATOR;        
        help.message += _.template(this.QUESTION_BOTTOM)({ message: mission.get('question-below') });
        help.message = _.template(this.QUESTION_WRAPPER)(help);
        
        this.help = help;

        this.listenToOnce(app, "startLevel", function() {
            self.render();
            $("#info-top").hide();
        });        

        this.listenTo(this.model, 'answer', this.answer);
    },

    render: function() {
        this.model.trigger('help', this.help);
    },

    answer: function(e) {
        var vals = $(".question select").map(function() { return $(this).val(); });
        var match = _.arrayEquals(vals, this.options);
        console.log(vals, this.options);
        
        if (match)
            this.model.win();
        else
            this.model.lose();
        
    }
});

app.components['match-choice'] = MatchChoice;
