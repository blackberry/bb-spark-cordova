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

// Holds the instance of Monitor class.
let instance;

const makeKey = (key, property) => `${key}.${property ? JSON.stringify(property ): ''}`;

/**
 * @class Monitor
 * @classdesc
 * Allows application to register and unregister callbacks to monitor Observable
 * objects.
 * 
 * This is a singleton class.
 */
class Monitor {
  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;
    this.handlers = new Map();
    this.isStarted = false;
  }

  /**
   * Function enables monitoring of Spark SDK objects. Invoked when Spark SDK 
   * is instantiated.
   * @throws {Error} In case if Monitor is already started.
   */
  start() {
    if (this.isStarted) {
      throw new Error('Monitor is already started');
    }

    Cordova.exec(
      this.onChangedHandler.bind(this),
      () => {},
      'SparkProxy',
      'monitorStart',
      []);
  }

  /**
   * Function disables monitoring of Spark SDK objects. Must be invoked when
   * Spark SDK is shutdown.
   * @throws {Error} In case if Monitor is not started.
   */
  stop() {
    if (!this.isStarted) {
      throw new Error('Monitor is not started');
    }

    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'monitorStop',
      []);
  }

  /**
   * Registers event listener.
   * @param {string} key Object key
   * @param {object} [property] Object property (event)
   * @param {boolean} criterion Whether the property describes a criterion,
   *                  rather than a key.
   * @param {function} handler Property changed handler
   */
  addHandler(key, property, criterion, handler) {
    // Construct a key for the handlers map.
    const mapEntry = makeKey(key, property);

    // Look up the handler list.
    const handlerList = this.handlers.get(mapEntry);

    if (handlerList) {
      console.log("Monitor.addHandler: mapEntry="+mapEntry+" found handlerList size="+handlerList.size+" value="+JSON.stringify(handlerList.value));
      // If there's already a handler, add it to the list.
      handlerList.callbacks.add(handler);

      // Invoke the first callback if there's already a cached value. If there
      // isn't, it means another handler just started observing the same thing
      // but its observeStart didn't get a response yet. The callback will be
      // invoked once there is a response.
      if(handlerList.value != undefined) {
        setTimeout(() => {
          handler(handlerList.value);
        }, 0);
      }
    } else {
      console.log("Monitor.addHandler: mapEntry="+mapEntry+" creating handlerList");
      // If there's no handler, create one, and notify the native side that this
      // key/property must be observed. The initial cache value is undefined.
      // This will be replaced with a real value once the observeStart provides
      // one.
      this.handlers.set(mapEntry, {
                                    value: undefined,
                                    callbacks: new Set([handler])
                                  });

      console.log("Monitor: observe: about to call observeStart for key="+key+" property="+JSON.stringify(property));

      Cordova.exec(
        (data) => {
          console.log("Monitor: observe: Success key="+key+" property="+JSON.stringify(property)+" data="+data);
        },
        (error) => {
          console.log("Monitor: observe: error="+error+" for key="+key+" property="+JSON.stringify(property));
        },
        'SparkProxy',
        'observeStart',
        [ key, property, criterion ]);
    }
  }

  /**
   * Unregisters event listener.
   * @param {string} key Object key
   * @param {object} [property] Object property (event)
   * @param {boolean} criterion Whether the property describes a criterion,
   *                  rather than a key.
   * @param {function} handler Property changed handler
   */
  removeHandler(key, property, criterion, handler) {
    // Construct a key for the handlers map.
    const mapEntry = makeKey(key, property);

    // See if there's a handler list.
    const handlerList = this.handlers.get(mapEntry);

    if (handlerList) {
      // Make sure the handler is in the list.
      if (!handlerList.callbacks.has(handler)) {
        console.warn(`Failed to unregister handler for ${key}: handler not found`);
        return;
      }

      // Remove the handler from the list.
      handlerList.callbacks.delete(handler);

      // If that was the last handler, then stop observing.
      if (handlerList.callbacks.size === 0) {
        this.handlers.delete(mapEntry);

        Cordova.exec(
          () => {},
          () => {},
          'SparkProxy',
          'observeStop',
          [ key, property, criterion ]);
      }
    } else {
      console.warn(`Failed to unregister handler for ${key}: no handler present`);
    }
  }

  /**
   * This function is invoked each time the monitored object is changed.
   * @param {string} change JSON string which contains key, property and the 
   * new property value.
   */
  onChangedHandler(change) {
    //catch and log errors here so that we get some stack info, since errors in callback from cordova don't have much info.
    try {
      console.log("Monitor.onChangedHandler change: "+JSON.stringify(change));

      // Look up where to apply this change.
      const mapEntry = makeKey(change[0], change[1]);

      const handlerList = this.handlers.get(mapEntry);

      if(handlerList) {
        // Update the cached value.
        // Check the "merge" parameter in the map to see if we should merge the new value with the old one if any.
        // Ensure the Object.assign is only used on objects since a global could just be the string value which would fail.
        if (change[3] === true && typeof handlerList.value === "object" && typeof change[2] === "object") {
          //plugin instructed we should merge the new value with the old one. This happens on listChange events
          handlerList.value = Object.assign(handlerList.value, change[2]);
        } else {
          handlerList.value = change[2];
        }

        console.log("Monitor.onChangedHandler: calling "+handlerList.callbacks.size+" handlers for mapEntry="+mapEntry);
        // Run any callbacks observing this.
        for(const handler of handlerList.callbacks) {
          handler(handlerList.value);
        }
      } else {
        console.log("Monitor.onChangedHandler: no handlers found for mapEntry="+mapEntry);
      }
    } catch(error) {
      console.warn("Monitor.onChangedHandler: error="+error+" change="+change);
    }
  }
}

module.exports = Monitor;
