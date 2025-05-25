'use strict';

const assert = require('node:assert');
const { inspect } = require('node:util');
const {
  main,
  parseNumberFromString,
  formatNumber,
  numberSorter,
  AGGREGATION_MAX,
} = require('./1-soc-opt.js');

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
    format: (value) => value.padEnd(18),
  },
  population: {
    label: 'Population',
    parse: parseNumberFromString,
    format: (value) => formatNumber(value).padStart(10),
    sorterFn: numberSorter,
  },
  area: {
    label: 'Area',
    parse: parseNumberFromString,
    format: (value) => formatNumber(value).padStart(8),
    sorterFn: numberSorter,
  },
  density: {
    label: 'Density',
    parse: parseNumberFromString,
    format: (value) => formatNumber(value).padStart(8),
    sorterFn: numberSorter,
    aggregation: [AGGREGATION_MAX],
  },
  country: {
    label: 'Country',
    format: (value) => value.padEnd(18),
  },
};

const calculableColumnDefinitions = {
  densityPercentage: {
    label: 'Density %',
    getValue: (row, stats) =>
      Math.round((row.density * 100) / stats.density[AGGREGATION_MAX]),
    format: (value) => `${formatNumber(value)}%`.padStart(9),
  },
};

const actualOutput = main({
  data,
  columnDefinitions,
  calculableColumnDefinitions,
  length: 10,
});


const expectedOutput = [
  'Lagos             16060303    1171   13712           Nigeria   100%',
  'Delhi             16787941    1484   11313             India    83%',
  'New York City      8537673     784   10892     United States    79%',
  'Sao Paulo         12038175    1521    7914            Brazil    58%',
  'Tokyo             13513734    2191    6168             Japan    45%',
  'Mexico City        8874724    1486    5974            Mexico    44%',
  'London             8673713    1572    5431    United Kingdom    40%',
  'Shanghai          24256800    6340    3826             China    28%',
  'Istanbul          14160467    5461    2593            Turkey    19%',
];

console.log(inspect(expectedOutput, {
  showHidden: false,
  depth: 4,
  compact: false,
}));
console.log('----------');
console.log(inspect(actualOutput, {
  showHidden: false,
  depth: 4,
  compact: false,
}));
console.log('----------');

if (!Array.isArray(actualOutput)) {
  throw new TypeError('Array expected');
}

if (actualOutput.length !== expectedOutput.length) {
  throw new Error(
    `Wrong array length: ${actualOutput.length} !== ${expectedOutput.length}`,
  );
}

for (let i = 0; i < actualOutput.length; i += 1) {
  assert.strictEqual(expectedOutput[i], actualOutput[i]);
}
