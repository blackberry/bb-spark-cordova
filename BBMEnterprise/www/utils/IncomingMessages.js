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

const Observable = require('./utils/Observable');

/**
 * A list of the messages that can be observed. This list by itself is not
 * observable. It could be on android, which supports observing all messages,
 * but at the time of this writing, observing all messages on iOS is not
 * supported.
 */
class MessagesList {
  /**
   * Choose which message to observe.
   */
  by(name) {
    return new Messages({ value: name });
  }
}

/**
 * An observable class for individual non-list messages. The difference between
 * these messages and globals is that these messages do not represent state.
 * Unlike globals, the observable handler will not run immediately, but will
 * run only when the message is actually triggered. What can trigger a message
 * varies by message name.
 */
class Messages extends Observable {
  constructor(property) {
    super();
    this._property = property;
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'ProtocolMessages';
  }
}

module.exports = MessagesList;
