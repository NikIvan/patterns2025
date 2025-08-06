'use strict';

/**
 *
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
const numberSorter = (a, b) => {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
};

/**
 *
 * @param {String} a
 * @param {String} b
 * @returns
 */
const stringSorter = (a, b) => a.toUpperCase().localeCompare(b.toUpperCase());

module.exports = {
  numberSorter,
  stringSorter,
};
