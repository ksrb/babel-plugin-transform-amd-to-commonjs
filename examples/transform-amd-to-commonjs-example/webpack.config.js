'use strict';

const path = require('path');

module.exports = {
  entry: './index',
  output: {
    filename: 'bundle.js',
    path: path.resolve('./build'),
    library: 'TestBundleDayum'
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./more-modules'), 'node_modules'],
    alias: {
      'module-alias': 'aliased-module',
      'cesium': path.resolve(process.cwd(), './node_modules/cesium/Source/Cesium.js'),
    }
  }
};
