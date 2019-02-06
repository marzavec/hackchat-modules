// import support libs
const stripIndents = require('common-tags').stripIndents;
const Util = require('./_Util');
const { table } = require('table');

const tableConfig = {
  columns: {
    0: {
      alignment: 'right',
      width: 5
    },
    1: {
      alignment: 'left',
      width: 7
    },
    2: {
      alignment: 'left',
      width: 33
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

// Array of errors / reasons a user's action has failed, used by this.informFailure();
const FailureReasons = [
  'The game is already in progress you dummy',
  'You need more friends to /join before we can start. Don\'t have more friends? That\'s fucking sad. . .',
  'All you see is your dick in your hand because the game has not started yet. . .',
  'You are /pick\'ing not /play\'ing, you had one fucking job. . .',
  'Choose more cards! ( Hint: roughly 1 card more than your IQ )',
  'I know counting is hard, but you chose too many cards to play. . .',
  'Try picking a number this time instead, use your fingers if you need',
  'A card can only be played once, you dirty fuggin cheat',
  'What? You don\'t have that card! Learn to count',
  'You can\'t play twice and no take backs',
  'You are /play\'ing not /pick\'ing, adhd is a bitch, eh?',
  'You and your pick suck. . .',
  'That isn\'t a choice, wtf is wrong with you?',
  'Hold your goddamned horses, not everyone has played. . .'
];

/**
 * This class handles the building and broadcasting of player actions and their results
 */
class Announcer {
  /**
   * @param {GameEngine} game Target GameEngine this announcer is linked to
   * @param {server} server Global server object
   * @param {object} options Object containing the current game options
   *
   * @example
   * // Create a new Announcer and announce something
   * const announcer = new Announcer(game, server, options);
   * announcer.say('This game has too many damned cards');
   */
   constructor(game, server, options = {}) {
     /**
       * Target GameEngine
       * @type {GameEngine}
       */
     this.game = game;

     /**
       * The global server object
       * @type {object}
       */
     this.server = server;

     /**
       * The game options for this instance, defaulted if not specified
       * @type {object}
       */
     this.options = Util.mergeDefault({
       announcerName: 'FuckFace',
       announcerTrip: 'cahBot',
       announcerHash: 'server',
       announcerLevel: 'user'
     }, options);
   }

   /**
     * Build new payload using passed structure combined with default options
     * @param {object} data A structure containing non-default payload data
     * @returns {object}
     */
   payload(data) {
     let payload = Util.mergeDefault({
       nick: this.options.announcerName,
       trip: this.options.announcerTrip,
       hash: this.options.announcerHash
     }, data);

     if (this.options.announcerLevel == 'mod') {
       payload.mod = true;
     } else if (this.options.announcerLevel == 'admin') {
       payload.admin = true;
     }

     return payload;
   }

   /**
     * Send an announcement that only the passed socket can see
     * @param {Client} socket Target socket to message
     * @param {string} text Message data
     * @returns {void}
     */
   privateMessage(socket, text) {
     this.server.reply(this.payload({
       cmd: 'chat',
       text: text
     }), socket);
   }

   /**
     * Send an announcement that anyone in the channel can see
     * @param {string} text The announcement text
     * @returns {void}
     */
   say(text) {
     let payload = this.payload({
       cmd: 'chat',
       text: text
     });

     // broadcast to channel peers
     this.server.broadcast( payload, { channel: this.options.channel});
   }

  /**
    * A new user has joined the channel, send the welcome message
    * @param {Client} socket The connection socket of the client who joined
    * @returns {void}
    */
  welcome(socket) {
    setTimeout(() => {
      this.privateMessage(socket, stripIndents`
        Welcome, filthy human, to Chat Against Humanity!
        Featuring ${this.game.deck.cardStats}

        Use /cahhelp to learn the commands to play

        Game in progress: ${this.game.inProgress}, number of players: ${
          this.game.playerCount
        }`);
    }, 15);
  }

  /**
    * Someone needs help, fuggin' noobs
    * @param {Client} socket The connection socket of the client who joined
    * @returns {void}
    */
  sendHelp(socket) {
    this.privateMessage(socket, stripIndents`
      Chat Against Humanity is a game for horrible people, not sure how to play?
      Lurkmoar newb, you'll figure it out. Commands to play:

      /join - Used to join a game, must be run whether a game is already going or not

      /start - If a game is not going, use this command to start it. A minimum amount of players must be /join'ed

      /hand - Run at any time to view your hand, it will include the numbers needed to /play

      /play - Play one or more cards from your hand, examples:
      /play 4
      /play 8 2

      /pick - If you are the player who is picking the winner use this like:
      /pick 3
      `);
  }

  /**
    * A new user has /join'ed the game, acknowledge their existance
    * @param {string} playerName The unique id of the new player
    * @returns {void}
    */
  newPlayer(playerName) {
    this.say(`${playerName} wants to try and be funny, he joined the game!`);
  }

  /**
    * Informs players that someone has been removed from the game
    * @param {string} playerName The unique id of the new player
    * @returns {void}
    */
  lostPlayer(playerName) {
    this.say(`${playerName} was removed from the game, no one liked him anyway`);
  }

  /**
    * A new round has started, output details
    * @param {string} name Player name that is /pick'ing this round
    * @param {string} card The black card text for this round
    * @param {number} roundNum Current number of rounds that have passed
    * @returns {void}
    */
  roundStart(name, card, roundNum) {
    this.say(stripIndents`${
        roundNum === 1 ? 'Hands off your dicks because the game has started!' :
        `Guess it\'s time for another round then! Round ${roundNum}`
      }
      ${name}\'s turn to pick!

      -   ${card.text}${card.pick !== 1 ? ` ( PLAY ${card.pick} )` : ''}

    `);
  }

  /**
    * Inform a player that their action has failed
    * @param {Player} player The unique id of the new player
    * @param {number} failCode Numeric reason for the failure
    * @returns {boolean}
    */
  informFailure(player, failCode) {
    this.privateMessage(player.socket, FailureReasons[failCode]);

    return false;
  }

  /**
    * Output the cards in target players hand
    * @param {Player} player Player object to pull the hand from
    * @returns {void}
    */
  showHand(player) {
    let hand = player.hand;

    if (hand !== false) {
      this.privateMessage(player.socket, `Your cards:\n${player.hand}`);
    }
  }

  /**
    * A player has played a card, announce it because that's all you're good for
    * @param {string} playerName Name of player who /play'ed
    * @param {number} waitingCount The number of players waiting to play
    * @returns {void}
    */
  informPlay(playerName, waitingCount) {
    this.say(`${playerName} has played, ${waitingCount === 0 ? 'ready to pick!':
      `waiting on ${waitingCount} players`}`);
  }

  /**
    * Output the picker's choices (white cards /play'ed)
    * @param {string} playerName Name of the current picker
    * @param {array} choices Array of objects containing played whitecards
    * @param {string} blackCard The current black card text
    * @returns {void}
    */
  pickChoices(playerName, choices, blackCard) {
    let cardText = '';
    for (let i = 0, j = choices.length; i < j; i++) {
      cardText += `${i + 1}) ${choices[i].cards.join(' - ')}\n`;
    }

    this.say(stripIndents`${playerName} what's your choice?
      ${blackCard}

      ${cardText}`);
  }

  /**
    * The picker has picked the winner
    * @param {string} pickerName Name of the current picker
    * @param {object} winningPick Object containing the winner name and card text
    * @returns {void}
    */
  userPicked(pickerName, winningPick) {
    this.say(stripIndents`${pickerName} gave ${winningPick.player.name} the win
      with: ${winningPick.cards.join(' - ')}`);
  }

  /**
    * Output the current points
    * @param {array} pointsArray Array of objects containing points and names
    * @returns {void}
    */
  sendPoints(pointsArray) {
    pointsArray.sort( (p1, p2) => p1.points - p2.points ).reverse();

    let points = [ ['Rank:', 'Points:', 'Player:'] ];
    for (let i = 0, j = pointsArray.length; i < j; i++) {
      points.push([ i + 1, pointsArray[i].points, pointsArray[i].name ]);
    }

    this.say(stripIndents`Points:
      ${table(points, tableConfig)}`);
  }

  /**
    * The game has been won- output the winner's name
    * @param {string} winnerName The winner's name
    * @returns {void}
    */
  gameWon(winnerName) {
    this.say(`${winnerName} has won, the rest of you suck. /join to play again.`);
  }

  /**
    * Warn players that their time is running out
    * @param {number} timeleft time in seconds left to play
    * @returns {void}
    */
  playWarning(timeleft) {
    this.say(`Only ${timeleft} seconds left, hurry and /play. . .`);
  }

  /**
    * Someone has failed to /play a card, output notification
    * @param {array} shittyPlayers An array of player names who didn't /play
    * @returns {void}
    */
  playFailure(shittyPlayers) {
    this.say(stripIndents`${shittyPlayers.join(', ')} failed to /play -.-"
      Everyone else gets points. Moving on. . .`);
  }

  /**
    * Warn the current picker that their time is running out
    * @param {number} timeleft Time in seconds left to play
    * @param {string} pickerName Current picker name
    * @returns {void}
    */
  pickWarning(timeleft, pickerName) {
    this.say(stripIndents`${pickerName} stop picking your butt and /pick a
          card- ${timeleft} seconds left. . .`);
  }

  /**
    * The picker has failed to fucking /pick, make fun of them
    * @param {string} shittyPicker The one who fails at the simplest things
    * @returns {void}
    */
  pickFailure(shittyPicker) {
    this.say(stripIndents`${shittyPicker} had one job and failed.
      Everyone else gets points. Moving on. . .`);
  }

  /**
    * The game has failed, due to lack of players
    * @returns {void}
    */
  failedGame() {
    this.say(`And now we don't have enough players, so I guess:`);
  }
}

module.exports = Announcer;
