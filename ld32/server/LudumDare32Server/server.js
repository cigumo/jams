/**
 * New node file
 */
var mod = (function() {
	var md5 = require("MD5");
	function GameState() {
		this.state = '';
		this.token = '';
		this.player_matrix = [];
		this.player_names = {};
	}
	function RuleSet() {
		
		this.players = [];
		
		this.set_player = function(player) {
			this.players.push(player);
			if (this.players.length === 4) {
				this.start_game();
			}
		};
		this.start_game = function() {
			for (var player in this.players) {
				player.send_game_state();
			}
		};
	}
	function Player(ws) {
		this.state = new GameState();
		this.uid = '';
		this.socket = ws;
		
		this.listen = function() {
			ws.on('message', function(message) {
		    	on_message(message);
		    });
			ws.on('disconnect', function () {
		    	console.log("Disconnected.");
		    });
		};
		this.send_game_state = function(nextUid) {
			this.state.token = nextUid;
			ws.send(JSON.stringify(this.state));
		}
		function on_message(message) {
			var command = JSON.parse(message);
			switch (command.cmd) {
			case 'uid':
				uid(command.data);
				break;
			}
		}
		function uid(val) {
			if (val === null || val === undefined) {
				val = md5(Math.random());
				ws.send(JSON.stringify(new Command("set_ui", val)));
			}
			this.uid = val;
		}
	}
	function Command(command, data) {
		this.cmd = command;
		this.data = data;
	}
	var WebSocketServer = require('ws').Server
	  , wss = new WebSocketServer({port: 8080});
	var server = {
		start : function () {
			var ruleset = new RuleSet();
			wss.on('connection', function(ws) {
				var player = new Player(ws);
				player.listen();
				ruleset.set_player(player);
			});
		}
	};
	server.start();
}());