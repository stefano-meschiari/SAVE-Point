/* Returns a dictionary containing the parsed URL parameters. */
_.parameter = function(name) {
    return(decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null);
};

/* Count how many elements satisfy the function f */
_.countWhere = function(obj, f) {
    var cnt = 0;

    _.each(obj, function(o) {
        if (f(o))
            cnt += 1;
    });
    return cnt;
};

/* Check if two arrays are equal */
_.arrayEquals = function(a1, a2) {
    if (!a1 || !a2)
        return false;
    if (a1.length != a2.length)
        return false;
    for (var i = 0; i < a1.length; i++)
        if (a1[i] !== a2[i])
            return false;
    return true;
};

window.setLocationRepeated = function(href) {
    location.href = href;
    _.delay(function() { window.setLocationRepeated(href); }, 1000);
};

window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
