'use strict';

const assert = require('node:assert');
const {
  main,
  AGGREGATION_MAX,
} = require('./1-soc-opt.js');

const { numberSorter } = require('./utilities/sorting.utilities.js');
const {
  transformStringToNumber,
  transformNumberToString,
} = require('./utilities/transform.utilities.js');

const { ORDER } = require('./constants.js');

const greenText = (value) => `\x1b[32m${value}\x1b[0m`;

const data = `city,population,area,density,country
  Shanghai,24256800,6340,3826,China
  Delhi,16787941,1484,11313,India
  Lagos,16060303,1171,13712,Nigeria
  Istanbul,14160467,5461,2593,Turkey
  Tokyo,13513734,2191,6168,Japan
  Sao Paulo,12038175,1521,7914,Brazil
  Mexico City,8874724,1486,5974,Mexico
  London,8673713,1572,5431,United Kingdom
  New York City,8537673,784,10892,United States
  Bangkok,8280925,1569,5279,Thailand`;

const columnDefinitions = {
  city: {
    label: 'City',
    format: (value) => value.padEnd(15),
  },
  population: {
    label: 'Population',
    parse: transformStringToNumber,
    format: (value) => transformNumberToString(value).padStart(10),
    sorterFn: numberSorter,
  },
  area: {
    label: 'Area',
    parse: transformStringToNumber,
    format: (value) => transformNumberToString(value).padStart(8),
    sorterFn: numberSorter,
  },
  density: {
    label: 'Density',
    parse: transformStringToNumber,
    format: (value) => transformNumberToString(value).padStart(8),
    sorterFn: numberSorter,
    aggregation: [AGGREGATION_MAX],
  },
  country: {
    label: 'Country',
    format: (value) => value.padStart(18),
  },
};

const calculableColumnDefinitions = {
  densityPercentage: {
    label: 'Density %',
    getValue: (row, stats) =>
      Math.round((row.density * 100) / stats.density[AGGREGATION_MAX]),
    format: (value) => `${transformNumberToString(value)}%`.padStart(7),
    sorterFn: numberSorter,
  },
};

const actualOutput = main({
  data,
  columnDefinitions,
  calculableColumnDefinitions,
  length: 10,
  sortBy: 'densityPercentage',
  sortOrder: ORDER.DESC,
});


const expectedOutput = [
  'Lagos            16060303    1171   13712           Nigeria   100%',
  'Delhi            16787941    1484   11313             India    83%',
  'New York City     8537673     784   10892     United States    79%',
  'Sao Paulo        12038175    1521    7914            Brazil    58%',
  'Tokyo            13513734    2191    6168             Japan    45%',
  'Mexico City       8874724    1486    5974            Mexico    44%',
  'London            8673713    1572    5431    United Kingdom    40%',
  'Shanghai         24256800    6340    3826             China    28%',
  'Istanbul         14160467    5461    2593            Turkey    19%',
];

for (const row of actualOutput) {
  console.log(row);
}

assert.strictEqual(Array.isArray(actualOutput), true);
assert.strictEqual(actualOutput.length, expectedOutput.length);

for (let i = 0; i < actualOutput.length; i += 1) {
  assert.strictEqual(expectedOutput[i], actualOutput[i]);
}

console.log(greenText('Tests passed'));

