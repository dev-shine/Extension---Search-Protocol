var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var getTheme = require('./tools/customize_theme')

var theme = getTheme(__dirname)

module.exports = {
  entry: {
    popup:            './src/popup/index.js',
    content_script:   './src/extension/scripts/content_script/index.js',
    inject:           './src/extension/scripts/inject.js',
    background:       './src/extension/scripts/bg.js',
    sign_in_google:   './src/extension/scripts/sign_in_google.js',
    links_modal:      './src/links_modal/index.js'
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
  module: {
    rules: [
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
      },
      {
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
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('antd.css'),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   minChunks: function (module) {
    //     return module.context && module.context.includes('node_modules')
    //   }
    // }),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'manifest',
    //   minChunks: Infinity
    // }),
    new CleanWebpackPlugin(path.resolve(__dirname, 'dist')),
    new CopyWebpackPlugin([
      {
        from: 'src/extension/assets'
      }
    ])
  ],
  devtool: 'inline-source-map'
};

if (process.env.NODE_ENV === 'production') {
  delete module.exports.devtool
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
