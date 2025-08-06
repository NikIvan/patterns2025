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

const tap = (fn) => (...args) => {
  fn(...args);
  return args[0];
};

const getLog = (tag) => tap((...args) => {
  console.log(tag);
  console.log(util.inspect(args, { depth: null, colors: true }));
});

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

const reduce = curry((fn, initialValue, array) =>
  array.reduce(fn, initialValue));

const reduceMax = curry((valueGetter, initialValue, array) =>
  reduce((max, item) => {
    const value = valueGetter(item);
    return value > max ? value : max;
  }, initialValue, array));

const sort = curry((fn, array) => [...array].sort(fn));

const parseRowArraysToTable = (rows) => {
  const [header, ...dataRows] = rows;

  return map((row) => reduce((acc, key, index) => {
    const intValue = parseInt(row[index], 10);
    acc[key] = Number.isNaN(intValue) ? row[index] : intValue;

    return acc;
  }, {}, header))(dataRows);
};

const getTableMax = (table, column) =>
  reduceMax((row) => row[column], table[0][column], table);

const addDensityPercentage = (table) => {
  const maxDensity = getTableMax(table, 'density');

  return map((row) => {
    const densityPercentage = Math.round((row.density * 100) / maxDensity);

    return {
      ...row,
      percentage: densityPercentage,
    };
  }, table);
};

const getRowDensityNumber = (row) => parseInt(row.density, 10);
const sortTable = sort((a, b) => {
    const densityA = getRowDensityNumber(a);
    const densityB = getRowDensityNumber(b);
    return densityB - densityA;
  });

const rowToString = (columnsConfig) => (row) =>
  reduce((acc, key) => {
    const format = columnsConfig[key]?.format ?? identityFn;
    return acc + format(row[key]);
  }, '', Object.keys(row));

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
    format: (value) => value.toString().padStart(18),
  }),
  percentage: Object.freeze({
    format: (value) => value.toString().padStart(6),
  }),
});

const tableToStrings = map(rowToString(columnsConfig));

const printStrings = (strings) => {
  console.log(strings.join('\n'));
};

const main = pipe(
      parseCSVToArraysOfStrings,
      parseRowArraysToTable,
      addDensityPercentage,
      sortTable,
      tableToStrings,
      printStrings,
    );

main(data);

module.exports = {
  main,
  getLog,
};
