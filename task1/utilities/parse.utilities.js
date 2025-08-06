'use strict';

const parseCSVToArraysOfStrings = (
  input,
  separator = ',',
  eolSeparator = '\n',
) => {
  const result = input.trim().split(eolSeparator)
    .map(
      (row) => row.trim()
        .split(separator)
        .map((cell) => cell.trim(),
      ),
    );

    return result;
  };

module.exports = {
  parseCSVToArraysOfStrings,
};
