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

const DOMAIN_ID = 'your_domain_id' /* TODO: Put your sandbox domain here. */;
const ENVIRONMENT = 'Sandbox';
const USER_ID = 'your_user_id' /* TODO: Put your username here, or some UI to choose a username. */;

class EndpointManagementApp extends PolymerElement {

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

      :host .endpoint-list-header {
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

      :host .endpoint-list-label {
        margin: 10px;
        font-size: x-large;
        color: #087099;
      }

      :host .endpoint-list-header {
        background: #1098ca;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr;
        margin-left: 10px;
        margin-right: 10px;
        color: white;
      }

      :host .endpoint-list-header div {
        text-align: center;
        font-size: medium;
        align-content: center;
        min-height: 25px;
        display: grid;
        border-width: 1px;
        border-color: white;
        border-style: solid;
      }

      :host .endpoint-list {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr;
        margin-left: 10px;
        margin-right: 10px;
      }

      :host .endpoint-list .endpoint-list-item {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        margin: 10px;
      }

      :host .endpoint-list .endpoint-list-item:hover {
        color: #1098ca;
      }

    </style>
    <label class="header">Endpoint Manager</label>
    <div class="spark-state">
      <div>Setup state:</div><div>[[setupState]]</div>
      <div>Auth token state:</div><div>[[authTokenState]]</div>
      <div>Spark state:</div><div>[[sparkState]]</div>
      <div>Registration ID:</div><div>[[localRegId]]</div>
    </div>
    <div class="endpoint-list-label">Endpoint list</div>
    <div class="endpoint-list-header">
      <div>Endpoint ID</div>
      <div>Description</div>
      <div>Nickname</div>
    </div>
    <div class="endpoint-list">
      <dom-repeat id="endpointList" items="[[endpoints]]">
        <template>
          <div class="endpoint-list-item" on-click="onEndpointClicked" on-tap="onEndpointClicked">[[item.endpointId]]</div>
          <div class="endpoint-list-item" on-click="onEndpointClicked" on-tap="onEndpointClicked">[[item.description]]</div>
          <div class="endpoint-list-item" on-click="onEndpointClicked" on-tap="onEndpointClicked">[[item.nickname]]</div>
        </template>
      </dom-repeat>
    </div>
    `;
  }

  static get properties() {
    return {
      sparkState: {
        value: ''
      },
      endpoints: {
        value: []
      },
      setupState: {
        value: ''
      },
      authTokenState: {
        value: ''
      },
      localRegId: {
        value: 'n/a'
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
    return 'endpoint-management-app';
  }

  async start() {
    // Important thing to make cordova.require after the device is ready.
    const AuthenticationManager = cordova.require('cordova-plugin-bbmenterprise-support.auth/MockAuthManager');
    const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

    this.authManager = new AuthenticationManager();
    this.authManager.getUserId = () => Promise.resolve(USER_ID);
    await this.authManager.authenticate();

    //#region Spark SDK initialization

    // Create the instance of Spark SDK
    this.spark = new BBMEnterprise(this.config);

    // Monitor Spark SDK setup state change
    Tracker(this.spark.globals.setupState).on(state => {
      console.log(`setupState handler: ${state.state}`);
      this.setupState = state.state;
      switch (state.state) {
        case BBMEnterprise.Globals.SetupState.State.SyncRequired:
        case BBMEnterprise.Globals.SetupState.State.Success:
          // The cookie will be echoed back in the response to the EndpointsGet.
          // In this case, its value is irrelevant because we are not looking
          // for the result from a particular EndpointGet to populate the
          // endpoint list, any get will do.
          this.spark.invoke(BBMEnterprise.Messages.EndpointsGet, {cookie: 'cookie'});
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
      console.log("EMan: global.localUri.on: value="+value);
      Tracker(this.spark.user.byUri(value)).on(user => {
        console.log("EMan: user.on: user:"+JSON.stringify(user));
        this.localRegId = user.regId;
      });
    });

    // Monitor Spark SDK state
    this.spark.state.on(state => {
      console.log("EMan: spark.state.on: state="+state);

      this.sparkState = state;
      if (state === BBMEnterprise.State.Stopped) {
        this.spark.setupStart();
      }

      if (state === BBMEnterprise.State.Started) {
        // Wait for the answer to the number of endpoints.
        this.spark.messages.by('endpoints').on(data => {
          if(data.result === 'Success') {
            this.endpoints = data.registeredEndpoints;
          }
        });
      }
    });

    //#endregion
  }

  onEndpointClicked(e) {
    const endpoint = this.$.endpointList.itemForElement(e.target);
    const confirmed = confirm(
`Are you sure you want to deregister the endpoint:
Description: ${endpoint.description}
Nickname: ${endpoint.nickname}`);
    if(!confirmed) return;

    this.spark.invoke(BBMEnterprise.Messages.EndpointDeregister, {
      cookie: 'cookie',
      endpointId: endpoint.endpointId
    });

    // Refresh the list. The handler for this message was already registered
    // during setup.
    this.spark.invoke(BBMEnterprise.Messages.EndpointsGet, {cookie: 'cookie'});

    // If the setupState was full, then issue a setupRetry.
    if(this.setupState === 'Full') {
      this.spark.invoke(BBMEnterprise.Messages.SetupRetry, {});
    }
  }
}

window.customElements.define(EndpointManagementApp.is, EndpointManagementApp);
