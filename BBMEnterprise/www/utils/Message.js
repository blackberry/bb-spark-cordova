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
 * A helper function to check if a pattern matches a JSON object. The pattern
 * consists of an array of names. The JSON object is considered to match if
 * either:
 * 1) It is an object with a property of the first name in the pattern, and the
 *    remainder of the pattern matches the value of this property.
 * 2) It is an array with each element matches the pattern.
 *
 * and the last element in the pattern is a string.
 *
 * @internal
 */
const check = (pattern, object) => {
  // Handle the base case.
  if (pattern.length == 0) {
    return typeof object === 'string';
  }

  // Handle the recursive case.
  if(Array.isArray(object)) {
    // For an array, check if each element matches.
    let match = true;
    for(const element of object) {
      if (!check (pattern, element)) {
        match = false;
        break;
      }
    }

    return match;
  } else {
    // For an object, check if there is a property, and its value matches.
    const property = object[pattern[0]];
    if (property) {
      // There is a property, check it.
      return check (pattern.slice(1), property);
    } else {
      // There isn't a property with the right name. Not a match.
      return false;
    }
  }
}

/**
 * @class Message
 * @classdesc
 * The base class for all objects that be serialized to a BBMDS message. This
 * provides the serialization.
 */
class Message {
  constructor(parameters) {
    this.parameters = parameters;
    this.name = undefined;
  }

  /**
   * Check if any updates are needed to the data on the native side. The reason
   * for updates is that on the native side, 64-bit integers are representable,
   * but large 64-bit integers lose precision in JavaScript. In order to get
   * around this, the large integers may be passed as strings, and this function
   * will notify the native side that it needs to convert them back.
   */
  checkForUpdates(parameters)
  {
    const updates = [];

    // Iterate over each of the class's update requirements, and see if any
    // match the parameters.
    for(const update of this.updateList()) {
      if(check(update, parameters)) {
        updates.push(update);
      }
    }

    // Don't return anything to the native side if there are no updates.
    if( updates.length) {
      return updates;
    } else {
      return undefined;
    }
  }

  /**
   * Serializes Message to a a BBMDS message format and send it to the SDK.
   */
  send() {
    if (this.name === undefined) {
      throw new Error('The Message name property has to be overridden');
    }

    // Encode the message.
    const message = [ {[ this.name ]: this.parameters } ];

    // See if the data needs any manipulation on the native side.
    const updates = this.checkForUpdates(this.parameters);
    if (updates) {
      message.push(updates)
    }

    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'invoke',
      message);
  }
}

module.exports = Message;
