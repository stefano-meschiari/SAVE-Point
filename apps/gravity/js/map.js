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

    rootLevel: function() {
        return this.model.get('map')[this.model.mission().get('worldidx')].levels[0];
    },
    
    scanLevels: function(world, levels, missions, prev) {
        console.log(levels);
        for (var i = 0; i < levels.length; i++)
            if (_.isString(levels[i])) {
                var name = levels[i];
                var m = app.mission(name);
                m.set('world', world.world);
                m.set('worldidx', world.worldidx);
                
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
        _.each(maps, function(map, i) {

            var levs = map.levels;
            self.scanLevels({ world: map.world, worldidx: i}, map.levels, missions);
        });
        
    },

    DIV_THUMB: '<div class="app-menu-mission-box <%= divclass %>"><%= content %></div>',
    DIV_ROW: '<div class="app-menu-mission-row"><%= row %></div>',
    
    renderTree: function(rl, posx, posy, rows) {
        
        var div = _.template(this.DIV_THUMB, { divclass: 'box' + posx, content: rl.get('name')} );
        if (rows[posy])
            rows[posy] += div;
        else
            rows[posy] = div;

        var next = rl.get('next');
        if (!next)
            return;
        
        if (next.length == 1)
            this.renderTree(this.model.mission(next[0]), posx, posy + 1, rows);
        else {
            if (next.length > 2)
                console.error("Error: limited to only two forks.");

            this.renderTree(this.model.mission(next[0]), posx + 'L', posy + 1, rows);
            this.renderTree(this.model.mission(next[1]), posx + 'R', posy + 1, rows);
        }
        
    },
    
    render: function() {
        var self = this;
        var state = this.model.get('state');
        var world = this.model.mission().get('world');
        var $el = this.$el;
        
        if (state === MENU) {
            $el.addClass("expanded");

            var rootLevelName = this.rootLevel();
            var rootLevel = this.model.mission(rootLevelName);
            var rows = [];
            this.renderTree(rootLevel, '', 0, rows);

            var t = '';
            _.each(rows, function(row) {
                t += _.template(self.DIV_ROW, { row: row }) + '\n';
            });
            console.log(t);

        } else {
            $el.removeClass("expanded");
        }
    }

    
});

