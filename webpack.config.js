var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var ZipPlugin = require('zip-webpack-plugin')
var getTheme = require('./tools/customize_theme')

var theme = getTheme(__dirname)

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    popup:            './src/popup/index.js',
    content_script:   './src/extension/scripts/content_script/index.js',
    inject:           './src/extension/scripts/inject.js',
    background:       './src/extension/scripts/bg.js',
    sign_in_google:   './src/extension/scripts/sign_in_google.js',
    related_elements: './src/related_elements/index.js',
    annotate:         './src/annotate/index.js',
    build_bridge:     './src/build_bridge/index.js',
    image_area:       './src/image_area/index.js',
    upsert_relation:  './src/upsert_relation/index.js',
    upsert_note_type:  './src/upsert_note_type/index.js',
    sub_category:  './src/sub_category/index.js',
    after_create_bridge: './src/after_create_bridge/index.js',
    element_description: './src/element_description/index.js',
    flag_content: './src/flag_content/index.js',
    share_content: './src/share_content/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  optimization: {
    minimizer: [],
    splitChunks: {
      chunks: chunk => chunk.name === 'popup',
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
        ext$:     path.resolve(__dirname, './src/common/web_extension.js'),
        cs_api$:  path.resolve(__dirname, './src/common/api/cs_api')
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
    new CleanWebpackPlugin(path.resolve(__dirname, 'dist')),
    new CopyWebpackPlugin((function () {
      const list = [
        {
          from: 'src/extension/assets',
          transform: function (content, filepath) {
            if (process.env.NODE_ENV !== 'production')    return content
            if (filepath.indexOf('manifest.json') === -1) return content

            const manifest = JSON.parse('' + content)
            delete manifest.content_security_policy

            return JSON.stringify(manifest, null, 2)
          }
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
    }),
    new ZipPlugin({
      path: '..',
      filename: `chrome_ext.zip`
    })
  ])
}
