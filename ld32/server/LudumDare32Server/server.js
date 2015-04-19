/**
 * New node file
 */
var mod = (function() {
	
	/*
	 * Requirements and extension methods.
	 */
	var md5 = require("MD5");
	var events = require('events');
	Array.prototype.shuffle = function() {
		var o = this;
	    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
	};
	/*
	 * Everything else =P
	 */
	function GameState() {
		this.state = '';
		this.token = '';
		this.animal = '';
		this.condition = '';
		this.player_matrix = {};
		this.player_names = {};
	}
	function RuleSet() {
		var self = this;
		self.min_players = 2;
		self.players = [];
		self.current_player_index = 0;
		self.current_state = 'waiting';
		self.animals = ["pig", "cow", "duck", "sheep"];
		self.conditions = ["fart", "burp", "sneeze", "cough"];
		
		self.set_player = function(player) {
			var index = -1;
			for (var i = 0; i<self.players.length; i++) {
				if (self.players.uid == player.uid) {
					index = i;
				}
			}
			if (index != -1) {
				player.state = self.players[index].state;
				self.players[index] = player;
			} else {
				self.players.push(player);
			}
			player.on("command", function (command) {
				
			});
			if (self.players.length === self.min_players) {
				self.start_game();
			}
		};
		self.start_game = function() {
			self.players.shuffle();
			self.current_player_index = 0;
			self.current_state = 'turn';
			for (var i=0; i<self.players.length; i++) {
				self.players[i].state.animal = self.animals[self.random_int(0, self.animals.length-1)];
				self.players[i].state.condition = self.conditions[self.random_int(0, self.conditions.length-1)];
				for (var j=0; j<self.players.length; j++) {
					if (self.players[j].uid != self.players[i].uid) {
						self.players[j].state.player_matrix[self.players[i].uid] = [null, null];
						self.players[j].state.player_names[self.players[i].uid] = self.players[i].name;
					}
				}
			}
			for (var i=0; i<self.players.length; i++) {
				self.players[i].send_game_state(self.current_state, self.current_player_index);
			}
		};
		self.random_int = function(min, max) {
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		};
	}
	function Player(ws) {
		events.EventEmitter.call(this);
		var self = this;
		self.state = new GameState();
		self.uid = '';
		self.name = "Player";
		self.socket = ws;
		self.connected = true;
		
		self.listen = function() {
			ws.on('message', function(message) {
		    	on_message(message);
		    });
			ws.on('disconnect', function () {
		    	self.connected = false;
		    });
		};
		self.send_game_state = function(stateCode, nextUid) {
			self.state.state = stateCode;
			self.state.token = nextUid;
			self.send(JSON.stringify(new Command("set_game_state", self.state)));
		};
		self.send_audio = function(label) {
			self.send(JSON.stringify(new Command("say", label)));
		};
		function on_message(message) {
			var command = JSON.parse(message);
			switch (command.cmd) {
			case 'uid':
				uid(command.data);
				break;
			case 'name':
				self.name = command.data;
				break;
			default:
				self.emit("command", command);
			}
		}
		function uid(val) {
			if (val === null || val === undefined) {
				val = md5(Math.random());
				self.send(JSON.stringify(new Command("set_uid", val)));
			}
			self.uid = val;
			self.emit("registered", self);
		}
		self.send = function (command) {
			if (self.connected) {
				ws.send(command);
			}
		};
	}
	Player.super_ = events.EventEmitter;
	Player.prototype = Object.create(events.EventEmitter.prototype, {
	    constructor: {
	        value: Player,
	        enumerable: false
	    }
	});
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
				player.on("registered", function(player) {
					ruleset.set_player(player);
				});
			});
		}
	};
	server.start();
}());