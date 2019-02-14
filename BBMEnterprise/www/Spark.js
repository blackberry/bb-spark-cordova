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
const Monitor = require('./utils/Monitor');
const IncomingMessagesClass = require('./utils/IncomingMessages');

const Lists = require('./classes/Lists');
const Messages = require('./classes/Messages');
const Message = require('./utils/Message');
const IncomingMessages = require('./classes/IncomingMessages');
const GlobalMessages = require('./classes/Globals');

/**
 * @class Spark
 * 
 * @classdesc
 *   Create an instance of the Spark object with the configuration
 *   necessary to interact with the Spark SDK on a user's behalf.
 *   The returned instance provides the application access to the Spark SDK APIs
 *   for managing chats and media calls.
 *
 * @param {object} configuration
 *   An object containing the configuration parameters to set up the Spark SDK.
 * @param {string} object.domain
 *   The ID of the domain assigned to this application.  Refer to the Developer
 *   Guide for more information on setting up your domain:
 *   https://developer.blackberry.com/files/bbm-enterprise/documents/guide/html/gettingStarted.html#domain
 * @param {string} [object.environment]
 *   The environment that the SDK is pointing to. The possible values are:
 *   'Sandbox', 'Production'. The default is 'Sandbox' if unspecified.
 * @param {string} object.description
 *   A description of the endpoint. This should be an appropriate localized
 *   string based on what it can learn about the endpoint, for example
 *   "Windows PC" or "Firefox". This information about the endpoint will be
 *   displayed by other devices doing endpoint management. The maximum length
 *   is 2000 codepoints. Anything longer will be truncated.
 */
class Spark {
  constructor (configuration) {
    const monitor = new Monitor();

    this._configuration = configuration;

    // Add an observable for state.
    this.state = new Observable();
    this.state._property = {value: 'state'};
    this.state.getObjectId = () => {
      return 'Spark';
    };

    // Add an observable for the non-list messages.
    this.messages = new IncomingMessagesClass();

    // Add observables for the lists.
    for(const list in Lists.lists) {
      this[list] = new Lists.lists[list]();
    }

    // Add observables for the globals.
    this.globals = Lists.globals;

    monitor.start();
  }

  /**
   * Start the SDK setup process
   */
  setupStart() {
    const config = this._configuration;
    const environment = config.environment ? config.environment : 'Sandbox';
    const params = [config.domain, environment, config.description];

    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'setupStart',
      params);
  }

  /**
   * Stop the SDK from running.
   */
  stop() {
    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'stop',
      []);
  }

  /**
   * This function is only used by apps that use the BlackBerry Key Management
   * Service (KMS).
   * 
   * Called by the app when the global setupState is 'SyncRequired'.
   * @param {string} passcode User passcode
   * @param {Spark.Messages.SyncStart.Action} syncAction Action to be performed
   */
  syncStart(passcode, syncAction) {
    const params = {
      passcode: passcode,
      action: syncAction
    };

    return this.invoke(Spark.Messages.SyncStart, params);
  }

  /**
   * This function is only used by apps to set authentication token when
   * required.
   * 
   * Called by the app when the Spark#authTokenState is 'Needed'.
   * @param {string} userId The identity of the user
   * @param {string} token Authentication token
   */
  setAuthToken(userId, token) {
    const params = {
      userId: userId,
      authToken: token
    };

    return this.invoke(Spark.Messages.AuthToken, params);
  }

  /**
   * Send a message to the SDK.
   *
   * @param {Message} message The message to send.
   * @param {object} [paramters] Additional data to include with the message.
   *                             The specific content depends on the type of
   *                             message.
   */
  invoke(message, parameters) {
    //This doesn't ensure its a proper Message class but will help identify the common mistake
    //of a typo in a message class and provide a more helpful error message.
    if (typeof message !== "function") {
      throw new TypeError('message must be a subclass of Message that is defined in Messages.js');
    }
    new message(parameters).send();
  }

  /**
   * Set the SDK to receive pushes in a manner appropriate to the platform.
   */
  pushStart() {
    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'pushStart',
      []);
  }

  /**
   * Tells the SDK to display a call screen for incoming voice and video calls.
   */
  handleIncomingCalls() {
    Cordova.exec(
      () => {},
      () => {},
      'SparkProxy',
      'handleIncomingCalls',
      []);
  }

  /**
   * Make an outgoing voice or video call. This function may be called only
   * after calling handleIncomingCalls.
   *
   * @param {Object} options Options to control the outgoing call.
   * @param {string} options.mode 'video' for a video call, 'voice' for a voice
   *                              call.
   * @param {string} regId the recipient of the call.
   * @returns {Promise} A promise indicating whether the call succeeded or
   *                    failed.
   */
  makeCall(options) {
    return new Promise((resolve, reject) => {
      Cordova.exec(
        result => { resolve(result); },
        error => { reject(error); },
        'SparkProxy',
        'makeCall',
        [options]);
    });
  }
}

// Exposed for app to access.
Spark.Messages = Messages;
Spark.IncomingMessages = IncomingMessages;
Spark.Globals = GlobalMessages;

// The following are states that are specific to cordova.
Spark.State = {
  /**
   * Indicates that the Spark SDK is running. Any functions may be called in
   * this state.
   */
  Started: 'Started',

  /**
   * Indicates that the Spark SDK is not running. No events will be emitted
   * except for events related to this state, and no functions may be called
   * except for setupStart or event emitter functions.
   */
  Stopped: 'Stopped',

  /**
   * Indicates that the Spark SDK has stopped and that it has encountered an
   * error that may or may not be recoverable.
   */
  Failed: 'Failed'
};

module.exports = Spark;
