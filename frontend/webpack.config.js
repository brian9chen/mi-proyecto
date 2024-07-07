const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development', // Set mode to 'development' or 'production' as needed
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'), // Output directory
    filename: 'bundle.js', // Name of the output bundle
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans the public/ directory before each build
    new HtmlWebpackPlugin({
      template: './src/index.html', // Template for generating index.html in public/
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve static files from public/
    },
    compress: true,
    port: 9000,
  },
};
