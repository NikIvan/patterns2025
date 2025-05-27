'use strict';

const { stringSorter } = require('./utilities/sorting.utilities');
const {
  identityFn,
  transformNumberToString,
} = require('./utilities/transform.utilities');
const { ORDER } = require('./constants');

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

const aggregationFunctions = {
  [AGGREGATION_MAX]: (a, b) => Math.max(a, b),
};

Object.freeze(aggregationFunctions);

const validateCSVString = (input) => {
  if (typeof input !== 'string') {
    throw new Error('No data provided');
  }
};

const validateColumnDefinitions = (columnDefinitions) => {
  if (typeof columnDefinitions !== 'object') {
    throw new Error('Invalid column definitions');
  }

  Object.values(columnDefinitions).forEach((columnDefinition) => {
    if (typeof columnDefinition !== 'object') {
      throw new Error('Invalid column definition');
    }

    const { label, parse, format, aggregation } = columnDefinition;

    if (typeof label !== 'string' &&
      label !== undefined
    ) {
      throw new Error(
        `Invalid column definition label at 
        ${JSON.stringify(columnDefinition)}
      `);
    }

    if (typeof parse !== 'function' &&
      aggregation !== undefined) {
      throw new Error(`
        Invalid column definition parser at 
        ${JSON.stringify(columnDefinition)}
      `);
    }

    if (typeof format !== 'function' &&
      aggregation !== undefined) {
      throw new Error(`
        Invalid column definition formatter at 
        ${JSON.stringify(columnDefinition)}
      `);
    }

    if (!Array.isArray(aggregation) &&
      aggregation !== undefined) {
      throw new Error(`
        Invalid column definition aggregation at 
        ${JSON.stringify(columnDefinition)}
      `);
    }
  });
};

const validateCalculableColumnDefinitions = (calculableColumnDefinitions) => {
  if (typeof calculableColumnDefinitions !== 'object') {
    throw new Error('Invalid calculable column definitions');
  }

  Object.values(calculableColumnDefinitions).forEach((columnDefinition) => {
    if (typeof columnDefinition !== 'object') {
      throw new Error('Invalid calculable column definition');
    }

    const { label, getValue, format } = columnDefinition;

    if (typeof label !== 'string' &&
      label !== undefined
    ) {
      throw new Error(
        `Invalid calculable column definition label at 
        ${JSON.stringify(columnDefinition)}
      `);
    }

    if (typeof getValue !== 'function') {
      throw new Error(`
        Invalid calculable column definition getter at 
        ${JSON.stringify(columnDefinition)}
      `);
    }

    if (typeof format !== 'function') {
      throw new Error(`
        Invalid calculable column definition formatter at 
        ${JSON.stringify(columnDefinition)}
      `);
    }
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

const parseCSVToArraysOfStrings = (
  input,
  delimiter,
  eolDelimiter,
) => input.trim().split(eolDelimiter)
    .map(
      (row) => row.trim()
        .split(delimiter)
        .map((cell) => cell.trim(),
      ),
    );

// Parsing
const parseData = (
  input,
  delimiter,
  eolDelimiter,
  columnDefinitions,
  calculableColumnDefinitions,
) => {
  const [headers, ...data] = parseCSVToArraysOfStrings(
    input,
    delimiter,
    eolDelimiter,
  );
  const table = [];
  const stats = {};

  for (const row of data) {
    const rowObject = {};

    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      const columnDefinition = Object.assign(
        {},
        defaultColumnDefinition,
        columnDefinitions[key],
      );

      const { parse, aggregation } = columnDefinition;

      const value = parse(row[i]);
      rowObject[key] = value;

      if (!Array.isArray(aggregation) || aggregation.length === 0) {
        continue;
      }

      for (const aggregationType of aggregation) {
        if (!stats[key]) {
          stats[key] = {};
        }

        if (!stats[key][aggregationType]) {
          stats[key][aggregationType] = value;
        } else {
          stats[key][aggregationType] = aggregationFunctions[aggregationType](
            stats[key][aggregationType],
            value,
          );
        }
      }
    }

    table.push(rowObject);
  };

  const calculableColumns = Object.keys(calculableColumnDefinitions);

  for (const key of calculableColumns) {
    const columnDefinition = calculableColumnDefinitions[key];
    const { getValue } = columnDefinition;

    for (const row of table) {
      const calculatedValue = getValue(row, stats);
      row[key] = calculatedValue;
    }
  }

  return [table, stats];
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

  if (data.length === 0) {
    return '';
  }

  let [table] = parseData(
    data,
    delimiter,
    eolDelimiter,
    columnDefinitions,
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
