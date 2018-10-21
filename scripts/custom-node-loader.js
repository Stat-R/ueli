'use strict';
const { join } = require("path");
const { interpolateName } = require('loader-utils');

module.exports = function(content) {
  var context = this.rootContext || this.options && this.options.context;
  var url = interpolateName(this, "[hash].[ext]", {
    context,
    content,
    regExp: undefined
  });

  this.emitFile(url, content);

  var publicPath = `__webpack_public_path__ + ${JSON.stringify(url)}`;
  var devPath = `__webpack_public_path__ + ${JSON.stringify(join("build", url))}`;

  return `try {
  global.process.dlopen(module, ${publicPath});
} catch(e) {
  try {
    global.process.dlopen(module, ${devPath});
  } catch (e2) {
    throw new Error('Cannot open ' + ${JSON.stringify(url)} + ': ' + e2);
  }
};`
}
module.exports.raw = true;