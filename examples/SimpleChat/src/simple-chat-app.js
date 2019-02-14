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

import { html, PolymerElement } from '../node_modules/@polymer/polymer/polymer-element.js';
import { } from '../node_modules/@polymer/polymer/lib/elements/dom-repeat.js';
import { } from '../node_modules/@polymer/polymer/lib/elements/dom-if.js';
import './simple-chat.js';
import ObservableElement from './ObservableElement.js';

const DOMAIN_ID = 'your_domain_id' /* TODO: Put your sandbox domain here. */;
const ENVIRONMENT = 'Sandbox';
const USER_ID = 'your_user_id' /* TODO: Put your username here, or some UI to choose a username. */;
const USER_SECRET = 'user_secret';

class SimpleChatApp extends ObservableElement(PolymerElement) {

  constructor () {
    super();
    this.config = {
      domain: DOMAIN_ID,
      environment: ENVIRONMENT,
      description: navigator.userAgent,
    };
    this.rejectCount = 0;
  }

  static get template() {
    return html`
    <style>
      :host {
        background: white;
        color: black;
        font-family: sans-serif, Arial, Helvetica;
        font-size: large;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      :host .header {
        font-size: xx-large;
        color: #087099;
        margin: 10px;
      }

      :host .spark-state {
        width: 75%;
        margin: 10px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr;
      }

      :host .spark-state div {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host .chat-list-header {
        font-size: x-large;
        color: #087099;
      }

      :host .button {
        width: 150px;
        background: #087099;
        color: white;
        height: 30px;
        text-align: center;
        align-content: center;
        align-items: center;
        display: grid;
        font-weight: bold;
        cursor: pointer;
        margin: 10px;
      }

      :host .chat-list-label {
        margin: 10px;
        font-size: x-large;
        color: #087099;
      }

      :host .chat-list-header {
        background: #1098ca;
        display: grid;
        grid-template-columns: 1fr 2fr 1fr 1fr;
        grid-template-rows: 1fr;
        margin-left: 10px;
        margin-right: 10px;
        color: white;
      }

      :host .chat-list-header div {
        text-align: center;
        font-size: medium;
        align-content: center;
        min-height: 25px;
        display: grid;
        border-width: 1px;
        border-color: white;
        border-style: solid;
      }

      :host .chat-list {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr 1fr;
        grid-template-rows: 1fr;
        margin-left: 10px;
        margin-right: 10px;
      }

      :host .chat-list .chat-list-item {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        margin: 10px;
      }

      :host .chat-list .chat-list-item:hover {
        color: #1098ca;
      }

    </style>
    <label class="header">Simple Chat</label>
    <div class="spark-state">
      <div>Setup state:</div><div>[[setupState]]</div>
      <div>Auth token state:</div><div>[[authTokenState]]</div>
      <div>Spark state:</div><div>[[sparkState]]</div>
      <div>Registration ID:</div><div>[[localRegId]]</div>
    </div>
    <template is="dom-if" if="[[isSetupComplete]]">
      <div class="button" on-click="startChatClicked" on-tap="startChatClicked">Start chat</div>
    </template>
    <div class="chat-list-label">Chat list</div>
    <div class="chat-list-header">
      <div>Chat ID</div>
      <div>Subject</div>
      <div>Messages</div>
      <div>Unread</div>
    </div>
    <div class="chat-list">
      <dom-repeat id="domRepeatChatList" items="[[chats]]">
        <template>
          <div class="chat-list-item" on-click="onChatClicked" on-tap="onChatClicked">[[item.chatId]]</div>
          <div class="chat-list-item" on-click="onChatClicked" on-tap="onChatClicked">[[item.subject]]</div>
          <div class="chat-list-item" on-click="onChatClicked" on-tap="onChatClicked">[[item.numMessages]]</div>
          <div class="chat-list-item" on-click="onChatClicked" on-tap="onChatClicked">[[item.numUnread]]</div>
        </template>
      </dom-repeat>
    </div>
    <simple-chat id="simpleChat"></simple-chat>
    `;
  }

  static get properties() {
    return {
      sparkState: {
        value: ''
      },
      chats: {
        value: []
      },
      chatCookie: {
        value: ''
      },
      setupState: {
        value: ''
      },
      authTokenState: {
        value: ''
      },
      localRegId: {
        value: 'n/a'
      },
      isSetupComplete: {
        value: false
      }
    };
  }

  ready() {
    super.ready();
    // Start initialization when device is ready
    document.addEventListener('deviceready', () => {
      this.start();
    });
  }

  static get is() {
    return 'simple-chat-app';
  }

