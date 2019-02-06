// import support libs
const Util = require('./_Util');
const Announcer = require("./_Announcer");
const Player = require("./_Player");

/**
  * Provides the main game logic
  */
class GameEngine {
  /**
   * @param {Server} server Global server object
   * @param {CardDeck} deck Global Deck instance
   * @param {object} options Object containing the current game options
   */
   constructor(server, deck, options = {}) {
     /**
       * The global server object
       * @type {object}
       */
     this.server = server;

     /**
       * The reference to the deck of cards to use
       * @type {CardDeck}
       */
     this.deck = deck;

     /**
       * The options the game was instantiated with
       * @type {object}
       */
     this.options = Util.mergeDefault({
       minPlayers: 3,
       maxCards: 7,
       maxPoints: 40,
       playtime: 45,
       picktime: 45,
       winPoints: 7
     }, options);

     /**
       * The announcer for this game instance
       * @type {Announcer}
       */
     this.announcer = new Announcer(this, this.server, this.options);

     /**
       * Holds the current players of this game instance
       * @type {array}
       */
     this.players = [];

     /**
       * Tracks if a game is currently running
       * @type {boolean}
       */
     this.gameInProgress = false;

     /**
       * Current round #
       * @type {number}
       */
     this.currentRound = 1;

     /**
       * The Player who's turn it is to pick a white card
       * @type {Player}
       */
     this.currentPicker = null;

     /**
       * Queue position for picking players
       * @type {number}
       */
     this.pickerTurn = 0;

     /**
       * The black card currently in play
       * @type {object}
       */
     this.currentBlack = {};

     /**
       * The white cards played by players
       * @type {array}
       */
     this.currentWhite = [];

     /**
       * Holder object for timers
       * @type {object}
       */
     this.timers = {
       playWarn: null,
       playEnd: null,
       pickWarn: null,
       pickEnd: null
     };
   }

  /**
    * Returns a text representation of the boolean gameInProgress
    * @type {string}
    * @readonly
    */
  get inProgress() {
    return this.gameInProgress === true ? 'yes' : 'no';
  }

  /**
    * Returns the current count of players that have /join'ed
    * @type {number}
    * @readonly
    */
  get playerCount() {
    return this.players.length;
  }

  /**
    * Adds a player to the current game isntance
    * @param {string} playerName The unique id of the new player
    * @param {wsClient} playerSocket The connection socket of the new player
    * @returns {Player} The newly created Player class
    */
  addPlayer(playerName, playerSocket) {
    let newPlayer = new Player(playerName, playerSocket, this.announcer, this.options);
    this.players.push(newPlayer);

    this.announcer.newPlayer(playerName);

    if (this.gameInProgress) {
      newPlayer.fillHand(this.deck);
    }

    return newPlayer;
  }

  /**
    * Called when a player disconnected
    * @param {Player} player Player that disconnected
    * @param {wsClient} playerSocket The connection socket of the player
    * @returns {void}
    */
  removePlayer(player, playerSocket) {
    this.announcer.lostPlayer(player.name);

    if (this.gameInProgress && this.currentPicker.id === player.id) {
      this.announcer.pickFailure(this.currentPicker.name);

      for (let i = 0, j = this.players.length; i < j; i++) {
        if (!this.players[i].isPicking) {
          if (this.players[i].addPoints(Math.floor(this.options.winPoints * .5))) {
            this.gameOver(this.players[i]);
            return;
          }
        }
      }

      this.finalizeRound();
    }

    for (let i = 0, j = this.players.length; i < j; i++) {
      if (this.players[i].id === player.id) {
        this.players.splice(i, 1);
        break;
      }
    }

    if (this.gameInProgress && this.players.length < this.options.minPlayers) {
      // not enough players to continue, end game
      this.players.sort( (p1, p2) => p1.points - p2.points ).reverse();
      this.announcer.failedGame();
      this.gameOver(this.players[0]);
    }
  }

  /**
    * Checks if everything is ready to start a new game
    * @param {Player} player The new player who tried to start a new game
    * @returns {boolean} Indicates readyness
    */
  gameReady(player) {
    if (this.gameInProgress) {
      return this.announcer.informFailure(player, 0); // fail because game is already in progress
    }

    if (this.playerCount < this.options.minPlayers) {
      return this.announcer.informFailure(player, 1); // fail because Not Enough Players
    }

    return true;
  }

  /**
    * Called when a player attempts to start a new game
    * @param {Player} player The new player who tried to start a new game
    * @returns {void}
    */
  startNew(player) {
    if (this.gameReady(player)) {
      this.pickerTurn = 0;
      this.setPicker(this.players[this.pickerTurn]);
      this.gameInProgress = true;

      for (let i = 0, j = this.players.length; i < j; i++) {
        this.players[i].fillHand(this.deck);
      }

      this.announcer.roundStart(this.currentPicker.name, this.drawBlackCard(), this.currentRound);
      this.startPlayTimers();
    }
  }

