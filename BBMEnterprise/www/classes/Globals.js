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

 module.exports = {
  ProfileKeysState: Object.freeze({
      /**
       * The profile's keys are synced.
       */
      Synced: 'Synced',

      /**
       * The profile's keys are not synced.  The profile's keys need to be
       * either imported into bbmcore via 'profileKeysImport', or exported from
       * bbmcore via 'profileKeysExport' and put into external storage.
       */
      NotSynced: 'NotSynced'
  }),
  SyncPasscodeState: Object.freeze({
      /**
       * No sync passcode is required by bbmcore.
       */
      None: 'None',

      /**
       * No usable existing sync data was found.  Your application must provide
       * a new passcode to bbmcore once the 'setupState' is 'state'
       * 'SyncRequired' by sending 'syncStart' with 'action' set to 'New'.  See
       * that message for more information.
       */
      New: 'New',

      /**
       * Existing sync data was found and is protected by a passcode.  Your
       * application must provide the existing passcode to bbmcore once the
       * 'setupState' is 'state' 'SyncRequired' by sending 'syncStart' with
       * 'action' set to 'Existing'.  See that message for more information.
       */
      Existing: 'Existing'
  }),
  SetupState: Object.freeze({
    /**
     * When the 'state' is 'Ongoing', this indicates the current phase of setup.
     * When the 'state' is not 'Ongoing', this field is omitted or set to
     * 'Unknown'.
     */
    ProgressMessage: Object.freeze({
      /**
       * The user's Spark Communications identity information is being restored
       * from the BlackBerry Infrastructure.
       */
      Restoring: 'Restoring',

      /**
       * The user's Spark Communications identity information is being
       * transferred.
       */
      Transferring: 'Transferring',

      /**
       * Setup is completing with a new registration.
       */
      Completing: 'Completing',

      /**
       * The current state of the progress is unknown or not applicable.
       */
      Unknown: 'Unknown'
    }),
    /**
     * <p>This indicates the current setup state.</p><only for='bbm'><p>The
     * 'setupState' message triggers setup to begin.</p></only><only
     * for='sdk'><p>The initial 'authToken' request triggers bbmcore to begin
     * setup. However, 'authTokenState' transitions don't change the setup
     * state.  For example, the 'authTokenState' transitions to 'Rejected' or
     * 'Needed', setup doesn't fail (but it might not succeed until a usable
     * 'authToken' is provided).  The 'authTokenState' and the 'setupState' are
     * independent, but 'authToken' can trigger a setup attempt when
     * 'setupState' is set to 'NotRequested'.</p></only><p>The only way to stop
     * setup after it starts is by sending the 'wipe' command to delete all
     * bbmcore data.</p><p>When certain minor errors occur during setup, bbmcore
     * automatically retries the setup by using the 'retryServerRequests'
     * message.  These minor errors are handled by bbmcore, and they don't
     * result in 'state' changes.</p>
     */
    State: Object.freeze({
      /**
       * Endpoint setup hasn't started.  <only for='bbm'>In this state, bbmcore
       * is waiting for 'setupStart' before proceeding (see that message for
       * more details).</only><only for='sdk'>In this state, bbmcore is waiting
       * for 'authToken' before proceeding (see that message for more
       * details).</only>
       */
      NotRequested: 'NotRequested',

      /**
       * A device switch is required for setup to proceed.  bbmcore is waiting
       * for 'setupRetry' as a confirmation from your application.  Once the
       * confirmation is received, the 'state' will return to 'Ongoing'.
       */
      DeviceSwitchRequired: 'DeviceSwitchRequired',

      /**
       * At least one other endpoint must be removed before setup may proceed.
       * Endpoints may be removed using 'endpointDeregister'. After removing
       * some endpoints, setup may be retried using 'setupRetry'.  Once a retry
       * is started, the 'state' will return to 'Ongoing'.
       */
      Full: 'Full',

      /**
       * <p>This endpoint must be synchronized before setup can proceed.
       * bbmcore is waiting for 'syncStart' to start the sync.  Once the sync is
       * started, the 'state' will move to 'SyncStarted'.</p><only
       * for='bbm'><p>The endpoint must synchronize with one of the identity's
       * existing endpoints.</p></only><only for='sdk'><p>This occurs only when
       * your application uses the BlackBerry Key Management Service (KMS).  In
       * such applications, all endpoints must synchronize with KMS during
       * setup.  In this state, bbmcore either needs the passcode for existing
       * sync data, or it needs a new passcode to create new sync
       * data.</p></only><p>The 'syncStart' documentation explains how to
       * provide bbmcore with the information necessary to proceed from this
       * state.</p>
       */
      SyncRequired: 'SyncRequired',

      /**
       * <p>The endpoint sync has been started.</p><only for='bbm'><p>In the BBM
       * Enterprise application, while in this state, the endpoint sync can be
       * cancelled via the 'syncCancel' message.  Once the sync confirmation has
       * been received from an existing endpoint the 'state' will move to
       * 'Ongoing' and can no longer be cancelled.</p></only><only
       * for='sdk'><p>This occurs only when your application uses the BlackBerry
       * Key Management Service (KMS).</p></only>
       */
      SyncStarted: 'SyncStarted',

      /**
       * Indicates that bbmcore is performing actions that will cause a state
       * change.  The current progress message is obtained from the
       * 'progressMessage' attribute.
       */
      Ongoing: 'Ongoing',

      /**
       * Indicates setup was successful.
       */
      Success: 'Success'
    })
  }),
  AuthTokenState: Object.freeze({
      /**
       * Bbmcore has a usable authToken value, and it doesn't require another
       * value from your application.  If your application has a reason to
       * supply an updated authToken value, it can be updated without
       * solicitation.
       */
      Ok: 'Ok',

      /**
       * <p>bbmcore doesn't currently have a usable authToken value. To continue
       * any communication with the BlackBerry Infrastructure, your application
       * must provide an authToken using the 'authToken' message. If the
       * 'authTokenState' is 'Needed', setup can't proceed.</p><p>The first time
       * setup is initiated by the 'authToken' message, the 'authTokenState'
       * will be 'Needed'.  However, there are a number of other conditions that
       * can cause the state to change to 'Needed', such as a failed setup
       * attempt, or an internal refresh of authentication.</p>
       */
      Needed: 'Needed',

      /**
       * bbmcore attempted to use a previously-supplied authToken value, but the
       * value (or its derivative products) was rejected during authentication
       * or authorization. In this state, your application must provide an
       * authToken using the 'authToken' message. However, your application is
       * encouraged to re-assert the user's identity before providing an updated
       * authToken value, and the user might need to be prompted to log in
       * again, or your application might need to clear cached credentials.
       */
      Rejected: 'Rejected'
  }),
  SetupAccount: Object.freeze({
      /**
       * No attempt has been made to set up Spark Communications Services<only
       * for='bbm'>, or this endpoint was set up before this global was
       * introduced</only>.
       */
      None: 'None',

      /**
       * A new Spark Communications identity was used during the most recent
       * attempt to set up.
       */
      New: 'New',

      /**
       * An existing Spark Communications identity was used during the most
       * recent attempt to set up.
       */
      Existing: 'Existing'
  })
};
