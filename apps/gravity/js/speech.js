"use strict";

var SoundEngine = Backbone.ROComputedModel.extend({
    musicEnabled:true,
    musicVolume:0.4,
    effectsEnabled:true,
    effectsVolume:0.2,
    
    
    initialize: function() {
        var self = this;
        this.assets = app.get('assets');
        
        _.map(this.assets.effects, function(value, key) {
            self[key] = self.newAudio(value);

            self.listenTo(app, key, function() {
                self.playEffect(key);
            });
        });

        this.musicPlayer = new Audio();
        this.musicPlayer.loop = true;
        this.musicPlayer.volume = this.musicVolume;
    },

    newAudio: function(src) {
        var audio = new Audio();
        audio.src = src;
        audio.volume = this.effectsVolume;
        return audio;
    },
    
    playEffect: function(type) {
        if (!this.effectsEnabled)
            return;
        
        try {
            if (this.assets.effects[type]) {
                this[type].currentTime = 0;
                if (this[type].currentTime != 0)
                    this[type].load();
                this[type].play();
            }
        } catch(e) {
            console.log(e);
        }
    },

    playMusic: function(type) {
        if (!this.musicEnabled)
            return;

        this.musicPlayer.src = this.assets.music[type];
        this.musicPlayer.play();        
    }
});

