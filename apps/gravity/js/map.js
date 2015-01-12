/*
 * Reads in the map.yaml and transforms it into linear arrays.
 */

"use strict";


var AppMenuView = Backbone.View.extend({
    // Top-level container
    el: $("#app-menu"),

    initialize: function() {
        this.listenTo(this.model, "change:state", this.render);

        var maps = this.model.get('map');
        var missions = this.model.get('missions');

        this.setupMaps(maps, missions);
    },

    scanLevels: function(world, levels, missions, prev) {
        console.log(levels);
        for (var i = 0; i < levels.length; i++)
            if (_.isString(levels[i])) {
                var name = levels[i];
                var m = app.mission(name);
                m.set('world', world);

                if (prev) {
                    m.set('prev', prev.get('name'));
                    if (prev.get('next')) {
                        prev.get('next').push(name);
                    } else
                        prev.set('next', [name]);                    
                }
                                
                prev = m;
            } else if (levels[i].fork)
                for (var j = 0; j < levels[i].fork.length; j++)
                    this.scanLevels(world, levels[i].fork[j], missions, prev);        
    },

    setupMaps: function(maps, missions) {
        var self = this;
        _.each(maps, function(map) {

            var levs = map.levels;
            self.scanLevels(map.world, map.levels, missions);
        });
        
    },
    
    render: function() {
        var state = this.model.get('state');
        var $el = this.$el;
        
        if (state === MENU) {
            $el.addClass("expanded");
            $("#app-menu-map").css('background-image', 'url(' + app.get('map')[0].bg + ')');
//            this.renderMissionMenu();
        } else {
            $el.removeClass("expanded");
        }

    }

    
});

