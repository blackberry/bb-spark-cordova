// A script which will extract an SDK tarball placed in
// cordova-plugin-bbmenterprise/src/android and put it in the place where this
// plugin expects to find it.

const fs = require('fs-extra');
const tar = require('tar');
const path = require('path');
const execSync = require('child_process').execSync;

const pluginPath = ['plugins', 'cordova-plugin-bbmenterprise', 'src', 'android'];

module.exports = context => {
  // The name of the SDK directory is dynamic, so it needs to be handled with a
  // hook script. Find it, then copy it recursively.
  const pluginDir = path.join(context.opts.plugin.pluginInfo.dir, 'src', 'android');

  // Find a tarball in the plugin directory.
  console.log('Look in ' + pluginDir);
  const tarballs = fs.readdirSync(pluginDir).filter(
    file => file.endsWith('.tgz') ||
            file.endsWith('.tar.gz') );

  if(tarballs.length == 0) {
    throw new Error('Could not find sdk to extract. Please place SDK in BBMEnterprise/src/android');
  }
  if(tarballs.length > 1) {
    throw new Error(
`Multiple tarballs available in BBMEnterprise/src/android:
${tarballs.join('\n')}
Please place only one sdk in the directory.`);
  }
  tar.extract({
    file: path.join(pluginDir, tarballs[0]),
    cwd: path.join(...pluginPath),
    // Strip the leading directory name, because it contains an unpredictable
    // version number.
    strip: 1,
    sync: true
  });

  // Compile the support library plugin.
  const source = pluginPath.concat(['examples', 'Support', 'Support']);
  
  // Choose which gradle to use. Default to the one in the path, but allow it
  // to be overridden using the GRADLE environment variable.
  const envGradle = process.env['GRADLE'];
  const gradle = envGradle ? envGradle : 'gradle';

  console.log('Run ' + gradle + ' assemble_mockProvider')
  console.log('In ' + path.join(...source))
  const result = execSync(gradle + ' assemble_mockProvider', {
    cwd: path.join(...source),
    stdio: ['pipe', 'pipe', 2]
  });
};
