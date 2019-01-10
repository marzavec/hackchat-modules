const cards = require("./deck/cards.json");

/**
 * Provides stats and methods dealing with the cards.json file
 * This class could be expanded to include set scoping; choosing cards only from
 * certain sets. #tooLazyAtm
 */
class CardDeck {
  /**
   * @example
   * // Create a new deck and draw a random white card
   * const deck = new CardDeck();
   * let chosenCard = deck.whiteCard;
   */
  constructor() {
    this.blackCardCount = cards.blackCards.length;
    this.whiteCardCount = cards.whiteCards.length;
  }

  /**
   * Returns the number of black cards in the deck
   * @type {number}
   * @readonly
   */
  get blackCount() {
    return cards.blackCards.length;
  }

  /**
   * Returns the number of white cards in the deck
   * @type {number}
   * @readonly
   */
  get whiteCount() {
    return cards.whiteCards.length;
  }

  /**
    * Returns a formatted string giving the count of cards in the deck
    * @type {string}
    * @readonly
    */
  get cardStats() {
    return `${
      this.blackCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } black cards and ${
      this.whiteCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } white cards`;
  }

  /**
   * Returns a random black card
   * @type {object}
   * @readonly
   */
  get blackCard() {
    return cards.blackCards[Math.floor(Math.random() * this.blackCardCount)];
  }

  /**
   * Returns a random white card
   * @type {string}
   * @readonly
   */
  get whiteCard() {
    return cards.whiteCards[Math.floor(Math.random() * this.whiteCardCount)];
  }
}

module.exports = CardDeck;
