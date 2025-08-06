'use strict';

const { identityFn } = require('./utilities/transform.utilities.js');
const { parseCSVToArraysOfStrings } = require('./utilities/parse.utilities.js');

const columnsConfig = Object.freeze({
  city: Object.freeze({
    format: (value) => value.toString().padEnd(17),
  }),
  population: Object.freeze({
    format: (value) => value.toString().padStart(8),
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
    format: (value) => `${value.toString().padStart(6)}%`,
  }),
});

class CSVParser {
  #separator;
  #eol;
  #data;

  constructor(config = {}) {
    this.#separator = config.separator || ',';
    this.#eol = config.eol || '\n';
    this.#data = [];
  }

  parse(data) {
    this.#data = parseCSVToArraysOfStrings(data, this.#separator, this.#eol);
  }

  getData() {
    return [...this.#data];
  }
}

class Row {
  #data;

  constructor(keys, values) {
    this.#data = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  }

  get(key) {
    return this.#data[key];
  }

  set(key, value) {
    this.#data[key] = value;
  }

  setFn(key, transformFn) {
    if (typeof transformFn !== 'function') {
      throw new Error('Transform function must be a function');
    }

    this.#data[key] = transformFn(this.#data);
  }

  toString() {
    return Object.values(this.#data).join(', ');
  }
}

class TableFormatter {
  #columnsConfig;

  constructor(columnsConfig) {
    this.#columnsConfig = columnsConfig;
  }

  formatRow(row) {
    if (!(row instanceof Row)) {
      throw new Error('Row must be an instance of Row class');
    }

    return Object.keys(this.#columnsConfig).map((key) => {
      const format = this.#columnsConfig[key]?.format ?? identityFn;
      return format(row.get(key));
    }).join('');
  }
}

class Table {
  #headers;
  #rows;

  constructor(headers, rows) {
    this.#headers = headers;
    this.#rows = rows.map((values) => new Row(headers, values));
  }

  getHeaders() {
    return [...this.#headers];
  }

  getRows() {
    return [...this.#rows];
  }

  getColumn(name) {
    return this.#rows.map((row) => row.get(name));
  }

  addColumn(name, values) {
    if (!Array.isArray(values)) {
      throw new Error('Values must be an array');
    }

    this.#rows = this.#rows.map((row, i) => {
      row.set(name, values[i]);
      return row;
    });

    this.#headers.push(name);
  }

  sortRows(compareFn) {
    this.#rows.sort(compareFn);
  }

  format(columnsConfig) {
    const formatter = new TableFormatter(columnsConfig);
    return this.#rows.map((row) => formatter.formatRow(row));
  }

  toString() {
    return this.#rows.map((row) => row.toString()).join('\n');
  }
}

const main = (data) => {
  const parser = new CSVParser();
  parser.parse(data);
  const parsedData = parser.getData().slice(0, -1);
  const headers = parsedData.shift();

  const table = new Table(headers, parsedData);

  const densities = table.getColumn('density');

  const maxDensity = densities.reduce((max, density) => {
    const densityNum = parseInt(density, 10);

    return Math.max(max, densityNum);
  }, 0);

  const densityPercentages = densities.map((density) =>
    Math.round((parseInt(density, 10) * 100) / maxDensity),
  );

  table.addColumn('percentage', densityPercentages);
  table.sortRows((a, b) => {
    const densityA = parseInt(a.get('density'), 10);
    const densityB = parseInt(b.get('density'), 10);
    return densityB - densityA;
  });

  return table.format(columnsConfig);
};

module.exports = {
  main,
};
