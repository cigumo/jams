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
        "intro" : "intro.mp3",
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
    var websocket;    
    var data = {};

    // DEBUG DATA
    data.game_state = {"state":"waiting",
                       "turn":0,
                       "token":"",
                       "animal":"pig",
                       "condition":"fart",
                       "can_defend":true,
                       "player_matrix":{"a":[null,null],
                                        "b":[null,null],
                                        "c":[null,null]},
                       "player_names":{"a":"Pepe",
                                       "b":"Tito",
                                       "c":"Cholo"}
                      };

    var animals = [
        "pig",
        "cow",   
        "duck",   
        "sheep",
    ];

    var conditions = [
        "burp", 
        "fart",   
        "sneeze", 
        "cough",  
    ];
    
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
        mlog.error('Opening websocket')
        var uid = get_cookie('uid')        
        mlog.debug('stored uid: ' + uid)        
        send_cmd('uid', uid)

        send_cmd('name', data.username)
        send_cmd('get_game_state')
    }
    var on_close = function(evt)    
    {
        mlog.error('Closing websocket')
    }
    var on_message = function(evt)
    {
        mlog.debug('Rcvd:' + evt.data)
        process_cmd(evt.data)
    }
    var on_error = function(evt)
    {
        mlog.error('Error:' + evt.data)
    }

    var send = function(s)
    {
        mlog.debug('Sending:' + s + ' websocket:' + websocket)
        // DEBUG DISABLED
        //websocket.send(s)
    }
    var send_cmd = function(cmd, data)
    {
        var s = JSON.encode({"cmd":cmd,"data":data})
        send(s)
    }

    // ------------------------------------------------------------
    // Server commands
    var process_cmd = function(evt)
    {
        var c = JSON.decode(evt)
        switch (c.cmd) {

        case 'set_uid':
            data.uid = uid
            break;

        case 'set_game_state':
            data.game_state = c.data
            game_state_updated()
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
    }
    
    var do_ping = function()
    {        
        send('{"cmd":"ping"}')        
    }

    var do_start = function()
    {
        // enable audio on the browser by reacting to user interaction
        audio_db.play('intro')
        audio_db.play_bg('blank')

        // user name
        var username = $('username').value       
        if (username.length != 0)
        {
            data.username = username
            ui.hide('missing_username')
            ui.hide('splash')

            // DEBUG
            //ws_init();        
            
            // DEBUG
            game_state_updated(data)
        }
        else
        {
            ui.show('missing_username')
        }
    }

    var do_attack = function(label)
    {
        send_cmd('attack', label)
    }

    var do_defend = function(label)
    {
        send_cmd('defend',label)
    }

    var do_guess = function()
    {
        send_cmd('guess',null)
    }

    var do_cycle_animal = function(uid)
    {
        var next
        var current = data.game_state.player_matrix[uid][0]        
        var idx = animals.indexOf(current)
        if (idx == -1)
            next = animals[0]
        else if (idx == (animals.length-1))
            next = null
        else
            next = animals[idx+1];

        send_cmd('update_matrix',
                 {changed_uid:uid,
                  type:'animal',
                  value:next})

        // DEBUG ONLY
        data.game_state.player_matrix[uid][0] = next
        game_state_updated()
    }
     
    var do_cycle_condition = function(uid)
    {
        var next        
        var current = data.game_state.player_matrix[uid][1]
        var idx = conditions.indexOf(current)
        if (idx == -1)
            next = conditions[0]
        else if (idx == (conditions.length-1))
            next = ''
        else
            next = conditions[idx+1];

        send_cmd('update_matrix',
                 {changed_uid:uid,
                  type:'condition',
                  value:next})

        // DEBUG ONLY
        data.game_state.player_matrix[uid][1] = next
        game_state_updated()
    }
    
    // ------------------------------------------------------------    
    var game_state_updated = function()
    {
        var gs = data.game_state
        var turn_flag = ''
        if (gs.token == data.uid)
            turn_flag = 'TURN';
        
        // update matrix
        $('matrix').empty()

        var table = new Element('table')
        var tr 
        var td 
        var a
        
        // first row
        tr = new Element('tr')
        td = new Element('td')
        td.set('html', turn_flag)
        td.inject(tr)
        td = new Element('td')
        td.set('html', data.username)
        td.inject(tr)
        td = new Element('td')
        td.set('html', gs.animal)
        td.inject(tr)
        td = new Element('td')
        td.set('html', gs.condition)
        td.inject(tr)
        tr.inject(table)

        // next rows              
        for ( uid in gs.player_matrix ) {
            var m = gs.player_matrix[uid]
            var animal = m[0]
            var condition = m[1]
            if (m[0] == '' || m[0] == null) animal = '?'
            if (m[1] == '' || m[1] == null) condition = '?'

            tr = new Element('tr')

            td = new Element('td')
            td.set('html', turn_flag)
            td.inject(tr)
            
            td = new Element('td')
            td.set('html', gs.player_names[uid])
            td.inject(tr)

            td = new Element('td')
            td.set('html', animal)
            td.set('onclick', "game.do_cycle_animal('" + uid + "')")
            td.inject(tr)
            
            td = new Element('td')
            td.set('html', condition)
            td.set('onclick', "game.do_cycle_condition('" + uid + "')")
            td.inject(tr)

            tr.inject(table)            
        }
        table.inject($('matrix'))

        // guess or attack
        $('attack').empty()

        var a = new Element('a')
        a.href = '#'
        a.set('class', 'button')
        a.set('onclick', "game.do_guess()")
        a.set('html', 'guess')
        a.inject($('attack'))           

        for (i=0; i<conditions.length; i++) {
            var condition = conditions[i]
            var a = new Element('a')
            a.href = '#'
            a.set('onclick', "game.do_attack('"+condition+"')")
            a.set('class', 'button')
            a.set('html', condition)
            a.inject($('attack'))
        }
        
        for (i=0; i<animals.length; i++) {
            var animal = animals[i]
            var a = new Element('a')
            a.href = '#'
            a.set('onclick', "game.do_attack('"+animal+"')")
            a.set('class', 'button')
            a.set('html', animal)
            a.inject($('attack'))           
        }
        
        // defend
        $('defend').empty();
        ([gs.animal, gs.condition, 'ready']).each(function(o) {
            var a = new Element('a')
            a.href = '#'
            a.set('class', 'button')
            if ( o == 'ready' )
                a.set('onclick', "game.do_defend()")
            else
                a.set('onclick', "game.do_defend('"+ o +"')");            
            a.set('html', o)
            a.inject($('defend'))
        });

        // show/hide ui elements
        switch (gs.state) {
        case "waiting":
            ui.show('waiting')
            ui.hide('main')
            break;
        case "playing":
            ui.hide('waiting')
            ui.show('main')                
            break;
        case "finished":
            ui.hide('waiting')
            ui.hide('main')
            break;
        }

        if (gs.token == data.uid)
        {
            ui.show('attack')
            ui.hide('defend')
        }
        else
        {
            ui.hide('attack')
            ui.show('defend')
        }

    }

    // ------------------------------------------------------------
    // public functions
    return {
        init : init,
        do_ping : do_ping,
        do_start : do_start,
        do_cycle_animal : do_cycle_animal,
        do_cycle_condition : do_cycle_condition,
        do_attack : do_attack,
        do_defend : do_defend,
        do_guess : do_guess,
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


