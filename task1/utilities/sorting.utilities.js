'use strict';

const { ORDER } = require('../constants');

const numberSorter = (a, b, sortOrder) => {
  if (a < b) {
    return sortOrder === ORDER.DESC ? 1 : -1;
  }

  if (a > b) {
    return sortOrder === ORDER.DESC ? -1 : 1;
  }

  return 0;
};

const stringSorter = (a, b, sortOrder) => {
  let result = a.localeCompare(b);

  if (sortOrder === ORDER.DESC) {
    result *= -1;
  }

  return result;
};

module.exports = {
  numberSorter,
  stringSorter,
};
