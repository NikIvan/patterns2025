'use strict';

const util = require('util');
const { parseCSVToArraysOfStrings } = require('./utilities/parse.utilities.js');
const { identityFn } = require('./utilities/transform.utilities.js');

// Tasks for rewriting:
//   - Watch week 1 lectures about SoC, SRP, code characteristics, V8
//   - Apply optimizations of computing resources: processor, memory
//   - Minimize cognitive complexity
//   - Respect SRP and SoC
//   - Improve readability (understanding), reliability
//   - Optimize for maintainability, reusability, flexibility
//   - Make code testable
//   - Implement simple unittests without frameworks
// Additional tasks:
//   - Try to implement in multiple paradigms: OOP, FP, procedural, mixed
//   - Prepare load testing and trace V8 deopts

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

const EOL = '\n';
const SEPARATOR = ',';

const columnsConfig = Object.freeze({
  city: Object.freeze({
    format: (value) => value.toString().padEnd(18),
  }),
  population: Object.freeze({
    format: (value) => value.toString().padStart(10),
  }),
  area: Object.freeze({
    format: (value) => value.toString().padStart(8),
  }),
  density: Object.freeze({
    format: (value) => value.toString().padStart(8),
  }),
  country: Object.freeze({
    format: (value) => value.toString().padEnd(18),
  }),
  percentage: Object.freeze({
    format: (value) => value.toString().padStart(6),
  }),
});

const getLog = (tag) => (...args) => {
  console.log(tag);
  console.log(util.inspect(args, { depth: null, colors: true }));
  return args;
};

const pipe = (...fns) => (x) =>
  fns.reduce((v, fn) => fn(v), x);

/**
 * Functional paradigm utility function
 *
 * @param {Function} fn
 * @param  {...any} args
 * @returns Function
 */
function curry(fn) {
  const arity = fn.length;

  return function $curry(...args) {
    if (args.length < arity) {
      return $curry.bind(null, ...args);
    }

    return fn.call(null, ...args);
  };
}

const map = curry((fn, array) => array.map(fn));

const parseRowArraysToTable = (rows) => {
  const [header, ...dataRows] = rows;

  return dataRows.map((row) => header.reduce((acc, key, index) => {
    if (Number.isNaN(parseInt(row[index], 10))) {
      acc[key] = row[index];
    } else {
      acc[key] = parseInt(row[index], 10);
    }

    return acc;
  }, {}));
};

const getTableMax = (table, column) => table.reduce((max, row) => {
    const value = row[column];
    return value > max ? value : max;
  }, table[0][column]);

const addDensityPercentage = (table) => {
  const maxDensity = getTableMax(table, 'density');
  return table.map((row) => {
    const densityPercentage = Math.round((row.density * 100) / maxDensity);
    return {
      ...row,
      percentage: densityPercentage,
    };
  });
};

const sortTable = (table) => [...table].sort((a, b) => {
    const densityA = parseInt(a.density, 10);
    const densityB = parseInt(b.density, 10);
    return densityB - densityA;
  });

const rowToString = (columnsConfig) => (row) =>
  Object.keys(row).reduce((acc, key) => {
    const format = columnsConfig[key]?.format ?? identityFn;
    return acc + format(row[key]);
  }, '');

console.dir(rowToString(columnsConfig)({
  city: 'New York City',
  population: 8537673,
  area: 784,
  density: 10892,
  country: 'United States',
}), { depth: null, colors: true });

const tableToString = map(rowToString(columnsConfig));

const getCSVParser = (separator, eolSeparator) => (input) =>
  parseCSVToArraysOfStrings(input, separator, eolSeparator);

const getMain = (SEPARATOR, EOL) => pipe(
      getCSVParser(SEPARATOR, EOL),
      parseRowArraysToTable,
      addDensityPercentage,
      sortTable,
      tableToString,
    );

// getMain(SEPARATOR, EOL)(data);

module.exports = {
  getMain,
  getLog,
};
