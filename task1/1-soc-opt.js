'use strict';

const { stringSorter } = require('./utilities/sorting.utilities.js');
const {
  identityFn,
  transformNumberToString,
} = require('./utilities/transform.utilities.js');
const { ORDER } = require('./constants.js');

const parseCSVToArraysOfStrings = require('./parse');

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

const EOL = '\n';

const defaultColumnDefinition = {
  label: undefined,
  parse: identityFn,
  format: (value) => value.padEnd(18),
  sorterFn: stringSorter,
};

Object.freeze(defaultColumnDefinition);

const AGGREGATION_MAX = 'max';
const AGGREGATION_SUM = 'sum';

const aggregationFunctions = {
  [AGGREGATION_MAX]: (a, b) => Math.max(a, b),
  [AGGREGATION_SUM]: (a, b) => a + b,
};

Object.freeze(aggregationFunctions);

const validateCSVString = (input) => {
  if (typeof input !== 'string') {
    throw new Error('No data provided');
  }
};

/**
 *
 * @param {Object} object
 * @param {Object} validators
 */
const validateObject = (object, validators) => {
  if (typeof object !== 'object') {
    throw new Error('Invalid column definition');
  }

  Object.keys(object).forEach((key) => {
    if (validators[key]) {
      const validate = validators[key];

      if (!validate(object[key])) {
        throw new Error(
          `Invalid column definition ${key} at 
          ${JSON.stringify(object)}
        `);
      }
    }
  });
};

const validateColumnDefinitions = (columnDefinitions) => {
  if (typeof columnDefinitions !== 'object') {
    throw new Error('Invalid column definitions');
  }

  const columnDefinitionValidators = {
    label: (value) => typeof value === 'string' || value === undefined,
    parse: (value) => typeof value === 'function' || value === undefined,
    format: (value) => typeof value === 'function' || value === undefined,
    aggregation: (value) => Array.isArray(value) || value === undefined,
  };

  Object.values(columnDefinitions).forEach((columnDefinition) => {
    validateObject(columnDefinition, columnDefinitionValidators);
  });
};

const validateCalculableColumnDefinitions = (calculableColumnDefinitions) => {
  if (typeof calculableColumnDefinitions !== 'object') {
    throw new Error('Invalid calculable column definitions');
  }

  const columnDefinitionValidators = {
    label: (value) => typeof value === 'string' || value === undefined,
    getValue: (value) => typeof value === 'function',
    format: (value) => typeof value === 'function',
  };


  Object.values(calculableColumnDefinitions).forEach((columnDefinition) => {
    validateObject(columnDefinition, columnDefinitionValidators);
  });
};

const validateDelimiters = (delimiter, eolDelimiter) => {
  if (typeof delimiter !== 'string') {
    throw new Error('Invalid delimiter');
  }

  if (typeof eolDelimiter !== 'string' &&
      eolDelimiter !== undefined) {
    throw new Error('Invalid EOL delimiter');
  }
};

const validateDataLengthModifiers = (start, length) => {
  if (
    Number.isNaN(start) ||
    Number.isNaN(length) ||
    start < 0 ||
    length <= 0
  ) {
    throw new Error('Invalid start or length');
  }
};

const validateSortingParameters = (sortBy, sortOrder) => {
  if (typeof sortBy !== 'string' &&
      sortBy !== undefined) {
    throw new Error('Invalid sortBy parameter');
  }

  const isSortOrderPresent = sortOrder !== undefined;
  const isValidOrder = Object.values(ORDER)
    .some((value) => sortOrder === value);

    if (isSortOrderPresent && !isValidOrder) {
    throw new Error('Invalid sortOrder parameter');
  }
};

const validateTableIntegrity = (headers, rows) => {
  const len = headers.length;

  rows.forEach((row) => {
    if (row.length !== len) {
      throw new Error('Data integrity failed');
    }
  });
};

