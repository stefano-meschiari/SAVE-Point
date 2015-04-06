cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.malex.cordova.plugin.restarter/www/restarter.js",
        "id": "com.malex.cordova.plugin.restarter.restarter",
        "clobbers": [
            "restarter"
        ]
    },
    {
        "file": "plugins/com.telerik.plugins.wkwebview/www/wkwebview.js",
        "id": "com.telerik.plugins.wkwebview.wkwebview",
        "clobbers": [
            "wkwebview"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.malex.cordova.plugin.restarter": "1.0.0",
    "com.telerik.plugins.wkwebview": "0.3.5"
}
// BOTTOM OF METADATA
});