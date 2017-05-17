const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
// Helper functions
const ROOT = path.resolve(__dirname, '.');
const isProd = process.env.NODE_ENV === "production";

const sassModules = [
  {
    name: 'bootstrap'
  }, {
    name: 'font-awesome',
    module: 'font-awesome',
    path: 'font-awesome',
    sass: 'scss'
  }, {
    name: 'patternfly',
    module: 'patternfly-sass-with-css'
  }
];

sassModules.forEach(val => {
  val.module = val.module || val.name + '-sass';
  val.path = val.path || path.join(val.module, 'assets');
  val.modulePath = val.modulePath || path.join('node_modules', val.path);
  val.sass = val.sass || path.join('stylesheets');
  val.sassPath = path.join(ROOT, val.modulePath, val.sass);
});

const extractSass = new ExtractTextPlugin({
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
    }
  ]);
}

module.exports = {
  entry: ['./src/app/index.ts'],
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
        test: /\.scss$/,
        use: extractSass.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader'
          }, {
            loader: 'sass-loader',
            options: {
              includePaths: sassModules.map(val => {
                return val.sassPath;
              })
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
      }, {
        test: /\.html$/,
        use: ['html-loader']
      }, {
        test: /\.mp4$/,
        loader: 'url?limit=10000&mimetype=video/mp4'
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
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'better-decisions.html',
      template: 'src/app/pages/_learn-more/better-decisions.html',
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'end-to-end.html',
      template: 'src/app/pages/_learn-more/end-to-end.html',
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'install-nothing.html',
      template: 'src/app/pages/_learn-more/install-nothing.html',
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'microservices.html',
      template: 'src/app/pages/_learn-more/microservices.html',
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'planning-tools.html',
      template: 'src/app/pages/_learn-more/planning-tools.html',
      chunksSortMode: 'dependency'
    }),
    new HtmlWebpackPlugin({
      filename: 'rhdp-membership.html',
      template: 'src/app/pages/_learn-more/rhdp-membership.html',
      chunksSortMode: 'dependency'
    }),
    new DefinePlugin({
      AUTH_API_URL: JSON.stringify(process.env.FABRIC8_WIT_API_URL),
      STACK_API_URL: JSON.stringify(process.env.FABRIC8_STACK_API_URL),
      ANALYTICS_WRITE_KEY: JSON.stringify(process.env.ANALYTICS_WRITE_KEY || "disabled"),
      WAITLIST_URL: JSON.stringify(process.env.WAITLIST_URL),
    }),
    new CopyWebpackPlugin([
      { from:
          './src/assets/media/*.mp4',
        to:
          '_openshiftio/assets/media/[name].mp4'
      }
    ]),
    extractSass,
    webpackCopyPlugin,
    /*
     * Generate FavIcons from the master svg in all formats
     */
    new FaviconsWebpackPlugin({
      logo: './src/assets/images/favicon.svg',
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
