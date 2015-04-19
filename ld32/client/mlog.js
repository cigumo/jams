var mlog = function()
{
    var LEVEL_DEBUG = 100
    var LEVEL_INFO  = 10
    var LEVEL_ERROR = 1

    var level = LEVEL_ERROR 

    var set_level = function(l)
    {
        level = l
    }
    var get_level = function()
    {
        return level
    }

    var log = function(l,m)
    {
        if (l <= level)
            console.log(m)            
    }

    var debug = function(m)
    {
        log(LEVEL_DEBUG, m)
    }
    var info = function(m)
    {
        log(LEVEL_INFO, m)
    }
    var error = function(m)
    {
        log(LEVEL_ERROR, m)
    }

    // public functions
    return {
        LEVEL_DEBUG : LEVEL_DEBUG,
        LEVEL_INFO  : LEVEL_INFO,
        LEVEL_ERROR : LEVEL_ERROR, 
        set_level : set_level, 
        get_level : get_level, 
        log       : log, 
        debug : debug, 
        info  : info,
        error : error,
    }

}(); 
