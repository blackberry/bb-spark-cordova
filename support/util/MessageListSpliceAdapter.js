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

/**
 * A handler which receives an observable on the message list, and converts
 * updates to it into calls to a function with the signature of Array.splice.
 * The actual function to call is supplied by the caller.
 *
 * It can display a configurable subset of the entire message list and
 * allow this subset to expand or retract at its beginning or end.
 *
 * @param {function} splice A function which has the signature of Array.splice.
 *                          This is the mechanism by which the SpliceListAdapter
 *                          will update the underlying list.
 * @param {BBMEnterprise} bbmeSdk An instantiation of BBMEnterprise. The
 *                                observable lists will be read from this
 *                                object.
 * @param {object} [options] Configuration for the adapter.
 *
 * @param {string} [options.chatId] Which chat to display. If this is not
 *                                  specified, then no chat is displayed until
 *                                  setChatId is called.
 * @param {number} [options.initialSize] How many messages to initially load.
 *                                       More messages may be requested on
 *                                       demand. Defaults to 30.
 * @param {boolean} [options.autoExpand] Whether to expand automatically when
 *                                       new messages come in. Defaults to false.
 * @param {any} [options.defaultTemplate] When the size of the list grows, but
 *                                        before the content of the new
 *                                        elemenets are known, this default
 *                                        value will be used to fill the unknown
 *                                        elements. Defaults to {}.
 *
 *
 */
class MessageListSpliceAdapter {
  constructor(splice, bbmeSdk, options)
  {
    // Remember how to splice the output list.
    this._splice = splice;

    // Remember which sdk to retrieve messages for.
    this._bbmeSdk = bbmeSdk;

    // Remember the initial size, if one is specified.
    if(options && options.initialSize !== undefined) {
      this._initialSize = options.initialSize;
    } else {
      // Somewhat arbitrary default.
      this._initialSize = 30;
    }

    // Remember the initial size, if one is specified.
    if(options && options.defaultTemplate !== undefined) {
      this._defaultTemplate = options.defaultTemplate;
    } else {
      // Somewhat arbitrary default.
      this._defaultTemplate = {};
    }

    // Remember the autoexpand value.
    if(options) {
      this._autoExpand = options.autoExpand;
    } else {
      this._autoExpand = false;
    }

    // Make a map to keep track of what we are observing.
    this._observerMap = new Map();

    // Remember the initial chat if one is specified.
    if(options && options.chatId !== undefined) {
      this._chatId = options.chatId;

      // Initially, we don't know where we are in the list.

      // The messageId of the first message in the SDK that will be displayed
      // in the splice list.
      this._startIndex = undefined;

      // The messageId of the last message in the SDK that will be displayed
      // in the splice list.
      this._endIndex = undefined;

      // The last value of messageId that we saw in the chat info.
      this._lastMessage = undefined;

      // Start watching the chat.
      this._start();
    } else {
      this._chatId = undefined;
    }
  }

  _start() {
    // Immediately find out how many messages are in the chat to start
    // the preload.
    // Make a callback to use for watching the message list size.
    this._listWatcher = this._listLengthChange.bind(this);
    this._bbmeSdk.chat.byChatId(this._chatId).on(this._listWatcher);
  }

  _stop() {
    this._bbmeSdk.chat.byChatId(this._chatId).off(this._listWatcher);

    this._listWatcher = undefined;

    for(let i = this._startIndex; i < this._endIndex; ++i) {
      const element = this._observerMap.get(i);
      element.observer.off(element.handler);
    }

    this._observerMap.clear();

    // Reset our indices because we no longer know which chat we're looking at.
    this._startIndex = undefined;
    this._endIndex = undefined;
    this._lastMessage = undefined;
  }

  // Run when the observed chat updates.
  _listLengthChange(chat) {
    // Make sure that we're still on the same chat.
    if(chat.chatId != this._chatId) {
      console.log("MessageListSpliceAdapter._listLengthChange: ignoring chat.chatId="+chat.chatId+" doesn't match this._chatId="+this._chatId);
      return;
    }

    // See if the set of available messages changed.
    if(this._lastMessage !== chat.lastMessage) {
      // See if this is the first time we know the end. If it is, initiate
      // the preload.
      if(this._lastMessage === undefined) {
        // Start at the end.
        this._startIndex = this._endIndex = chat.lastMessage;
        // And load a batch before this.
        this.addToBeginning(this._initialSize);
      } else {
        // See if this is cutting some messages off. If it is, release their
        // observers.
        if(chat.lastMessage < this._endIndex) {
          // It is, release all observers from chat.lastMessage to
          // this._endIndex.
          this._remove(false, this._endIndex - chat.lastMessage);
          this._endIndex = chat.lastMessage;
        } else {
          // It's expanding. If we are autoExpanding, then add these to the
          // list.
          if(this._autoExpand) {
            this._add(false, chat.lastMessage - this._endIndex);
            this._endIndex = chat.lastMessage;
          }
        }
      }

      // Always remember where we now are.
      this._lastMessage = chat.lastMessage;
    }
  }

