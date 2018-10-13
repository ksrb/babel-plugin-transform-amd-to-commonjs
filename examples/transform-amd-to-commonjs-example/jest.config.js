'use strict';

const webpackConfig = require('./webpack.config');

module.exports = {
  moduleDirectories: webpackConfig.resolve.modules,
  moduleNameMapper: webpackConfig.resolve.alias,
  transformIgnorePatterns: [
    "node_modules/(?!(cesium)/)"
  ]
};
