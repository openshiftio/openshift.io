const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');

// Helper functions
const ROOT = path.resolve(__dirname, '.');
const isProd = process.env.NODE_ENV === "production";

const extractCSS = new ExtractTextPlugin({
  filename: "/_openshiftio/[name].css",
  disable: !isProd
});

let webpackCopyPlugin;

if (isProd) {
  // In prod the docker container does this
  webpackCopyPlugin = new CopyWebpackPlugin([
    {
      from: 'src/config',
      to: 'config'
    },
    {
      from: 'manifest.json',
      to: '_openshiftio/',
      toType: 'dir'
    },
    {
      from: 'src/assets/documents',
      to: '',
      toType: 'dir'
    }
  ]);
} else {
  webpackCopyPlugin = new CopyWebpackPlugin([
    {
      from: 'src/config',
      to: '_config',
      transform: function env(content, path) {
        return content.toString('utf-8').replace(/{{ .Env.([a-zA-Z0-9_-]*) }}/g, function (match, p1, offset, string) {
          return process.env[p1];
        });
      }
    },
    {
      from: 'manifest.json',
      to: '_openshiftio/',
      toType: 'dir'
    },
    {
      from: 'src/assets/documents',
      to: '',
      toType: 'dir'
    }
  ]);
}

module.exports = {
  entry: {
    app: './src/app/index',
    clicktale: './src/app/clicktale/ctIframe'
  },
  devtool: (isProd ? 'cheap-module-source-map' : 'inline-source-map'),
  output: {
    filename: '/_openshiftio/[name].js',
    path: (isProd ? path.join(ROOT, '/dist') : '/')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }, {
        test: /\.css$/,
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              minimize: true,
              sourceMap: true
            }
          }
          ]
        })
      }, {
        test: /\.less$/,
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                sourceMap: true
              }
            }, {
              loader: 'less-loader',
              options: {
                paths: [
                  path.resolve(__dirname, "node_modules/patternfly/src/less"),
                  path.resolve(__dirname, "node_modules/patternfly/node_modules")
                ],
                sourceMap: true
              }
            }
          ]
        })
      },
      /* File loader for supporting fonts, for example, in CSS files.
       */
      {
        test: /\.woff2?$|\.ttf$|\.eot$|\.svg$/,
        loaders: [
          {
            loader: "url-loader",
            query: {
              limit: 3000,
              name: '/_openshiftio/assets/fonts/[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.png$|\.jpg$|\.gif$|\.jpeg$/,
        loaders: [
          {
            loader: "url-loader",
            query: {
              limit: 3000,
              name: '/_openshiftio/assets/images/[name].[ext]'
            }
          }
        ]
      },
      // File loader for supporting documentation files (e.g. PDFs)
      {
        test: /\.pdf$/,
        loaders: [
          {
            loader: "file-loader",
            options: {
              name: '/_openshiftio/assets/documents/[name].[ext]'
            }
          }
        ]
      },
      
      {
        test: /\.html$/,
        use: ['html-loader']
      },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  plugins: [

    /*
       * Plugin: HtmlWebpackPlugin
       * Description: Simplifies creation of HTML files to serve your webpack bundles.
       * This is especially useful for webpack bundles that include a hash in the filename
       * which changes every compilation.
       *
       * See: https://github.com/ampedandwired/html-webpack-plugin
    */
    new HtmlWebpackPlugin({
      template: 'src/app/index.html',
      chunks: ['app'],
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'features.html',
      template: 'src/app/pages/features.html',
      chunks: ['app'],
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'get-involved.html',
      template: 'src/app/pages/get-involved.html',
      chunks: ['app'],
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: './_openshiftio/clicktale/ctIframe.html',
      template: 'src/app/clicktale/ctIframe.html',
      chunks: ['clicktale']
    }),

    new DefinePlugin({
      AUTH_API_URL: JSON.stringify(process.env.FABRIC8_WIT_API_URL),
      STACK_API_URL: JSON.stringify(process.env.FABRIC8_STACK_API_URL)
    }),

    /*
     * StyleLintPlugin
     */
    new StyleLintPlugin({
      configFile: '.stylelintrc',
      syntax: 'less',
      context: 'src',
      files: '**/*.less',
      failOnError: true,
      quiet: false,
    }),

    extractCSS,
    webpackCopyPlugin,
    /*
     * Generate FavIcons from the master png in all formats
     */
    new FaviconsWebpackPlugin({
      logo: './src/assets/images/favicon.png',
      prefix: '_openshiftio/icons/'
    }),

  ],

  /*
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
  node: {
    global: true,
    crypto: 'empty',
    process: true,
    module: false,
    clearImmediate: false,
    setImmediate: false
  },
  devServer: {
    port: 3001
  }
};
