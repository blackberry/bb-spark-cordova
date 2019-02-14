/*
 * Copyright (c) 2018 BlackBerry. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This script sets up a simulated environment, just enough to implement
// cordova.require. It can be used to unit test pure javascript parts of a
// cordova project. It cannot be used to test the parts that require native
// code.
const xml2js = require('xml2js');
const fs = require('fs');

// Read plugin.xml to set up a map of cordova.require paths to file paths.
let fileMap;
let pluginName;
const config = xml2js.parseString(fs.readFileSync('./plugin.xml'), (err, result) => {
  pluginName = result.plugin['$'].id;
  fileMap = result.plugin['js-module']
            .reduce((acc, x) => { acc[x['$'].name] = x['$'].src; return acc}, {});
});

// Simulate cordova.require.
global.cordova = {
  require: path => {
    // Make sure the module being required is from this plugin.
    if(!path.startsWith(pluginName)) {
      throw new Error(`${path} is not from this plugin`);
    }

    // Cut off the pluginName, and look it up in the file map.
    return require('./' + fileMap[path.substr(pluginName.length + 1)]);
  }
};

// Source the test file.
module.exports = require('./tests/tests.js').defineAutoTests();
