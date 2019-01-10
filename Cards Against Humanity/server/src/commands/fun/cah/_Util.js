/**
  * Contains various general-purpose utility methods
  */
class Util {
  constructor() {
    throw new Error('Yer using the Util class wrong. . .');
  }

  /**
   * Sets properties on an object that are not already defined
   * @param {Object} def Default properties
   * @param {Object} given Object to assign defaults to
   * @returns {Object}
   * @private
   */
  static mergeDefault(def, given) {
    if (!given) {
      return def;
    }
    
    for (const key in def) {
      if (!{}.hasOwnProperty.call(given, key)) {
        given[key] = def[key];
      } else if (given[key] === Object(given[key])) {
        given[key] = this.mergeDefault(def[key], given[key]);
      }
    }

    return given;
  }

  /**
   * Returns an array that only contains unique elements from the input array
   * @param {array} arr Input array
   * @returns {array}
   * @private
   */
  static uniqueArray(arr) {
    return arr.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
  }

  /**
   * Fisher–Yates shuffle array
   * @param {array} arr Input array
   * @returns {array}
   * @private
   */
  static shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = Util;
