/*
 * Reads in the map.yaml and transforms it into a tree.
 */

"use strict";

var mapPlumb;

var AppMenuView = Backbone.View.extend({
    selectedMission: null,
    el: $("#app-menu"),
    currentWorld: 0,
    currentWorldName: null,
    
    events: {
        "click #app-menu-start": function() { this.start(); }
    },
    
    initialize: function() {
        this.listenTo(this.model, "change:state", this.render);
        var maps = this.model.get('map');
        this.currentWorldName = this.model.get('map')[this.currentWorld].world;
        var missions = this.model.get('missions');
        this.selectedMission = this.model.mission().get('name');
        this.setupMaps(maps, missions);

        if (device.ios() || device.mobile()) {
            this.DIV_THUMB = this.DIV_THUMB_MOBILE;
        }
    },

    start: function() {
        this.model.sounds.playEffect('clickety');
        this.model.setMission(this.selectedMission);
    },
    
    rootLevel: function() {
        return this.model.get('map')[this.currentWorld].levels[0];
    },
    
    scanLevels: function(world, levels, missions, prev) {
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

    
    DIV_THUMB: _.template('<div class="<%= divclass %>"><button id="app-menu-mission-box-<%= name %>" class="app-menu-mission-box <%= icon %> <%= allowed %>" title="<%= title %>" data-uk-tooltip="{pos: \'right\', offset:10}"></button></div>'),
    DIV_THUMB_MOBILE: _.template('<div class="<%= divclass %>"><button id="app-menu-mission-box-<%= name %>" class="app-menu-mission-box <%= icon %> <%= allowed %>" title="<%= title %>"></button></div>'),
    DIV_ROW: _.template('<div class="app-menu-mission-row"><%= row %><div class="clear"></div></div>'),
    
    renderTree: function(rl, posx, posy, rows) {
        var app = this.model;
        var self = this;
        var prev = rl.get('prev');
        
        var allowed = false;
        if (!prev)
            allowed = true;
        else if (prev && app.mission(prev).get('completed'))
            allowed = true;

        var selected = app.mission().get('name') === rl.get('name');
        
        var div = this.DIV_THUMB({ divclass: 'box' + posx, name: rl.get('name'), icon: rl.get('icon') + '-b', allowed: (allowed ? '' : 'app-menu-mission-locked'), title: rl.get('title') } );
        if (rows[posy])
            rows[posy] += div;
        else
            rows[posy] = div;

        if (allowed)
            _.defer(function() {
                $("#app-menu-mission-box-" + rl.get('name')).on("click", function() {
                    self.select(rl.get('name'));
                });
            });
        
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

        _.defer(function() {
            _.each(next, function(name) {
                mapPlumb.connect({ source: "app-menu-mission-box-" + rl.get('name'),
                                   target: "app-menu-mission-box-" + name,
                                   anchor: "AutoDefault"
                                 });
            });
        });

    },

    select: function(name) {
        var app = this.model;
        var mission = app.mission(name);
        $(".app-menu-mission-box").removeClass("app-menu-mission-box-selected");
        $("#app-menu-mission-box-" + name).addClass("app-menu-mission-box-selected");

        $("#app-menu-mission-title").html(mission.get('title'));
        $("#app-menu-mission-stars").html(app.templates.starsRepr(mission.get('stars'), mission.get('value')));
        var intro = '';
        if (mission.get('intro')) {
            var help = { message: mission.get('intro') };
            app.templates.template(help);
            intro = help.message;
        }
        
        $("#bubble-text").html(intro);
        this.selectedMission = name;        
    },

    selectNextMission: function() {
        var app = this.model;
        var mission = app.mission();
        if (!mission.get('next'))
            return;
        else
            this.selectedMission = mission.get('next')[0];
    },
    
    render: function() {
        var self = this;
        var app = this.model;
        var state = app.get('state');
        var world = this.currentWorldName;
        var world_props = _.where(app.get('map'), { world: world })[0];
        
        var $el = this.$el;
        mapPlumb.reset();
            
        if (state === MENU) {
            $el.addClass("expanded");

            var rootLevelName = this.rootLevel();
            var rootLevel = this.model.mission(rootLevelName);
            var rows = [];
            this.renderTree(rootLevel, '', 0, rows);

            var t = '';
            _.each(rows, function(row) {
                t += self.DIV_ROW({ row: row }) + '\n';
            });

            $("#app-menu-map-container").css("background-image", 'url(' + world_props.bg + ')');
            $("#app-menu-world-name").html(world_props.world);
            $('#app-menu-map').html(t);
            $('#app-menu-stars-earned').html(app.starsEarnedTotal());
            this.select(this.selectedMission);
        } else {
            $el.removeClass("expanded");
        }
    }
});

jsPlumb.ready(function() {
    mapPlumb = jsPlumb.getInstance({
        PaintStyle:{ 
            lineWidth:6, 
            strokeStyle:"rgb(200, 200, 200)"
        },

        Connector: ['Flowchart'],
        Endpoint: 'Blank'
    });
    mapPlumb.setContainer("app-menu-map");


    $(window).resize(function(){
      mapPlumb.repaintEverything();
    });
});
