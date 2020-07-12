const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env) => {
  return {
    entry: './src/index.ts',
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      path: path.join(__dirname, '/dist'),
      filename: 'build.js',
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: [/node_modules/, /dist/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/preset-typescript'],
                plugins: ['@babel/proposal-class-properties', '@babel/proposal-object-rest-spread'],
              },
            },
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, 'build'),
      historyApiFallback: true,
      host: '0.0.0.0',
      compress: true,
      hot: true,
      port: 4000,
      publicPath: '/',
    },
    devtool: 'source-map',
    plugins: [
      new HtmlWebpackPlugin({
        template: './template/index.html',
      }),
      new MiniCssExtractPlugin(),
    ],
  };
};
