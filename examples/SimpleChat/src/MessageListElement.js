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

import { PolymerElement } from '../node_modules/@polymer/polymer/polymer-element.js';
import { afterNextRender } from '../node_modules/@polymer/polymer/lib/utils/render-status.js';

// A small helper function which adapts the MessageListSpliceAdapter to update a
// Polymer element's property.

// A symbol used to store the map of splice list adapters in a component.
let spliceMapSymbol = Symbol('SpliceListMap');
let bbmeSymbol = Symbol('BBME');

// A Promise to wait until cordova is ready. This is needed to load the
// MessageListSpliceAdapter plugin. Resolves to the plugin.
let spliceWatcher = new Promise((resolve, reject) => {
  document.addEventListener('deviceready', () => {
    resolve(cordova.require('cordova-plugin-bbmenterprise-support.util/MessageListSpliceAdapter'));
  });
})

export default class MessageListElement extends PolymerElement {
  constructor() {
    super();
    this[spliceMapSymbol] = new Map();
  }

  setBbmeSdk(bbmeSdk) {
    // To prevent any surprises, any existing bindings must be removed before
    // setting a new bbmeSdk.
    if(this[bbmeSymbol]) {
      if(this[spliceMapSymbol].size !== 0) {
        throw new Error("Cannot reset bbmeSdk without removing all previous bindings");
      }
    }

    // Set the new bbmeSdk.
    this[bbmeSymbol] = bbmeSdk;
  }

  bindMessages(property, chatId) {
    // Make sure there is a bbmeSdk set.
    if(!this[bbmeSymbol]) {
      throw new Error("Cannot bind when bbmeSdk is not set");
    }

    spliceWatcher.then(MessageListSpliceAdapter => {
      // See if there is already a MessageListSpliceAdapter on this property.
      // Use it if there is. Otherwise create a new one.
      const oldAdapter = this[spliceMapSymbol].get(property);
      if(oldAdapter) {
        oldAdapter.setChatId(chatId);
      } else {
        // Create the SpliceListAdapter.
        const adapter = new MessageListSpliceAdapter(
          (index, removed, ...newElements) => {
            this.splice(property, index, removed, ...newElements);

            // Scroll down to show the new message (even if user manually scrolled up).
            if (newElements && newElements.length > 0 && !this.scrollDownQueued) {
              this.scrollDownQueued = true;
              afterNextRender(this, () => {
                this.$.messageList.scrollTop = this.$.messageList.scrollHeight;
                this.$.messageList.notifyResize();
                this.scrollDownQueued = false;
              });
            }
          },
          this[bbmeSymbol],
          {
            chatId: chatId,
            autoExpand: true,
            initialSize: 100
          });

        // Store it for later removal.
        this[spliceMapSymbol].set(property, adapter);
      }
    });
  }

  unbindMessages(property) {
    // Look up the adapter.
    const adapter = this[spliceMapSymbol].get(property);

    // Remove it, if present.
    if(adapter) {
      this[spliceMapSymbol].delete(property);
      adapter.setChatId(undefined);
    }
  }
}
