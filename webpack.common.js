const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const path = require('path')
const WebpackBundleAnalyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  entry: './src/client.js',
  output: {
    globalObject: 'this',
    library: {
      type: 'umd',
      name: 'PacketPay'
    },
    filename: 'client.js'
  },
  plugins: [
    new NodePolyfillPlugin({
      includeAliases: ['crypto']
    }),
    new WebpackBundleAnalyzer()
  ],
  // module: {
  //   rules: [
  //     {
  //       test: /\.(js|jsx)$/, // .js and .jsx files
  //       exclude: /node_modules/, // excluding the node_modules folder
  //       use: {
  //         loader: 'babel-loader'
  //       }
  //     }
  //   ]
  // },
  externals: {
    "isomorphic-fetch": "isomorphic-fetch"
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      'bn.js': path.resolve(__dirname, 'node_modules/bn.js'),
      'safe-buffer': path.resolve(__dirname, 'node_modules/safe-buffer')
    }
  }
}
