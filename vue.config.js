const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([ { from: path.join('./public', 'gltf'), to: 'model3D'}])
    ]
  }
}