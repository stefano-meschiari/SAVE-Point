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


window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
