const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

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
    })
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
    extensions: ['', '.js', '.jsx']
  }
}
