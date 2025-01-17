const path = require('path');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const tsConfigPath = path.resolve(__dirname, "./tsconfig.json")

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'source-map',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new NodemonPlugin({
      script: './dist/index.js',
      watch: path.resolve('./dist'),
      ignore: ['*.js.map'],
      ext: 'js,njk,json',
      delay: '1000',
      verbose: true,
    }),
  ],
  resolve: {
    alias: {
      '*': path.resolve(__dirname, 'src/')
    },
    plugins: [new TsconfigPathsPlugin({
      configFile: tsConfigPath
    })],
    extensions: ['.ts', '.js', '.tsx'],
  },
  externals: [nodeExternals()],
  watch: true,
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
};
