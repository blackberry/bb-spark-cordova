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

const DOMAIN_ID = 'your_domain_id' /* TODO: Put your sandbox domain here. */;
const ENVIRONMENT = 'Sandbox';
const USER_ID = 'your_user_id' /* TODO: Put your username here, or some UI to choose a username. */;
const USER_SECRET = 'user_secret';

class Application {
  async initialize() {
    const AuthenticationManager = cordova.require('cordova-plugin-bbmenterprise-support.auth/MockAuthManager');
    const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

    const labelSetupState = document.getElementById('setupState');
    const labelAuthTokenState = document.getElementById('authTokenState');
    const labelRegId = document.getElementById('regId');

    // Create authentication manager
    const authManager = new AuthenticationManager();
    authManager.getUserId = () => Promise.resolve(USER_ID);
    await authManager.authenticate();

    const config = {
      domain: DOMAIN_ID,
      environment: ENVIRONMENT,
      description: navigator.userAgent,
    };

    // Create an instance of BBMEnterprise SDK
    const spark = new BBMEnterprise(config);

    spark.globals.authTokenState.on(async state => {
      labelAuthTokenState.innerHTML = state;
      if (state == BBMEnterprise.Globals.AuthTokenState.Needed) {
        const token = await authManager.getBbmSdkToken();
        spark.setAuthToken(USER_ID, token);
      }
    });

    // Monitor setup state. Use a Tracker on each Observable. The tracker
    // will automatically unregister the inner listener if the outer listener
    // is called again.
    Tracker(spark.globals.setupState).on(state => {
      labelSetupState.innerHTML = state.state;
      switch (state.state) {
        case BBMEnterprise.Globals.SetupState.State.SyncRequired:
          spark.syncStart(USER_SECRET,
                          BBMEnterprise.Globals.SyncPasscodeState.New);
        break;
        case BBMEnterprise.Globals.SetupState.State.Success:
          Tracker(spark.globals.localUri).on(value => {
            Tracker(spark.user.byUri(value)).on(user => {
              labelRegId.innerHTML = user.regId;
            });
          });
        break;
      }
    });

    // Monitor BBMEnterprise SDK state
    spark.state.on(state => {
      if (state == BBMEnterprise.State.Stopped) {
        spark.setupStart();
      }
    });
  }
}

document.addEventListener('deviceready', () => {
  const app = new Application();
  app.initialize();
});
