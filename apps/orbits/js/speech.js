"use strict";

var SoundEngine = Backbone.ROComputedModel.extend({    
    initialize: function(model) {
        var self = this;
        this.model = model;
        var app = model;
        this.assets = app.get('assets');
        
        _.map(this.assets.effects, function(value, key) {
            self[key] = self.newAudio(value);

            self.listenTo(app, key, function() {
                self.playEffect(key);
            });
        });

        this.musicPlayer = new Audio();
        this.musicPlayer.loop = true;
        this.musicPlayer.volume = app.get('musicVolume');

        this.listenTo(app, "change:musicVolume", function() {
            this.musicPlayer.volume = app.get('musicVolume');
        });

        this.listenTo(app, "change:alive", function() {
            if (app.get('alive'))
                self.musicPlayer.volume = app.get('musicVolume');
            else
                self.musicPlayer.volume = 0;
        });
        
    },

    newAudio: function(src) {
        var audio = new Audio();
        audio.src = src;
        audio.volume = this.model.get('effectsVolume');
        return audio;
    },
    
    playEffect: function(type) {
        if (this.model.get('effectsVolume') == 0)
            return;
        
        try {
            if (this.assets.effects[type]) {               
                this[type].load();
                this[type].volume = app.get('effectsVolume');
                this[type].play();
                console.log("Playing sound " + type);
            } else {
                console.warn("No sound effect of type ", type);
            }
        } catch(e) {
            console.log(e);
        }
    },

    playMusic: function(type) {
        if (this.model.get('musicVolume') == 0.)
            return;

        this.musicPlayer.src = this.assets.music[type];
        this.musicPlayer.play();
    }
});

