var path = require('path')
var fs = require('fs')

module.exports = function (rootDir) {
  var pkgPath = path.join(rootDir, 'package.json');
  var pkg = fs.existsSync(pkgPath) ? require(pkgPath) : {};

  var theme = {};
  if (pkg.theme && typeof pkg.theme === 'string') {
    var cfgPath = pkg.theme;

    if (cfgPath.charAt(0) === '.') {
      cfgPath = path.resolve(rootDir, cfgPath);
    }

    var getThemeConfig = require(cfgPath);
    theme = getThemeConfig();
  } else if (pkg.theme && typeof pkg.theme === 'object') {
    theme = pkg.theme;
  }

  return theme
}
