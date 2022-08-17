const path = require('path');
const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: {
    'main': ['./src/main'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: dev ? 'inline-source-map' : 'source-map',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    }, {
      test: /\.(woff2?|ttf|eot|jpe?g|png|gif|svg)$/,
      loader: 'file-loader'
    }]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      'data': path.resolve(__dirname, 'data/'),
      'assets': path.resolve(__dirname, 'assets/'),
    }
  },
  devServer: {
    writeToDisk: true
  }
};
