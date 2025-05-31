'use strict';

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

module.exports = parseCSVToArraysOfStrings;