  /**
    * Removes old flags on a previous picker and applied flags to the new one
    * @param {Player} newPicker The new player who's turn it is to pick
    * @returns {void}
    */
  setPicker(newPicker) {
    if (this.currentPicker !== null) {
      this.currentPicker.playerPicking = false;
      this.currentPicker.pickReady = false;
    }

    newPicker.playerPicking = true;
    this.currentPicker = newPicker;
  }

  /**
    * Rotates the picking player based on queue position
    * @returns {void}
    */
  nextPicker() {
    this.pickerTurn++;

    if (this.pickerTurn >= this.players.length) {
      this.pickerTurn = 0;
    }

    this.setPicker(this.players[this.pickerTurn]);
  }

  /**
    * Stores a random black card from the deck and returns it
    * @returns {object} The chosen black card
    */
  drawBlackCard() {
    this.currentBlack = this.deck.blackCard;

    return this.currentBlack;
  }

  /**
    * Starts two timers to warn and then fail if a player takes too long to play
    * @returns {void}
    */
  startPlayTimers() {
    this.timers.playWarn = setTimeout(
      () => {
        if (this.gameInProgress) {
          this.announcer.playWarning(this.options.playtime * 0.5);
        }

        this.timers.playWarn = null;
      },
      (this.options.playtime * 1000) * 0.5
    );

    this.timers.playEnd = setTimeout(
      () => {
        this.onActionFailure(true);
        this.timers.playWarn = null;
      },
      this.options.playtime * 1000
    );
  }

  /**
    * Clears both previously set play timers
    * @returns {void}
    */
  clearPlayTimers() {
    if (this.timers.playWarn !== null) {
      clearTimeout(this.timers.playWarn);
      this.timers.playWarn = null;
    }

    if (this.timers.playEnd !== null) {
      clearTimeout(this.timers.playEnd);
      this.timers.playEnd = null;
    }
  }

  /**
    * Starts two timers to warn and then fail if a player takes too long to pick
    * @returns {void}
    */
  startPickTimers() {
    this.timers.pickWarn = setTimeout(
      () => {
        if (this.gameInProgress) {
          this.announcer.pickWarning(
            this.options.picktime * 0.5,
            this.currentPicker.name
          );
        }

        this.timers.pickWarn = null;
      },
      (this.options.picktime * 1000) * 0.5
    );

    this.timers.pickEnd = setTimeout(
      () => {
        this.onActionFailure(false);
        this.timers.pickEnd = null;
      },
      this.options.picktime * 1000
    );
  }

  /**
    * Clears both previously set pick timers
    * @returns {void}
    */
  clearPickTimers() {
    if (this.timers.pickWarn !== null) {
      clearTimeout(this.timers.pickWarn);
      this.timers.pickWarn = null;
    }

    if (this.timers.pickEnd !== null) {
      clearTimeout(this.timers.pickEnd);
      this.timers.pickEnd = null;
    }
  }

  /**
    * Called when a player fails to play or pick. If /play'ing, all players who
    * did play gain half points. If /pick'ing, everyone gets half points.
    * // TODO: This could be changed to make gameplay better
    * @param {boolean} playFailure True if players were /play'ing, false if /pick'ing
    * @returns {void}
    */
  onActionFailure(playFailure) {
    if (!this.gameInProgress) {
      return;
    }

    if (playFailure) {
      let shittyPlayers = [];
      for (let i = 0, j = this.players.length; i < j; i++) {
        if (!this.players[i].playerPlayed && !this.players[i].isPicking) {
          shittyPlayers.push(this.players[i].name);
        }
      }

      this.announcer.playFailure(shittyPlayers);

      for (let i = 0, j = this.players.length; i < j; i++) {
        if (this.players[i].playerPlayed && !this.players[i].isPicking) {
          if (this.players[i].addPoints(Math.floor(this.options.winPoints * .5))) {
            this.gameOver(this.players[i]);
            return;
          }
        }
      }
    } else {
      this.announcer.pickFailure(this.currentPicker.name);

      for (let i = 0, j = this.players.length; i < j; i++) {
        if (!this.players[i].isPicking) {
          if (this.players[i].addPoints(Math.floor(this.options.winPoints * .5))) {
            this.gameOver(this.players[i]);
            return;
          }
        }
      }
    }

    this.finalizeRound();
  }

