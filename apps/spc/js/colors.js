// Based on Chris Kempson's base16 palette.
base00 = "#2d2d2d";
base01 = "#393939";
base02 = "#515151";
base03 = "#747369";
base04 = "#a09f93";
base05 = "#d3d0c8";
base06 = "#e8e6df";
base07 = "#f2f0ec";
base08 = "#f2777a";
base09 = "#f99157";
base0A = "#ffcc66";
base0B = "#99cc99";
base0C = "#66cccc";
base0D = "#6699cc";
base0E = "#cc99cc";
base0F = "#d27b53";

COLORS = [
    base0A,
    base08,
    base0D,
    base0B,
    base09,
    base0C,
    base0E,
    base0F,
    base04,
    base07,
    'cyan',
    base06
];


// Increase gamma
for (var i = 0; i < COLORS.length; i++) {
    var color = new Color(COLORS[i]);
    color.saturate(0.6);
    
    COLORS[i] = color.hexString();
}
