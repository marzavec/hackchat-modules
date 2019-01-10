/*
  Description: A Chat Against Humanity port to hack.chat
*/

// module support functions
const stripIndents = require('common-tags').stripIndents;

// the deck of cards is kept here to keep memory usage low
const CardDeck = require("./cah/_CardDeck");
const deck = new CardDeck();

const GameEngine = require("./cah/_GameEngine");

const options = {
  channel: 'chatAgainstHumanity'
};
/*
const options = {
  //option name:,   default,      // explaination
  channel: 'chatAgainstHumanity', // channel the game should be instantiated in
  minPlayers: 3,                  // the minimum amount of joined players

  announcerName: 'FuckFace',      // announcer's name
  announcerTrip: 'cahBot',        // announcer's trip code
  announcerHash: 'server',        // announcer's connection hash
  announcerLevel: 'user',         // announcer's level (user, mod, admin)

  maxCards: 7,                    // number of cards in a player's hand
  maxPoints: 20,                  // number of points until a win
  winPoints: 6,                   // number of points until a win
  playtime: 45,                   // number of seconds a player has to play a card
  picktime: 45                    // number of seconds a player has to pick a winner
}
*/

// module main
exports.run = async (core, server, socket, payload) => {
  // check for spam
  if (server._police.frisk(socket.remoteAddress, 6)) {
    return server.reply({
      cmd: 'warn',
      text: 'You are sending too much text. Wait a moment and try again.\nPress the up arrow key to restore your last message.'
    }, socket);
  }
};

// module hook functions
exports.initHooks = (server) => {
  this.game = new GameEngine(server, deck, options);

  server.registerHook('in', 'join', this.newPlayerCheck);
  server.registerHook('in', 'chat', this.playCmdCheck);
};

// hooks chat commands checking for / commands
exports.newPlayerCheck = (core, server, socket, payload) => {
  if (typeof payload.nick !== 'string' || typeof payload.channel !== 'string') {
    return false;
  }

  if (payload.channel !== options.channel) {
    return payload;
  }

  socket.cah = {
    observer: true
  };

  this.game.announcer.welcome(socket);

  return payload;
}

// hooks chat commands checking for / commands
exports.playCmdCheck = (core, server, socket, payload) => {
  if (typeof payload.text !== 'string' || socket.channel !== options.channel) {
    return payload;
  }

  if (payload.text.startsWith('/cahhelp')) {
    this.game.announcer.sendHelp(socket);

    return false;
  }

  if (payload.text.startsWith('/join')) {
    if (socket.cah.observer === true) {
      socket.cah.observer = false;

      socket.cah.player = this.game.addPlayer(
        `${socket.nick}#${socket.trip||'null'}`,
        socket
      );

      socket.on('close', () => {
        this.game.removePlayer(socket.cah.player, socket);
      });
    }

    return false;
  }

  if (payload.text.startsWith('/start') && !socket.cah.observer) {
    this.game.startNew(socket.cah.player);

    return false;
  }

  if (payload.text.startsWith('/hand') && !socket.cah.observer) {
    this.game.announcer.showHand(socket.cah.player);

    return false;
  }

  if (payload.text.startsWith('/play ') && !socket.cah.observer) {
    let input = payload.text.split(' ');
    input.splice(0, 1);

    this.game.doPlay(socket.cah.player, input);

    return false;
  }

  if (payload.text.startsWith('/pick ') && !socket.cah.observer) {
    let input = payload.text.split(' ');
    input.splice(0, 1);

    this.game.doPick(socket.cah.player, input[0]);

    return false;
  }

  return payload;
};

// module meta
exports.info = {
  name: 'chatAgainstHumanity',
  description: `Provides the interface & game logic for Chat Against Humanity in ?chatAgainstHumanity`,
  usage: `No direct usage`
};
