const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
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
    filename: "[name].css",
    disable: !isProd
});

module.exports = {
  entry: ['./app/index.ts' ],
  devtool: (isProd ? 'source-map' : 'eval-source-map'),
  output: {
    filename: '[name].js',
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
          use: [ {
            loader: 'css-loader'
          }, {
            loader: 'sass-loader',
            options: {
              includePaths: sassModules.map(val => {
                return val.sassPath;
              })
            }
          }
        ]})
      }
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
    new HtmlWebpackPlugin({template: 'app/index.html', chunksSortMode: 'dependency'}),
    new DefinePlugin({
      AUTH_API_URL: JSON.stringify(process.env.FABRIC8_WIT_API_URL)
    }),
    extractSass,
    new CopyWebpackPlugin([])

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
  }
};