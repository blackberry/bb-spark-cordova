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
 * @class ObservableList
 * @classdesc
 * Provides functionality for the derived class to add or remove event listeners
 * to monitor changed properties of a list and to manipulate the list.
 *
 * This requires getObjectId to be overridden by the deriving class.
 */
class ObservableList extends Observable {
  constructor() {
    super();
  }

  /**
   * Request that elements be added to a list.
   *
   * @param {Array<Object>} elements A set of elements to add to the list.
   */
  add(elements) {
    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'requestListAdd',
      [ this.getObjectId(), elements]);
  }

  /**
   * Request that elements of a list be changed.
   *
   * @param {Array<Object>} elements A set of elements to update in the list.
   */
  change(elements) {
    Cordova.exec(
      response => resolve(resolve),
      response => reject(response),
      'SparkProxy',
      'requestListChange',
      [ this.getObjectId(), elements]);
  }

  /**
   * Request that elements be removed from a list.
   *
   * @param {Array<Object>} elements A set of elements to remove from the list.
   */
  remove(elements) {
    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'requestListRemove',
      [ this.getObjectId(), elements]);
  }
}

module.exports = ObservableList;
