// A script which will extract an SDK tarball placed in
// cordova-plugin-bbmenterprise/src/ios and put it in the place where this
// plugin expects to find it.

const fs = require('fs');
const tar = require('tar');
const path = require('path');

module.exports = context => {
  // The name of the SDK directory is dynamic, so it needs to be handled with a
  // hook script. Find it, then copy it recursively.
  const pluginDir = path.join(context.opts.plugin.pluginInfo.dir, 'src', 'ios');

  // Find a tarball in the plugin directory.
  console.log('Look in ' + pluginDir);
  const tarballs = fs.readdirSync(pluginDir).filter(
    file => file.endsWith('.tgz') ||
            file.endsWith('.tar.gz') );

  if(tarballs.length == 0) {
    throw new Error('Could not find sdk to extract. Please place SDK in BBMEnterprise/src/ios');
  }
  if(tarballs.length > 1) {
    throw new Error(
`Multiple tarballs available in BBMEnterprise/src/ios:
${tarballs.join('\n')}
Please place only one sdk there.`);
  }
  return tar.extract({
    file: path.join(pluginDir, tarballs[0]),
    cwd: path.join('plugins', 'cordova-plugin-bbmenterprise', 'src', 'ios'),
    // Strip the leading directory name, because it contains an unpredictable
    // version number.
    strip: 1,
    sync: true
  });
};