  _add(beginning, count)
  {
    // First  create a new list and fill it with empty objects.
    const newElements = [];
    newElements.length = count;
    newElements.fill(this._defaultTemplate);
    // Then splice it in.
    this._splice(beginning ? 0
                           : this._endIndex - this._startIndex,
                 0, ...newElements);

    // Now start observing all of these elements, and get them ready to
    // update at the appropriate index.
    const position = beginning ? this._startIndex - count : this._endIndex;
    const end = position + count;
    for(let i = position; i < end; ++i) {
      // Define a function here in order to make a closure on i, as index.
      // Every time the updater re-runs, we want it to operate on the same
      // index (the messageId in the sdk's underlying message list).
      const updater = index => {
        // Make a function to update the index.
        const handler = element => {
          // index is the index into the SDK's message list, so decrement by
          // _startIndex (the earliest index that we are watching) to convert
          // it to an index into the splice list.
          this._splice(index - this._startIndex, 1, element);
        };

        // Make an observer to watch changes to the element.
        // Convert from array index to messageId which starts at 1.
        const observer =
          this._bbmeSdk.chatMessage.byChatIdAndMessageId(this._chatId, "" +(index + 1));

        // Start observing
        observer.on(handler);

        // And also remember the observer so that it can be stopped later.
        this._observerMap.set(index, {
          observer: observer,
          handler: handler
        });
      };

      updater(i);
    }
  }

  _remove(beginning, count) {
    // Remove from either the start or end of the splice list.
    this._splice(beginning ? 0
                           : this._endIndex - this._startIndex - count,
                 count);
    // Find the position in the SDK message list.
    const position = beginning ? this._startIndex : this._endIndex - count;
    const end = position + count;

    // Iterate over the messages that we were observing by index in the SDK and
    // stop observing them.
    for(let i = position; i < end; ++i) {
      const element = this._observerMap.get(i);
      element.observer.off(element.handler);
      this._observerMap.delete(i);
    }
  }

  /**
   * Request more messages at the beginning of the list. If there are not enough
   * messages, no more messages will be shown earlier than the beginning.
   * @param {number} count The number of additional messages to show.
   */
  addToBeginning(count)
  {
    // Make sure we don't go past the beginning.
    let toAdd = Math.min(count, this._startIndex);
    this._add(true, toAdd);
    this._startIndex -= toAdd;
  }

  /**
   * Request more messages at the end of the list. If there are not enough
   * messages, no more messages will be shown later than the end.
   * @param {number} count The number of additional messages to show.
   */
  addToEnd(count)
  {
    // Make sure we don't go past the end.
    let toAdd = Math.min(count, this._lastMessage - this._endIndex);
    this._add(false, toAdd);
    this._endIndex += toAdd;
  }

  /**
   * Remove messages from the beginning of the list. If there are not enough
   * messages, at most all of the messages will be removed. The index at which
   * the list was displaying messages will be retained, so if messages are added
   * after this, they will be added from around the end of this removal.
   * @param {number} count The number of messages to remove.
   */
  removeFromBeginning(count)
  {
    // Make sure we have enough.
    let toRemove = Math.min(count, this._endIndex - this._startIndex);
    this._remove(true, toRemove);
    this._startIndex += toRemove;
  }

  /**
   * Remove messages from the end of the list. If there are not enough messages,
   * at most all of the messages will be removed. The index at which the list
   * was displaying messages will be retained, so if messages are added after
   * this, they will be added from around the beginning of this removal.
   * @param {number} count The number of messages to remove.
   */
  removeFromEnd(count)
  {
    // Make sure we have enough.
    let toRemove = Math.min(count, this._endIndex - this._startIndex);
    this._remove(false, toRemove);
    this._endIndex -= toRemove;
  }

  /**
   * Set the chatId of the chat to monitor for messages.
   *
   * @param {string} chatId The chat to watch for changes.
   */
  setChatId(chatId) {
    if(this._chatId) {
      this._stop();
    }

    this._chatId = chatId;
    if(this._chatId) {
      this._start();
    }
  }

  /**
   * Set whether to automatically expand the sliced array when the underlying
   * chat indicates that new messages have arrived.
   *
   * @param {boolean} autoExpand True to automatically expand the array using
   *                             splices, false to not expand the array.
   */
  setAutoExpand(autoExpand) {
    this._autoExpand = autoExpand;
  }
};

module.exports = MessageListSpliceAdapter;
