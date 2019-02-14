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

const path = require('path');
const fs = require('fs-extra');

module.exports = function(context) {
  // Copy files or whole packages from node_modules into the project.

  // The following will all be copied. They may be files or directories.
  // Files should be specified as an array of the components of the path,
  // i.e. ['module', 'src', 'file.js'].
  const nodeModuleFiles = [
    ['@webcomponents']
  ];

  // Copy each dependency into the project.
  for (file of nodeModuleFiles) {
    const source = path.resolve(context.opts.projectRoot, 'node_modules', ...file);
    const target = path.resolve(context.opts.projectRoot, 'www', ...file)
    fs.ensureDirSync(path.dirname(target));
    fs.copySync(source, target);
  }
}
