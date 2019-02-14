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

const Monitor = require('./utils/Monitor');

// For classes which requires transforming the messages, keep a mapping from
// the original handler to the transformed handler so that the transformed
// handler can be deregistered from the monitor.
//
// The map entries need to be unique per observable and per handler on the
// observable, so this is a two-level map, first on a JSON description of the
// observable, second on handler.
const handlerMap = new Map();

// A utility function to give a key to use as a map entry into the handlerMap.
const makeKey = (key, prop) => JSON.stringify({key: key, prop: this._property});

/**
 * @class Observable
 * @classdesc
 * Provides functionality for the derived class to add or remove event listeners
 * to monitor changed properties.
 * 
 * This requires getObjectId to be overridden by the deriving class.
 */
class Observable {
  constructor() {
    this._property = undefined;
    this._matching = false;
    this.monitor = new Monitor();
  }

  /**
   * @returns {string} Object ID. Must be overridden by the derived class.
   */
  getObjectId() {
    throw new Error('getObjectId is not implemented');
  }

  /**
   * Attaches an event handler to the specified object.
   * @param {function} handler Event handler.
   */
  addEventListener(handler) {
    if (typeof(handler) !== 'function') {
      throw new Error('Invalid eventHandler');
    }

    const key = this.getObjectId();

    console.log("Observable.addEventListener: key="+key+" this._property="+this._property);

    if(this.transform) {
      const transformer = this.transform;

      // Transforms are applied differently to lists - it applies to the
      // elements of the list if and only if elements is present.
      let transformedHandler;
      if(!this._property || this._matching) {
        // List case.
        transformedHandler = list => {
          // See if there is an 'elements'.
          if(list.elements) {
            // There is, replace it by mapping the elements with the transform.
            handler(Object.assign({}, list,
                                  {elements: list.elements.map(transformer)}));
          } else {
            // No elements, just return the list.
            handler(list);
          }
        };
      } else {
        transformedHandler = element => handler(transformer(element));
      }

      // Find a map entry for the key/property.
      const keyProp = makeKey(key, this._property);
      let handlerMapEntry = handlerMap.get(keyProp);

      // Make sure the entry exists.
      if(!handlerMapEntry) {
        handlerMapEntry = new Map();
        handlerMap.set(keyProp, handlerMapEntry);
      }

      // Store the mapping.
      handlerMapEntry.set(handler, transformedHandler);

      // Start monitoring.
      this.monitor.addHandler(key, this._property, this._matching, transformedHandler);
    } else {
      this.monitor.addHandler(key, this._property, this._matching, handler);
    }
  }

  /**
   * Removes an event handler from the specified object.
   * @param {function} handler Event handler to be removed.
   */
  removeEventListener(handler) {
    if (typeof(handler) !== 'function') {
      throw new Error('Invalid eventHandler');
    }

    const key = this.getObjectId();

    console.log("Observable.removeEventListener: key="+key+" this._property="+this._property);

    // See if this is a transformed handler.
    if(this.transform) {
      // Find a map entry for the key/property.
      const keyProp = makeKey(key, this._property);
      let handlerMapEntry = handlerMap.get(keyProp);

      // Make sure the entry exists.
      if(handlerMapEntry) {
        const transformedHandler = handlerMapEntry.get(handler);

        this.monitor.removeHandler(key, this._property, this._matching,
                                  transformedHandler);
        handlerMapEntry.delete(handler);

        if(handlerMapEntry.length === 0) {
          handlerMap.delete(keyProp);
        }
      } else {
        console.error(`Failed to unregister handler for ${key} - handler not found`);
      }
    } else {
      this.monitor.removeHandler(key, this._property, this._matching, handler);
    }
  }

  /**
   * An alias for addEventListener.
   * @see Observable#addEventListener.
   */
  on(handler) {
    this.addEventListener(handler);
  }

  /**
   * An alias for removeEventListener.
   * @see Observable#removeEventListener.
   */
  off(handler) {
    this.removeEventListener(handler);
  }
}

module.exports = Observable;
