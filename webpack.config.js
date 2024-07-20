const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const tsConfigPath = path.resolve(__dirname, "./tsconfig.json")

module.exports = {
  entry: './index.ts',
  mode: 'production',
  devtool: 'source-map',
  target: 'node',
  context: path.resolve(__dirname, 'src'),
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
  watch: false,
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
};