  async start() {
    // Important thing to make cordova.require after the device is ready.
    const AuthenticationManager = cordova.require('cordova-plugin-bbmenterprise-support.auth/MockAuthManager');
    const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

    this.authManager = new AuthenticationManager();
    this.authManager.getUserId = () => Promise.resolve(USER_ID);
    await this.authManager.authenticate();

    // Adapt the SpliceListAdapter to update a polymer element.

    //#region Spark SDK initialization

    // Create the instance of Spark SDK

    this.spark = new BBMEnterprise(this.config);

    // Monitor chat list changes
    this.bind('chats', this.spark.chat);

    // Monitor Spark SDK setup state change
    Tracker(this.spark.globals.setupState).on(state => {
      console.log(`setupState handler: ${state.state}`);
      this.setupState = state.state;
      this.isSetupComplete = false;
      switch (state.state) {
        case BBMEnterprise.Globals.SetupState.State.SyncRequired:
          Tracker(this.spark.global.byName('syncPasscodeState')).on(passcodeState => {
            if(passcodeState === BBMEnterprise.Globals.SyncPasscodeState.New) {
              this.spark.syncStart(USER_SECRET, BBMEnterprise.Globals.SyncPasscodeState.New);
            } else if(passcodeState === BBMEnterprise.Globals.SyncPasscodeState.Existing) {
              // Remember that we have sent the passcode. If this fails, then we
              // will give up and overwrite the passcode.
              if(!this.hasSentPasscode) {
                this.spark.syncStart(USER_SECRET, BBMEnterprise.Globals.SyncPasscodeState.Existing);
                this.hasSentPasscode = true;
              } else {
                // If the passcode hardcoded into this application is not
                // correct, overwrite the server passcode with this one. Note
                // that this is probably not what a real application should do,
                // as overwriting the key will cause all messages and chats to
                // be lost, but it will suffice for this demo application.
                console.error('The passcode was incorrect, overwriting key material');
                this.spark.syncStart(USER_SECRET, BBMEnterprise.Globals.SyncPasscodeState.New);
              }
            }
          });
          break;

        case BBMEnterprise.Globals.SetupState.State.NotRequested:
          const params = {
            description: navigator.userAgent,
            nickname: 'My Nickname',
            isLegacyDelegate: true,
            cookie: 'cookie-' + (new Date()).getTime()
          };
          this.spark.invoke(BBMEnterprise.Messages.EndpointUpdate, params);
          break;

        case BBMEnterprise.Globals.SetupState.State.Success:
          // Start monitoring chats only after Spark SDK is initialized
          this.monitorChats();
          this.$.simpleChat.spark = this.spark;
          this.isSetupComplete = true;
          break;
        default:
          console.log("SChat: global.setupState.on: unexpected state="+state.state);
          break;
      }
    });

    // Monitor Spark SDK authentication token state
    this.spark.globals.authTokenState.on(async state => {
      console.log(`authTokenState handler: ${state}; Reject count: ${this.rejectCount}`);
      this.authTokenState = state;
      switch (state) {
        case BBMEnterprise.Globals.AuthTokenState.Rejected:
          if (this.rejectCount > 3) {
            alert('Authentication rejected.');
            return;
          }
          this.rejectCount++;
          // Intentional fallthrough
        case BBMEnterprise.Globals.AuthTokenState.Needed:
          const token = await this.authManager.getBbmSdkToken();
          this.spark.setAuthToken(USER_ID, token);
          break;

        case BBMEnterprise.Globals.AuthTokenState.Ok:
          this.rejectCount = 0;
          break;
      }
    });

    // Monitor local user Uri. Use a Tracker on each Observable. The tracker
    // will automatically unregister the inner listener if the outer listener
    // is called again.
    Tracker(this.spark.globals.localUri).on(value => {
      console.log("SChat: global.localUri.on: value="+value);
      Tracker(this.spark.user.byUri(value)).on(user => {
        console.log("SChat: user.on: user:"+JSON.stringify(user));
        this.localRegId = user.regId;
      });
    });

    // Monitor Spark SDK state
    this.spark.state.on(state => {
      console.log("SChat: spark.state.on: state="+state);
      if (state === BBMEnterprise.State.Started) {
        this.spark.pushStart();
      }
      this.sparkState = state;
      if (state === BBMEnterprise.State.Stopped) {
        this.spark.setupStart();
      }
    });

    //#endregion
  }

  // Monitor chat list
  monitorChats() {
    console.log("SChat: monitorChats:");

    // If a chat comes back that matches the cookie, show the chat unless the user is viewing another chat already.
    this.spark.chat.on(e => {
      if(e.listAdd && e.listAdd.cookie == this.chatCookie && !this.$.simpleChat.chatId) {
        this.$.simpleChat.chatId = e.listAdd.elements[0].chatId;
      }
    });
  }

  startChatClicked() {
    const regId = prompt('Enter other party RegId: ', '727689441577009738');
    if (!regId) {
      return;
    }
    const params = {
      invitees: [{ regId: regId }],
      subject: 'Cordova Test ' + (new Date()).getTime(),
      cookie: 'cookie-' + (new Date()).getTime()
    };
    // Remember the chat cookie. It will be used to redirect UI to the new chat
    // screen when the new chat with same cookie is added.
    this.chatCookie = params.cookie;

    return this.spark.invoke(BBMEnterprise.Messages.ChatStart, params);
  }

  onChatClicked(e) {
    const chat = this.$.domRepeatChatList.itemForElement(e.target);
    this.$.simpleChat.chatId = chat.chatId;
  }
}

window.customElements.define(SimpleChatApp.is, SimpleChatApp);
