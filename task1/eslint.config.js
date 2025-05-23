'use strict';

const init = require('eslint-config-metarhia');

module.exports = [
  ...init,
  {
    ignores: ['**/*-granular.js', '**/*-bad.js'],
  },
];
