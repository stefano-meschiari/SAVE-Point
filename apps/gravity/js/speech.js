"use strict";

var SoundEngine = Backbone.ROComputedModel.extend({
    lettersPath: '/share/animalese/animalese.wav',
    volume:0.2,
    rate:2.5,
    speech:true,
    effects:true,

    library: {
        lose: '/share/sounds/lose.mp3',
        win: '/share/sounds/win.mp3',
        collision: '/share/sounds/collision.mp3',
        proceed: '/share/sounds/proceed.wav',
        clickety: '/share/sounds/proceed.wav',
        addPlanet: '/share/sounds/add-planet.mp3',
        'planet:drag': '/share/sounds/drag.mp3'
    },
    
    initialize: function() {
        var self = this;
        this.synth = new Animalese(this.lettersPath);

        _.map(this.library, function(value, key) {
            self[key] = self.newAudio(value);

            self.listenTo(app, key, function() {
                self.playEffect(key);
            });
        });        
    },

    newAudio: function(src) {
        var audio = new Audio();
        audio.src = src;
        audio.volume = this.volume;
        return audio;
    },
    
    speak: function(text) {
        if (!this.speech)
            return;
        
        if (this.speechAudio) {
            this.speechAudio.pause();
            this.speechAudio = null;
        }

        this.speechAudio = this.newAudio(this.synth.Animalese(text).dataURI);
        this.speechAudio.playbackRate = this.rate;
        this.speechAudio.play();
    },

    playEffect: function(type) {
        if (this[type]) {
            this[type].currentTime = 0;
            if (this[type].currentTime != 0)
                this[type].load();
            this[type].play();
        }
    }    
});

app.sounds = new SoundEngine();
