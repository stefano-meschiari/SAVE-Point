cordova-plugin-restarter
========================
This plugin was made to solve the ```window.location.reload()``` problem on the iOS platform. 

Sometimes when I call ```window.location.reload()``` in my Ionic app it doesn't properly reload.
I get blank white screen for 20-30 seconds then finally my app loads without needed fonts. Your results may vary.

So I found [this tread at the stackoverflow](http://stackoverflow.com/questions/24360725/possible-to-launch-index-html-from-ios-phonegap-plugin) and made a plugin for the iOS platform.

So what does this plugin do? It takes ```appDelegate.viewController``` WebView and reloads it with ```index.html```. That's it.