  /**
    * A play has attempted to /play a card
    * @param {Player} player The player who is making a play
    * @param {array} choiceArray The player's choice(s)
    * @returns {void}
    */
  doPlay(player, choiceArray) {
    if (player.isPicking) {
      // fail because they can't play
      return this.announcer.informFailure(player, 3);
    }

    if (choiceArray.length < this.currentBlack.pick) {
      // fail because player didn't choose enough cards
      return this.announcer.informFailure(player, 4);
    }

    if (choiceArray.length > this.currentBlack.pick) {
      // fail because a player choose too many cards
      return this.announcer.informFailure(player, 5);
    }

    if (choiceArray.some(isNaN)) {
      // fail because their one of their choices isn't a number
      return this.announcer.informFailure(player, 6);
    }

    if (choiceArray.length !== Util.uniqueArray(choiceArray).length) {
      // fail because they played a card twice
      return this.announcer.informFailure(player, 7);
    }

    let cards = [];
    for (let i = 0, j = choiceArray.length; i < j; i++) {
      if (typeof player.playerHand[parseInt(choiceArray[i]) - 1] === 'undefined') {
        // fail because they made an invalid choice
        return this.announcer.informFailure(player, 8);
      } else {
        cards.push(player.playerHand[parseInt(choiceArray[i]) - 1]);
      }
    }

    if (player.playerPlayed) {
      // fail because they already chose
      return this.announcer.informFailure(player, 9);
    }

    // valid play (i hope)
    player.playerPlayed = true;
    this.currentWhite.push({
      player: player,
      choices: choiceArray,
      cards: cards
    });
    player.removeCards(choiceArray);

    let waitingOn = this.players.filter(player => {
      return !player.playerPlayed
    }).length - 1;
    this.announcer.informPlay(player.name, waitingOn);

    if (waitingOn === 0) {
      this.clearPlayTimers();
      this.startPickTimers();
      this.currentWhite = Util.shuffleArray(this.currentWhite);
      this.currentPicker.pickReady = true;
      this.announcer.pickChoices(
        this.currentPicker.name,
        this.currentWhite,
        this.currentBlack.text
      );
    }
  }

  /**
    * A player has attempted a /pick command
    * @param {Player} pickerPlayer The player who's making a play
    * @param {string} pickyChoiceyPick The pick. Because fuck you that's why.
    * @returns {void}
    */
  doPick(pickerPlayer, pickyChoiceyPick) {
    if (!pickerPlayer.isPicking) {
      // fail because this player is not picking
      return this.announcer.informFailure(pickerPlayer, 10);
    }

    if (!this.currentPicker.pickReady) {
      // fail because not all players have /play'ed
      return this.announcer.informFailure(pickerPlayer, 13);
    }

    pickyChoiceyPick = parseInt(pickyChoiceyPick);

    if (isNaN(pickyChoiceyPick)) {
      // fail because their choice is not a number
      return this.announcer.informFailure(pickerPlayer, 11);
    }

    pickyChoiceyPick--; // input is off by one due to listing choices vs array
    if (typeof this.currentWhite[pickyChoiceyPick] === 'undefined') {
      // fail because that isn't a card
      return this.announcer.informFailure(pickerPlayer, 12);
    }

    // valid pick (maybe)
    this.announcer.userPicked(
      pickerPlayer.name,
      this.currentWhite[pickyChoiceyPick]
    );

    let gameOver = this.currentWhite[pickyChoiceyPick].player.wonRound();

    if (gameOver) {
      this.gameOver(this.currentWhite[pickyChoiceyPick].player);
    } else {
      this.finalizeRound();
    }
  }

  /**
    * Announce points and continue to the next round
    * @returns {void}
    */
  finalizeRound() {
    let pointsArray = [];
    for (let i = 0, j = this.players.length; i < j; i++) {
      pointsArray.push({
        name: this.players[i].name,
        points: this.players[i].points
      });
    }

    this.announcer.sendPoints(pointsArray);
    this.clearPlayTimers();
    this.clearPickTimers();
    this.nextRound();
  }

  /**
    * Resets variables for a new round to start, announces new card and picker
    * @returns {void}
    */
  nextRound() {
    this.currentRound++;
    this.currentWhite = [];
    this.nextPicker();
    for (let i = 0, j = this.players.length; i < j; i++) {
      this.players[i].fillHand(this.deck);
      this.players[i].playerPlayed = false;
    }

    this.announcer.roundStart(
      this.currentPicker.name,
      this.drawBlackCard(),
      this.currentRound
    );

    this.startPlayTimers();
  }

  /**
    * Oh yay, someone "won", I wonder if they feel special. . .
    * @returns {void}
    */
  gameOver(winner) {
    this.announcer.gameWon(winner.name);
    this.reset();
  }

  /**
    * Resets everything and makes ready for a new game
    * @returns {void}
    */
  reset() {
    this.clearPlayTimers();
    this.clearPickTimers();

    for (let i = 0, j = this.players.length; i < j; i++) {
      this.players[i].socket.cah.observer = true;
    }

    this.players = [];
    this.gameInProgress = false;
    this.currentRound = 1;
    this.currentPicker = null;
    this.pickerTurn = 0;
    this.currentBlack = {};
    this.currentWhite = [];
  }
}

module.exports = GameEngine;
