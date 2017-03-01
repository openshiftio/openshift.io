const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');

module.exports = {
  entry: './app/index.ts',
  devtool: 'source-map',
  output: {
    filename: 'bundle.js',
    path: 'dist'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ],
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
        template: 'app/index.html', 
        chunksSortMode: 'dependency',

      }),
      new DefinePlugin({
        AUTH_API_URL: JSON.stringify(process.env.FABRIC8_WIT_API_URL)
      })
      
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