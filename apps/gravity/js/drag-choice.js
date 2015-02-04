"use strict";

var DragChoice = Backbone.View.extend({
    QUESTION_TITLE: '<div class="question-title"><%= message %></div><ul class="uk-nestable" data-uk-nestable="{group:\'group\', maxDepth:1}"><%= listTop %></ul>',
    QUESTION_DRAG_TOP: '',
    QUESTION_ITEM: '<li><div class="uk-nestable-item"><div class="uk-nestable-handle"><%= option %></div></div></li>',
    QUESTION_WRAPPER: '<div class="question"><%= message %></div>',
    
    initialize: function() {
        var self = this;
        var app = this.model;
        var mission = app.mission();
        var help = app.templates.template({ message: mission.get('question') });

        help.listTop = _.map(mission.get('options'), function(o) {
            return _.template(self.QUESTION_ITEM, { option: o });
        }).join("");
        
        help.message = _.template(this.QUESTION_TITLE, help);
        var options = mission.get('options');
        var ulTop = this.QUESTION_DRAG_TOP;
        
        
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

app.components['drag-choice'] = DragChoice;
