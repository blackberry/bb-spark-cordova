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

// A small helper mixin class which adapts the SpliceListAdapter to update a
// Polymer element's property.

// A symbol used to store the map of splice list adapters in a component.
let spliceMapSymbol = Symbol('SpliceListMap');

// A Promise to wait until cordova is ready. This is needed to load the
// SpliceListAdapter plugin. Resolves to the plugin.
let spliceWatcher = new Promise((resolve, reject) => {
  document.addEventListener('deviceready', () => {
    resolve(cordova.require('cordova-plugin-bbmenterprise-support.util/SpliceListAdapter'));
  });
})

// Export a mixin which provides the actual functionality. This function will
// add functionality to a class to bind a polymer property to an observable. It
// must be applied to a class implementing the PolymerElement behaviours. The
// normal usage would be to declare a class which extends
// ObservableElement(PolymerElement). However any class which extends
// PolymerElement may be substituted in place of PolymerElement.
export default parentClass => class extends parentClass {
  constructor() {
    super();
    this[spliceMapSymbol] = new Map();
  }

  bind(property, observable) {
    spliceWatcher.then(SpliceListAdapter => {
      // See if there is already a SpliceListAdapter on this property. Use it if
      // there is. Otherwise create a new one.
      const oldAdapter = this[spliceMapSymbol].get(property);
      if(oldAdapter) {
        oldAdapter.setObservable(observable);
      } else {
        // Create the SpliceListAdapter.
        const adapter = new SpliceListAdapter(
          (index, removed, ...newElements) => {
            this.splice(property, index, removed, ...newElements);
          },
          index => this[property][index],
          () => this[property].length,
          observable);

        // Store it for later removal.
        this[spliceMapSymbol].set(property, adapter);
      }
    });
  }

  unbind(property) {
    // Look up the adapter.
    const adapter = this[spliceMapSymbol].get(property);

    // Remove it, if present.
    if(adapter) {
      this[spliceMapSymbol].delete(property);
      adapter.setObservable(undefined);
    }
  }
}
