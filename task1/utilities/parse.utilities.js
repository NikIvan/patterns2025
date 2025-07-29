'use strict';

const parseCSVToArraysOfStrings = (
  input,
  separator,
  eolSeparator,
) => {
  const result = input.trim().split(eolSeparator)
    .map(
      (row) => row.trim()
        .split(separator)
        .map((cell) => cell.trim(),
      ),
    );

    console.dir({
      input,
      separator,
      eolSeparator,
      result,
    });

    return result;
  };

module.exports = {
  parseCSVToArraysOfStrings,
};
