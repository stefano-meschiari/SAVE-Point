"use strict";

var AppSettings = Backbone.View.extend({
    el: $("#settings"),
    bloop: true,
    soundMultiplier: 250,
    
    reset: function() {
        var self = this;
        _.each(['musicVolume', 'effectsVolume'], function(prop) {
            $("[data-property=" + prop + "]").val(self.model.get(prop) * self.soundMultiplier).change();
        });
    },
    
    initialize: function() {
        $('input[type="range"]').rangeslider({ polyfill: false });
        var self = this;
        
        $('input[type="range"]').on('change', function(a, b, c) {
            $(this).parent().find("output").text($(this).val());
            var attr = $(this).data('property');
            self.model.set(attr, ($(this).val() | 0)/self.soundMultiplier);
            if (self.model.sounds)
                self.model.sounds.playEffect('clickety');
        });

        this.listenTo(this.model, 'change:musicVolume', function(ctx, val) {
            $("[data-property=musicVolume]").val(val * self.soundMultiplier);
        });
        this.listenTo(this.model, 'change:effectsVolume', function(ctx, val) {
            $("[data-property=effectsVolume]").val(val * self.soundMultiplier);
        });

        this.reset();
    }

    
});
