'use strict';

const identityFn = (value) => value;

const transformStringToNumber = (value) => +value;

const transformNumberToString = (value) => value.toString();

module.exports = {
  identityFn,
  transformStringToNumber,
  transformNumberToString,
};
