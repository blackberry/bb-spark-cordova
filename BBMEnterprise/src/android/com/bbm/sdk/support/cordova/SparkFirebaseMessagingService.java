/*
 * Copyright (c) 2018 BlackBerry.  All Rights Reserved.
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
package com.bbm.sdk.support.cordova;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.bbm.sdk.BBMEnterprise;
import com.bbm.sdk.bbmds.GlobalAuthTokenState;
import com.bbm.sdk.reactive.ObservableValue;
import com.bbm.sdk.reactive.Observer;
import com.bbm.sdk.service.BBMEnterpriseState;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.content.pm.PackageManager;
import android.content.Intent;

import java.util.Map;

public class SparkFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FirebaseMessagingService";

    private Handler mMainHandler = new Handler(Looper.getMainLooper());

    /**
     * Need to keep a hard reference to the observer so it isn't garbage collected while waiting
     * for BBM to start and auth to be ok.
     * Keep as a static reference in case the instance is garbage collected before the observer is done.
     */
    private static Observer sObserver;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "onMessageReceived: " + remoteMessage);
        FirebaseApp fbApp = FirebaseApp.getInstance();
        if (fbApp != null && remoteMessage.getFrom().equals(fbApp.getOptions().getGcmSenderId())) {
            // Handling of push notification must be done of UI thread.
            mMainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Log.i(TAG, "Handle incoming push.");
                    final ObservableValue<BBMEnterpriseState> state = BBMEnterprise.getInstance().getState();
                    final ObservableValue<GlobalAuthTokenState> authTokenStateObservableValue = BBMEnterprise.getInstance().getBbmdsProtocol().getGlobalAuthTokenState();

                    //check if everything is ready
                    if (state.get() == BBMEnterpriseState.STARTED
                                && authTokenStateObservableValue.get().value == GlobalAuthTokenState.State.Ok) {
                        Log.i(TAG, "ready to handle push without waiting. BBMEnterpriseState=" + state.get()
                                + ", AuthTokenState=" + authTokenStateObservableValue.get() + " exists=" + authTokenStateObservableValue.get().exists);

                        handlePushNotification(remoteMessage.getData());
                    } else {
                        //wait for BBM to start and auth to be ok before passing push to BBM
                        sObserver = new Observer() {
                            @Override
                            public void changed() {
                                Log.i(TAG, "changed: BBMEnterpriseState=" + state.get()
                                        + ", AuthTokenState=" + authTokenStateObservableValue.get() + " exists=" + authTokenStateObservableValue.get().exists);

                                //wait for BBM to start, auth token to exist and value be OK before trying to handle push
                                if (state.get() == BBMEnterpriseState.STARTED
                                        && authTokenStateObservableValue.get().value == GlobalAuthTokenState.State.Ok) {
                                    //this is done for this push, remove this observer right away so it doesn't get called again
                                    authTokenStateObservableValue.removeObserver(sObserver);
                                    state.removeObserver(sObserver);
                                    sObserver = null;

                                    handlePushNotification(remoteMessage.getData());
                                }
                            }
                        };

                        authTokenStateObservableValue.addObserver(sObserver);
                        state.addObserver(sObserver);

                        Log.d(TAG, "Waiting for observer to handle incoming push...");

                        //call the observer manually in case everything is already ready and nothing needs to change
                        sObserver.changed();

                        // NOTE: The code below will bring the app to the
                        // foreground when a push notification is received. This
                        // is for demonstration purposes and may be disruprive
                        // to a user in a production application, so it may be
                        // desirable to replace this behaviour with something
                        // less disruptive, e.g. not show any UI, but put
                        // background logic to handle the push here instead, or
                        // to only display a notification rather than the full
                        // UI.
                        PackageManager pm = getPackageManager();
                        Intent launchIntent = pm.getLaunchIntentForPackage(getApplicationContext().getPackageName());
                        startActivity(launchIntent);
                    }
                }
            });
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "onTokenRefresh:");
        if (BBMEnterprise.getInstance().getState().get() != BBMEnterpriseState.UNINITIALIZED) {
            BBMEnterprise.getInstance().setPushToken(token);
        }
    }

    private void handlePushNotification(Map<String,String> data) {
        try {
            //now handle the push
            Log.d(TAG, "calling handlePushNotification");
            BBMEnterprise.getInstance().handlePushNotification(data);
            Log.d(TAG, "done calling handlePushNotification");
        } catch (Exception e) {
            // Failed to process Push
            Log.e(TAG, "Failed to process push: " + e);
        }
    }
}
