'use strict';

/**
 *
 * @param {any} value
 * @returns
 */
const identityFn = (value) => value;

/**
 *
 * @param {String} value
 * @returns {Number}
 */
const transformStringToNumber = (value) => +value;

/**
 *
 * @param {Number} value
 * @returns {String}
 */
const transformNumberToString = (value) => value.toString();

module.exports = {
  identityFn,
  transformStringToNumber,
  transformNumberToString,
};
