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
		this.turn = 0;
		this.token = '';
		this.animal = '';
		this.condition = '';
		this.can_defend = true;
		this.player_matrix = {};
		this.player_names = {};
	}
	function RuleSet() {
		var self = this;
		self.turn = 0;
		self.min_players = 2;
		self.players = [];
		self.current_player_index = 0;
		self.current_state = 'waiting';
		self.animals = ["pig", "cow", "duck", "sheep"];
		self.conditions = ["fart", "burp", "sneeze", "cough"];
		self.current_turn_commands = {};
		
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
				switch (command.cmd) {
				case "attack":
					self.attack(player, command.label);
					break;
				case "defend":
					self.defend(player, command.label);
					break;
				case "guess":
					self.guess(player);
					break;
				case "get_game_state":
					player.send_game_state(self.current_state, self.turn);
					break;
				case "reset":
					self.start_game();
					break;
				}
			});
			if (self.players.length === self.min_players) {
				self.start_game();
			}
		};
		self.start_game = function() {
			self.players.shuffle();
			self.current_player_index = -1;
			self.turn = 0;
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
			self.init_turn();
		};
		self.init_turn = function() {
			self.current_state = 'turn';
			self.turn++;
			self.current_player_index++;
			if (self.current_player_index >= self.players.length)
				self.current_player_index = 0;
			self.players[self.current_player_index].state.can_defend = true;
			self.current_turn_commands = {attack:null, defense:[]};
			for (var i=0; i<self.players.length; i++) {
				self.players[i].send_game_state(self.current_state, self.turn, self.players[self.current_player_index].uid);
			}
		}
		self.attack = function(player, label) {
			if (player.uid == self.players[self.current_player_index].uid) {
				self.current_turn_commands.attack = { uid:player.uid, to:label };
			} else {
				self.current_turn_commands.defense.push({ uid:player.uid, to:null });
			}
			if (self.current_turn_commands.defense.length+1 == self.players.length) {
				self.resolve_turn();
			}
		};
		self.defend = function(player, label) {
			if ((label != null && label != undefined && player.state.can_defend)) {
				player.state.can_defend = false;
			}
			self.current_turn_commands.defense.push({ uid:player.uid, to:label });
			if (self.current_turn_commands.defense.length+1 == self.players.length) {
				self.resolve_turn();
			}
		};
		self.guess = function(player) {
			if (player.uid == self.players[self.current_player_index].uid) {
				var victory = true;
				for (var i = 0; i<self.players.length; i++) {
					if (self.players[i].uid != player.uid) {
						victory = self.players[i].animal == player.state.player_matrix[self.players[i].uid][0] 
									&& self.players[i].condition == player.state.player_matrix[self.players[i].uid][1];
						if (!victory)
							break;
					}
				}
				if (!victory) {
					var prob = this.random_int(0, 2);
					switch (prob) {
					case 0:
						player.send_audio(player.animal);
						break;
					case 1:
						player.send_audio(player.condition);
						break;
					}
				} else {
					self.current_state = 'finished';
					for (var i = 0; i<self.players.length; i++) {
						self.players[i].send_game_state(self.current_state, self.turn);
						self.players[i].send_winner(player.uid);
					}
				}
			}
		};
		self.resolve_turn = function() {
			if (self.current_turn_commands.attack != null && self.current_turn_commands.attack != undefined) {
				for (var i = 0; i<self.players.length; i++) {
					var defended = false;
					if (self.current_turn_commands.attack.uid != this.players[i].uid) {
						for (var j = 0; j<self.current_turn_commands.defense.length; j++) {
							if(self.current_turn_commands.defense[j].uid == self.players[i].uid 
									&& self.current_turn_commands.defense[j].to == self.current_turn_commands.attack.to) {
								defended = true;
							}
						}
						if (!defended && (self.players[i].animal == self.current_turn_commands.attack.to
								|| self.players[i].condition == self.current_turn_commands.attack.to)) {
							self.players[i].send_audio(self.current_turn_commands.attack.to);
						}
					}
				}
			}
			self.init_turn();
		}
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
		self.send_game_state = function(state_code, turn, next_uid) {
			if (state_code != null && state_code != undefined)
				self.state.state = state_code;
			if (turn != null && turn != undefined)
				self.state.turn = turn;
			if (next_uid != null && next_uid != undefined)
				self.state.token = next_uid;
			self.send(new Command("set_game_state", self.state));
		};
		self.send_audio = function(label) {
			self.send(new Command("say", label));
		};
		self.send_winner = function(winnerUid) {
			self.send(new Command("winner", winnerUid));
		}
		self.update_matrix = function(data) {
			var index = data.type == "animal" ? 0 : 1;
			self.state.player_matrix[data.changed_uid][index] = data.value != '' ? data.value : null;
			self.send_game_state();
		}
		function on_message(message) {
			var command = JSON.parse(message);
			switch (command.cmd) {
			case 'uid':
				uid(command.data);
				break;
			case 'name':
				self.name = command.data;
				self.emit("registered", self);
				break;
			case 'update_matrix':
				self.update_matrix(command.data);
				break;
			default:
				self.emit("command", command);
			}
		}
		function uid(val) {
			if (val === null || val === undefined) {
				val = md5(Math.random());
				self.send(new Command("set_uid", val));
			}
			self.uid = val;
		}
		self.send = function (command) {
			if (self.connected) {
				ws.send(JSON.stringify(command));
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