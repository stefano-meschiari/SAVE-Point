"use strict";

var CutScene = Backbone.View.extend({
    BUTTON_SKIP: "<button id='cutscene-skip' onClick='app.trigger(\"end-cutscene\");'style='position:absolute; left:20px; bottom:20px; font-size:22px' class='btn btn-jrs'><span class='fa fa-forward'></span> Skip</button>",
    
    initialize: function() {
        var self = this;
        var app = this.model;
        var mission = app.mission();
        var name = mission.get('name');
        if (_.detect(app.get('cutscenesPlayed', name))) {
            app.menu();
            return;
        }

        this.render();
        app.once("startLevel", function() {
            $("body").append(self.BUTTON_SKIP);
        });
        
        app.once("end-cutscene", function() {
            app.get('cutscenesPlayed').push(name);
            app.saveMissionData();
            app.menu();
            _.defer(function() {
                self.tearDown();
            });
        });
    },

    render: function() {
        $("html").addClass("cutscene");
    },

    tearDown: function() {
        $("#cutscene-skip").remove();
        $("html").removeClass("cutscene");
    }        
});

app.components['cutscene'] = CutScene;