// Parsing
const parseData = (
  headers,
  rows,
  columnDefinitions,
) => {
  const table = [];

  for (const row of rows) {
    const rowObject = {};

    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      const columnDefinition = Object.assign(
        {},
        defaultColumnDefinition,
        columnDefinitions[key],
      );

      const { parse } = columnDefinition;

      const value = parse(row[i]);
      rowObject[key] = value;
    }

    table.push(rowObject);
  };

  return table;
};

const getTableStats = (table, columnDefinitions) => {
  const stats = {};

  const keysWithAggregation = Object.keys(columnDefinitions)
    .filter((key) => {
      const { aggregation } = columnDefinitions[key];
      return Array.isArray(aggregation) && aggregation.length > 0;
    });

  for (const key of keysWithAggregation) {
    const { aggregation } = columnDefinitions[key];

    for (const row of table) {
      for (const aggregationType of aggregation) {
        if (!stats[key]) {
          stats[key] = {};
        }

        if (!stats[key][aggregationType]) {
          stats[key][aggregationType] = row[key];
        } else {
          stats[key][aggregationType] = aggregationFunctions[aggregationType](
            stats[key][aggregationType],
            row[key],
          );
        }
      }
    }
  }

  return stats;
};

const getTableWithCalculableColumns = (
  originalTable,
  stats,
  calculableColumnDefinitions,
) => {
  const table = [];
  const calculableColumns = Object.keys(calculableColumnDefinitions);

  for (const key of calculableColumns) {
    const columnDefinition = calculableColumnDefinitions[key];
    const { getValue } = columnDefinition;

    for (const row of originalTable) {
      const calculatedValue = getValue(row, stats);
      const fullRow = Object.assign({}, row);
      fullRow[key] = calculatedValue;
      table.push(fullRow);
    }
  }

  return table;
};

// Formatting
const formatRow = (row, columnDefinitions, calculableColumnDefinitions) => {
  const keys = Object.keys(row);

  return keys.map((key) => {
    const columnDefinition = columnDefinitions[key] ||
      calculableColumnDefinitions[key] ||
      defaultColumnDefinition;

    return columnDefinition.format(row[key]);
  }).join('');
};

const main = ({
  data,
  columnDefinitions = {},
  calculableColumnDefinitions = {},
  delimiter = ',',
  eolDelimiter = EOL,
  start = 0,
  length = 10,
  sortBy,
  sortOrder = ORDER.ASC,
}) => {
  validateCSVString(data);
  validateColumnDefinitions(columnDefinitions);
  validateCalculableColumnDefinitions(calculableColumnDefinitions);
  validateDelimiters(delimiter, eolDelimiter);
  validateDataLengthModifiers(start, length);
  validateSortingParameters(sortBy, sortOrder);

  if (data.length === 0) {
    return [];
  }

  const [headers, ...rows] = parseCSVToArraysOfStrings(
    data,
    delimiter,
    eolDelimiter,
  );

  validateTableIntegrity(headers, rows);

  const originalTable = parseData(
    headers,
    rows,
    columnDefinitions,
  );

  const stats = getTableStats(originalTable, columnDefinitions);

  let table = getTableWithCalculableColumns(
    originalTable,
    stats,
    calculableColumnDefinitions,
  );

  table = table.slice(start, start + length - 1);

  if (sortBy !== undefined) {
    const sorterFn = columnDefinitions[sortBy]?.sorterFn ||
      calculableColumnDefinitions[sortBy]?.sorterFn ||
      defaultColumnDefinition.sorterFn;

    table.sort((rowA, rowB) => {
      let valueA = rowA[sortBy];
      let valueB = rowB[sortBy];

      if (sortOrder === ORDER.DESC) {
        valueA = rowB[sortBy];
        valueB = rowA[sortBy];
      }

      return sorterFn(valueA, valueB);
    });
  }

  const result = table.map(
    (row) => formatRow(
      row,
      columnDefinitions,
      calculableColumnDefinitions,
    ));

  return result;
};

module.exports = {
  main,
  formatNumber: transformNumberToString,
  AGGREGATION_MAX,
};
