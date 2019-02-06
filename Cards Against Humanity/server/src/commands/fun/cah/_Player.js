// import support libs
const Util = require('./_Util');
const { table } = require('table');

const tableConfig = {
  columns: {
    0: {
      alignment: 'right',
      width: 7
    },
    1: {
      alignment: 'left',
      width: 70
    }
  },
  border: {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `┌`,
    topRight: `┐`,

    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `└`,
    bottomRight: `┘`,

    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,

    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`
  }
};

/**
 * Encapsulates player details, stats & current hand
 */
class Player {
  /**
   * @param {string} playerName Instantiated player's name
   * @param {wsClient} playerSocket Reference to their connection socket
   * @param {Announcer} announcer Reference to the announer for this game
   * @param {object} options Object containing the current game options
   *
   * @example
   * // Create a new Player and populate its hand
   * const newGuy = new Player(name, socket, announcer, options);
   * newGuy.fillHand(globalDeck);
   */
   constructor(playerName, playerSocket, announcer, options = {}) {
     /**
       * This is the players ID
       * @type {number}
       */
     this.playerID = Math.floor(Math.random() * 10000);

     /**
       * This is the players name
       * @type {string}
       */
     this.playerName = playerName;

     /**
       * Reference to the players client socket
       * @type {wsClient}
       */
     this.playerSocket = playerSocket;

     /**
       * Reference to the game announcer, used for error replies
       * @type {Announcer}
       */
     this.announcer = announcer;

     /**
       * The options the player was instantiated with
       * @type {object}
       */
     this.options = Util.mergeDefault({
       maxCards: 7,
       maxPoints: 20,
       winPoints: 7
     }, options);

     /**
       * This players points
       * @type {number}
       */
     this.playerPoints = 0;

     /**
       * This players hand
       * @type {array}
       */
     this.playerHand = [];

     /**
       * Indicates if it is this players turn to /pick
       * @type {boolean}
       */
     this.playerPicking = false;

     /**
       * Indicates if this player may /pick
       * @type {boolean}
       */
     this.pickReady = false;

     /**
       * Indicates if the player has /play'ed a white card
       * @type {boolean}
       */
     this.playerPlayed = false;
   }

  /**
    * Returns the id of this player
    * @type {number}
    * @readonly
    */
  get id() {
    return this.playerID;
  }

  /**
    * Returns the name of this player
    * @type {string}
    * @readonly
    */
  get name() {
    return (`${this.playerSocket.nick}#${this.playerSocket.trip || 'null'}`) ||
      this.playerName;
  }

  /**
    * Returns the client socket for this player
    * @type {wsClient}
    * @readonly
    */
  get socket() {
    return this.playerSocket;
  }

  /**
    * Returns the number of points this player has
    * @type {number}
    * @readonly
    */
  get points() {
    return this.playerPoints;
  }

  /**
    * Returns this players hand as a formatted string
    * @type {string}
    * @readonly
    */
  get hand() {
    if (this.playerHand.length === 0) {
      return this.announcer.informFailure(this, 2); // fail because game not started
    }

    let cards = [ ['Card #:', 'Text:'] ];
    for (let i = 0, j = this.playerHand.length; i < j; i++) {
      cards.push([ i + 1, this.playerHand[i] ]);
    }

    return table(cards, tableConfig);
  }

  /**
    * Indicates if it is this players turn to /pick
    * @type {boolean}
    * @readonly
    */
  get isPicking() {
    return this.playerPicking;
  }

  /**
    * Indicates if this player has /play'ed
    * @type {boolean}
    * @readonly
    */
  get hasPlayed() {
    return this.playerPlayed;
  }

  /**
    * (Re)fill this players hand
    * @param {Deck} deck The global deck of cards
    * @returns {array} The new cards added
    */
  fillHand(deck) {
    let numCards = this.options.maxCards - this.playerHand.length;
    let newCards = [];
    let cardText = '';

    for (let i = 0; i < numCards; i++) {
      cardText = deck.whiteCard;
      this.playerHand.push(cardText);
      newCards.push(cardText);
    }

    return newCards;
  }

  /**
    * Called when a player has won a round, adds full points
    * Returns a boolean value indicating if this players points exceed the maximum
    * @returns {boolean}
    */
  wonRound() {
    return this.addPoints(this.options.winPoints);
  }

  /**
    * Add points to this players score
    * Returns a boolean value indicating if this players points exceed the maximum
    * @param {number} numPoints How many points
    * @returns {boolean}
    */
  addPoints(numPoints) {
    this.playerPoints += numPoints;

    if (this.playerPoints >= this.options.maxPoints) {
      return true;
    }

    return false;
  }

  /**
    * Removes target cards from this players hand
    * @param {array} indexArray An array of indexs indicating the cards to remove
    * @returns {void}
    */
  removeCards(indexArray) {
    indexArray.sort( (c1, c2) => c1 - c2 );
    for (let i = indexArray.length - 1; i >= 0; i--) {
      this.playerHand.splice(indexArray[i] - 1, 1);
    }
  }
}

module.exports = Player;
