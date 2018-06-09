var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var getTheme = require('./tools/customize_theme')

var theme = getTheme(__dirname)

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    sdk:            './src/sdk/sdk.js',
    related_elements: './src/related_elements/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist_sdk'),
    filename: '[name].js'
  },
  optimization: {
    splitChunks: {
      chunks: chunk => chunk.name === 'related_elements',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /node_modules/,
          priority: -10
        }
      }
    }
  },
  resolve: {
    alias: Object.assign(
      {
        ext$:     path.resolve(__dirname, './src/sdk/web_extension.js'),
        cs_api$:  path.resolve(__dirname, './src/sdk/api')
      },
      !isProduction ? {
        'antd/dist/antd.less': 'antd/dist/antd.css'
      } : {}
    )
  },
  module: {
    rules: (function () {
      const list = [
        {
          test: /\.(js|jsx)$/,
          use: 'babel-loader',
          exclude: /(node_modules|bower_components)/
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.svg$/,
          loader: 'svg-react-loader',
          exclude: /(node_modules|bower_components)/
        }
      ]

      if (isProduction) {
        list.push({
          test: /\.less$/,
          use: ExtractTextPlugin.extract([
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader'
            },
            {
              loader: 'less-loader',
              options: {
                modifyVars: theme,
                javascriptEnabled: true
              }
            }
          ])
        })
      }

      return list
    })()
  },
  plugins: [
    isProduction
      ? new ExtractTextPlugin('antd.css')
      : null,
    new CleanWebpackPlugin(path.resolve(__dirname, 'dist_sdk')),
    new CopyWebpackPlugin((function () {
      const list = [
        {
          from: 'src/extension/assets/related_elements.html'
        },
        {
          from: 'src/extension/assets/svg',
          to: 'svg'
        },
        {
          from: 'src/extension/assets/img',
          to: 'img'
        }
      ]

      if (!isProduction) {
        list.push({
          from: 'node_modules/antd/dist/antd.css'
        })
      }

      return list
    })()),
    new webpack.DefinePlugin({
      '__DEVELOPMENT__': JSON.stringify(!isProduction),
      'process.env': {
        NODE_ENV: isProduction ? '"production"' : '"development"'
      }
    })
  ].filter(x => x),
  devtool: 'inline-source-map'
};

if (isProduction) {
  delete module.exports.devtool
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
