
_.parameter = function(name) {
    return(decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null);
};

_.countWhere = function(obj, f) {
    var cnt = 0;

    _.each(obj, function(o) {
        if (f(o))
            cnt += 1;
    });
    return cnt;
};
