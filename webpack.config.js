var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
.filter(function(x) {
  return ['.bin'].indexOf(x) === -1;
})
.forEach(function(mod) {
  nodeModules[mod] = 'commonjs ' + mod;
});


module.exports = {
  devtool: 'inline-source-map',
  entry: ['babel-polyfill', './src/quipslack.js'],
  output: {
    path: __dirname + '/dist/js/',
    filename: 'app.js'
  },
  module: {
    loaders: [
      {
         loader: "babel-loader",
         include: [
           path.resolve(__dirname, "src"),
         ],
         exclude: [
          path.resolve(__dirname, "node_modules"),
        ],
         test: /\.jsx?$/,
         query: {
           plugins: ['transform-runtime'],
           presets: ['es2015', 'stage-0'],
         }
      }
    ]
  },
  externals: nodeModules
};
