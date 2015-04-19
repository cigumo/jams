//
//
//

// ------------------------------------------------------------
var ui = function()
{
    var show = function(id) { $(id).removeClass('nodisplay') }
    var hide = function(id) { $(id).addClass('nodisplay') }
    var is_hidden = function(id) { return $(id).hasClass('nodisplay') }    

    return {
        show : show,
        hide: hide,
        is_hidden : is_hidden,
    }
}();

// ------------------------------------------------------------
var audio_db = function()
{

    var audio_files_path = "audio/";
    var audio_files = {
        "blank" : "blank.wav",
        "ambient" : ["ambiente_birds.mp3", "ambiente_birds2.mp3", "ambiente_river.mp3", "ambiente_wind.mp3"],

        "pig"    : ["chancho1.mp3","chancho2.mp3","chancho3.mp3"],    
        "cow"    : ["cow1.mp3","cow2.mp3","cow3.mp3"],
        "duck"   : ["duck1.mp3","duck2.mp3","duck3.mp3"],
        "sheep"  : ["sheep1.mp3","sheep2.mp3","sheep3.mp3"],

        "burp"   : ["erupto1.mp3","erupto2.mp3","erupto3.mp3"],
        "fart"   : ["pedo1.mp3","pedo2.mp3","pedo3.mp3"],
        "sneeze" : ["sneeze1.mp3","sneeze2.mp3","sneeze3.mp3"],
        "cough"  : ["tos1.mp3","tos2.mp3","tos3.mp3"],

        "drumroll" : "drumroll.mp3",
        
        "fanfare-pig"   : "fanfarepig.mp3",   
        "fanfare-cow"   : "fanfarecow.mp3",                                
        "fanfare-sheep" : "fanfaresheep.mp3", 
        "fanfare-duck"  : "fanfareduck.mp3",
    };

    var get_file_url = function(audio_id)
    {
        var a = audio_files[audio_id];
        if (typeof(a) == 'object')            
            return audio_files_path + a[0]
        else
            return audio_files_path + a            
    }

    var play = function(audio_id)
    {
        // TODO: evitar transferir de nuevo
        $('audio_noise').src = get_file_url(audio_id);
        $('audio_noise').play();
    }

    var play_bg = function(audio_id)    
    {
        // TODO: evitar transferir de nuevo
        $('audio_bg').src = get_file_url(audio_id);
        $('audio_bg').play();        
    }
    
    return {
        play : play,
        play_bg : play_bg,
    };
}();


// ------------------------------------------------------------
var game = function()
{
    var data = {};
    var websocket;    

    // ------------------------------------------------------------
    var set_cookie = function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }
    
    var get_cookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }
    
    // ------------------------------------------------------------    
    var ws_init = function()
    {
        websocket = new WebSocket(WS_URI);
        websocket.onopen = function(evt) { on_open(evt) };
        websocket.onclose = function(evt) { on_close(evt) };
        websocket.onmessage = function(evt) { on_message(evt) };
        websocket.onerror = function(evt) { on_error(evt) };        
    }

    // 
    var on_open = function(evt)
    {        
    }
    var on_close = function(evt)
    {        
    }
    var on_message = function(evt)
    {
        mlog.debug('Rcvd:' + evt.data)
        process_cmd(evt)
    }
    var on_error = function(evt)
    {
        mlog.error('Error:' + evt.data)
    }

    var send = function(s)
    {
        mlog.debug('Sending:' + s)
        websocket.send(s)
    }
    var send_cmd = function(cmd, data)
    {
        send(JSON.encode({"cmd":cmd,"data":data}))
    }

    // ------------------------------------------------------------
    // Server commands
    var process_cmd = function(evt)
    {
        var c = JSON.decode(evt)
        switch (c.cmd) {

        case 'set_uid':
            game.data.uid = uid
            break;

        case 'set_game_state':
            game.data.state = c.data
            game_state_updated(c.data)
            break;

        case 'say':
            audio_db.play(c.data)
            break;
        }
    }
    
    // ------------------------------------------------------------
    // UI Handlers
    var init = function()
    {
        var uid = get_cookie('uid')        
        mlog.debug('stored uid: ' + uid)
        
        ws_init();
        send_cmd('uid', uid)        
    }
    
    var do_ping = function()
    {        
        send('{"cmd":"ping"}')        
    }

    var do_start = function()
    {
        // enable audio on the browser by reacting to user interaction
        audio_db.play('start')
        audio_db.play_bg('blank')

        // user name
        var username = $('username').value       
        if (username.length != 0)
        {
            game.data.username = username
            
            send_cmd('name', username)
            send_cmd('get_game_state')
            
            ui.hide('missing_username')
            ui.hide('splash')

            ui.show('main')
        }
        else
        {
            ui.show('missing_username')
        }
    }

    var game_state_updated = function(state)
    {
        var table = new HtmlTable();
        table.properties = { border:1, cellspacing: 3}
        
        for ( uid in state.player_matrix ) {
            var row = state.player_matrix[uid]
            table.push([state.player_names[uid], row[0], row[1]])
        }
        table.inject($('matrix'))
    }

    // ------------------------------------------------------------
    // public functions
    return {
        init : init,
        do_ping : do_ping,
        do_start : do_start,
    }
}();


    
// ------------------------------------------------------------
window.onload = function() {
    if (DEBUG_LEVEL) mlog.set_level(DEBUG_LEVEL)

    game.init();

}

// ------------------------------------------------------------
// config
var DEBUG_LEVEL = mlog.LEVEL_DEBUG
var WS_URI = "ws://localhost:8080/";


