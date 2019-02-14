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

package com.bbm.sdk.support.cordova;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import android.util.Log;

import android.app.Activity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.UUID;

import android.os.Handler;
import android.os.Looper;
import android.os.Bundle;
import android.os.AsyncTask;

import com.bbm.sdk.BBMEnterprise;
import com.bbm.sdk.BBMEnterpriseCallback;

import com.bbm.sdk.bbmds.ProxiedMessage;

import com.bbm.sdk.service.ProtocolMessage;
import com.bbm.sdk.service.ProtocolMessageConsumer;

import com.bbm.sdk.reactive.ObservableValue;
import com.bbm.sdk.reactive.Observer;
import com.bbm.sdk.service.BBMEnterpriseState;
import com.bbm.sdk.service.BBMEnterpriseNetworkState;

import com.bbm.sdk.support.ui.widgets.voip.SupportVoipManager;

import com.google.firebase.iid.FirebaseInstanceId;

public class SparkProxy extends CordovaPlugin {
    private static final String TAG = "SparkProxy";

    //Keep a static reference so if cordova creates a new instance we can cleanup the last one
    private static SparkProxy sLastInstance;

    private Handler mMainHandler = new Handler(Looper.getMainLooper());

    private Observer mSparkStateObserver;

    /**
     * This tracks what lists the JS app has asked to observe. If a list type is in
     * here then this will forward JSON messages from core to the JS app
     */
    private HashSet<String> mListsToProxy = new HashSet();

    private HashMap<String, HashMap<String, JSONObject>> mGlobalsToProxy = new HashMap();

    private HashSet<String> mMessagesToProxy = new HashSet();

    private static class FirebasePushTokenTask extends AsyncTask {
        // The call to get the token is blocking so we run it off the main UI thread
        @Override
        protected Object doInBackground(Object[] params) {
            try {
                final String token = FirebaseInstanceId.getInstance().getToken();
                if (token != null) {
                    Log.d(TAG, "Updating firebase push token " + token);
                    BBMEnterprise.getInstance().setPushToken(token);
                } else {
                    Log.e(TAG, "Firebase push token is NULL");
                }
            } catch(RuntimeException e) {
              // This can happen if pushStart is called in the wrong state.
              Log.d(TAG, "Error in push task: " + e.toString());
            }
            return null;
        }
    }

    /**
     * This listens to JSON messages from core and forwards the ones the JS app
     * asked to observe.
     */
    private ProtocolMessageConsumer mProtocolMessageConsumer = new ProtocolMessageConsumer() {
        @Override
        public void onMessage(final ProtocolMessage message) {
            final String type = message.getType();
            Log.d(TAG, "onMessage: type="+type);
            switch (type) {
            case "listAdd":
            case "listAll":
            case "listChange":
            case "listChunk":
            case "listElements":
            case "listRemove":
            case "listResync":
                processListMessage(message);
                return;
            default:
                processIndividualMessage(message);
                return;
            }
        }

        @Override
        public void resync() {
        }

        private void processListMessage(final ProtocolMessage message) {
            final String type = message.getType();
            final JSONObject data = message.getData();
            if (data != null) {
                try {
                    String listName = data.getString("type");
                    if (mListsToProxy.contains(listName)) {
                        Log.d(TAG, "processListMessage: sending event to JS for type=" + type + " listName="
                                + listName + " message=" + message);
                        //pass false for merge, list element changes should not merge with the old object that
                        //the app could have a reference to and not detect changes to it.
                        CordovaHelper.sendChangedEvent(listName, null, message.getJSON(), false);
                    }

                    Log.d(TAG, "processListMessage: listName="+listName+" not in mListsToProxy="+mListsToProxy);
                    processListMessage(listName, data, type);
                } catch (JSONException je) {
                    Log.d(TAG, "processListMessage: failed to send event for type=" + type, je);
                }
            } else {
                Log.d(TAG, "processListMessage: ignoring type=" + type + " missing data message=" + message);
            }
        }

        private void processListMessage(final String listName, final JSONObject data, final String type) throws JSONException {
            JSONArray elements = data.optJSONArray("elements");
            if (elements != null && elements.length() > 0) {
                HashMap<String, JSONObject> propertiesList = mGlobalsToProxy.get(listName);
                if (propertiesList != null) {
                    for (int i=0;i<elements.length();++i) {
                        JSONObject object = elements.getJSONObject(i);

                        for(JSONObject properties : propertiesList.values()) {
                            boolean match = true;
                            for(Iterator<String> iter = properties.keys(); iter.hasNext(); ) {
                                String property = iter.next();
                                String value = object.optString(property);
                                if(value == null || !value.equals(properties.get(property))) {
                                  match = false;
                                  break;
                                }
                            }

                            if(match) {
                                boolean merge = "listChange".equals(type);
                                Log.d(TAG, "processListMessage: sending object="+object+" merge="+merge+" type="+type);
                                if ("global".equals(listName)) {
                                    //Just send the JSON as is to JS app to handle
                                    JSONObject valueObject = object.optJSONObject("value");
                                    if(valueObject != null) {
                                        CordovaHelper.sendChangedEvent("global", properties, valueObject, merge);
                                    } else {
                                        CordovaHelper.sendChangedEvent("global", properties, object.getString("value"));
                                    }
                                } else {
                                    if ( "listRemove".equals(type)) {
                                        object = null;
                                    }
                                    CordovaHelper.sendChangedEvent(listName, properties, object, merge);
                                }
                            }
                        }
                    }
                } else {
                    Log.d(TAG, "processListMessage: ignoring list="+listName+" not in proxy list with size="+mGlobalsToProxy.size());
                }
            }
        }

        private void processIndividualMessage(final ProtocolMessage message) {
            final String type = message.getType();
            final JSONObject data = message.getData();
            try {
                Log.d(TAG, "processIndividualMessage: type="+type+" data="+data);

                if (mMessagesToProxy.contains(type)) {
                  Log.d(TAG, "processIndividualMessage: sending individual message");
                  JSONObject property = new JSONObject();
                  property.put("value", type);
                  CordovaHelper.sendChangedEvent("ProtocolMessages", property, data, false);
                }
            } catch (JSONException je) {
                Log.d(TAG, "processIndividualMessage: failed to send event for type=" + type, je);
            }
        }

    };

    public SparkProxy() {
        Log.d(TAG, "sLastInstance="+sLastInstance);
        if (sLastInstance != null) {
            sLastInstance.cleanup();
        }
        BBMEnterprise.getInstance().getBbmdsProtocolConnector().addMessageConsumer(mProtocolMessageConsumer);
        sLastInstance = this;
    }

    private void cleanup() {
        Log.d(TAG, "cleanup: ");
        BBMEnterprise.getInstance().getBbmdsProtocolConnector().removeMessageConsumer(mProtocolMessageConsumer);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(TAG, "execute: action=" + action + " args=" + args);
        switch (action) {
        case "requestListAdd":
        case "requestListRemove":
        case "requestListChange":
          sendRequestMutate(action, args.getString(0), (JSONArray)args.get(1), callbackContext);
          return true;
        case "invoke":
            return invoke(args, callbackContext);
        case "setupStart":
            return setupStart(args, callbackContext);
        case "monitorStart":
            CordovaHelper.monitorStart(callbackContext);
            return true;
        case "observeStart": {
            return observeStart(args, callbackContext);
        }
        case "observeStop": {
            return observeStop(args, callbackContext);
        }
        case "pushStart": {
            return pushStart();
        }
        case "handleIncomingCalls": {
            return handleIncomingCalls();
        }
        case "makeCall": {
            return makeCall(args, callbackContext);
        }
        default: {
            Log.w(TAG, "execute: ignoring action=" + action + " args.len=" + args.length() + " args=" + args);
            callbackContext.error("ignoring action=" + action + " with " + args.length() + " args");
            return false;
        }
        }
    }

    private void replaceNumbers(JSONArray array)
      throws JSONException
    {
      for(int i = 0; i < array.length(); i++) {
        Object o = array.get(i);
        Class type = o.getClass();
        if(type == JSONArray.class) {
          replaceNumbers((JSONArray)o);
        } else {
          array.put(i, Long.parseLong((String)array.getString(i)));
        }
      }
    }

    private void fixNumbers(Object object, JSONArray updates, int index)
      throws JSONException
    {
      // See what type of object this is. It will be either JSONArray,
      // JSONObject or String.
      Class type = object.getClass();

      if(type == JSONArray.class) {
        // If it's an array, then recurse on all elements.
        JSONArray jarray = (JSONArray)object;
        for(int i = 0; i < jarray.length(); i++) {
          fixNumbers(jarray.get(i), updates, index);
        }
      } else if(type == JSONObject.class) {
        // If it's an object, index it using updates.
        JSONObject jobj = (JSONObject)object;

        // If we're now done searching, then update the object. If we're not
        // done yet, then recurse.
        String name = updates.getString(index);
        Object target = jobj.get(name);
        if(index + 1 == updates.length()) {
          // We are done. If what we see is an array, then build an object to
          // put. If it's a string, then convert it to an int and store it.
          Class targetType = target.getClass();
          if(targetType == JSONArray.class) {
            replaceNumbers((JSONArray)jobj.get(name));
          } else {
            // This will be a string.
            jobj.put(name, Long.parseLong((String)jobj.getString(name)));

          }
        } else {
          fixNumbers(target, updates, index+1);
        }
      }
    }

    private boolean invoke(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(TAG, "execute: creating message to send");
        try {
            JSONObject object = args.getJSONObject(0);

            // If there are any numbers in the data that were passed as strings,
            // convert them back to numbers.
            if(args.length() > 1) {
              JSONArray array = args.getJSONArray(1);
              for(int i = 0; i < array.length(); i++) {
                JSONArray update = array.getJSONArray(i);
                Log.d(TAG, "Converting strings to numbers: " + update);
                fixNumbers(object.get(object.keys().next()), update, 0);
              }
            }

            ProxiedMessage message = new ProxiedMessage(object);
            Log.d(TAG, "execute: invoke: sending message=" + message);
            BBMEnterprise.getInstance().getBbmdsProtocol().send(message);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "execute: Failed to invoke", e);
            callbackContext.error("Failed to invoke due to " + e);
            return false;
        }
    }
    
    private boolean observeStart(JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (args.length() != 3) {
            Log.w(TAG, "observeStart: invalid args.len=" + args.length()+" args="+args);
            return false;
        }

        String eventKey = args.getString(0);
        JSONObject eventProperty = args.optJSONObject(1);

        Log.d(TAG, "observeStart: eventKey=" + eventKey + " eventProperty=" + eventProperty);

        if ("Spark".equals(eventKey)) {
            String eventName = eventProperty != null ? eventProperty.getString("value") : null;
            if ("state".equals(eventName)) {
                observeSparkState(eventKey, eventProperty, callbackContext);
            } else {
                Log.w(TAG, "observeStart: ignoring eventName="+eventName);
                callbackContext.error("ignoring eventName="+eventName);
                return false;
            }
        } else if ("ProtocolMessages".equals(eventKey)) {
          if(eventProperty != null) {
            mMessagesToProxy.add(eventProperty.getString("value"));
          }
        } else {
            if (eventProperty != null) {
                //Assume its a global
                observeValue(eventKey, eventProperty, callbackContext);
            } else {
                //assume its a list
                this.observeList(eventKey, callbackContext);
            }
        }
        return true;
    }

    private boolean observeStop(JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (args.length() != 3) {
            Log.w(TAG, "observeStop: invalid args.len=" + args.length()+" args="+args);
            return false;
        }

        String eventKey = args.getString(0);
        JSONObject eventProperty = args.optJSONObject(1);

        Log.d(TAG, "observeStop: eventKey=" + eventKey + " eventProperty=" + eventProperty);

        if ("Spark".equals(eventKey)) {
            String eventName = eventProperty != null ? eventProperty.getString("value") : null;
            if ("state".equals(eventName)) {
                observeSparkStateStop(eventKey, eventProperty, callbackContext);
            } else {
                Log.w(TAG, "observeStop: ignoring eventName="+eventName);
                callbackContext.error("ignoring eventName="+eventName);
                return false;
            }
        } else if ("ProtocolMessages".equals(eventKey)) {
          if(eventProperty != null) {
            mMessagesToProxy.remove(eventProperty.getString("value"));
          }
        } else {
            if (eventProperty != null) {
                //Assume its a global
                observeValueStop(eventKey, eventProperty, callbackContext);
            } else {
                //assume its a list
                this.observeListStop(eventKey, callbackContext);
            }
        }
        return true;
    }

    private boolean pushStart() {
        //noinspection unchecked
        new FirebasePushTokenTask().execute();

        return true;
    }

    private boolean handleIncomingCalls() {
        // Initialize the support library voice and video call manager
        // The manager listens for incoming calls and displays the call activity to users.
        SupportVoipManager.startSupportVoipManager(getActivity().getApplicationContext());
        return true;
    }

    private boolean makeCall(JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (args.length() != 1) {
            Log.w(TAG, "makeCall: invalid args.len=" + args.length()+" args="+args);
            return false;
        }

        JSONObject options = args.getJSONObject(0);
        String regId = options.getString("regId");

        SupportVoipManager.startCall(getActivity(), Long.parseLong(regId));
        return true;
    }

    private void observeValue(final String eventKey, final JSONObject eventProperty, final CallbackContext callbackContext) {
        Log.d(TAG, "observeValue: eventKey=" + eventKey +" eventProperty="+eventProperty);

        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    String eventPropertyAsString = eventProperty.toString();

                    HashMap<String, JSONObject> propertiesToProxy = mGlobalsToProxy.get(eventKey);
                    if (propertiesToProxy == null) {
                        propertiesToProxy = new HashMap<String, JSONObject>();
                        mGlobalsToProxy.put(eventKey, propertiesToProxy);
                    }
                    if(!propertiesToProxy.containsKey(eventPropertyAsString)) {
                        propertiesToProxy.put(eventPropertyAsString, eventProperty);
                        //ask core to send this property
                        //TODO: Could allow option to do bulk request for multiple in same list
                        sendRequestList(eventKey, eventProperty);
                    } else {
                        Log.w(TAG, "observeValue: ignoring repeat call for property=" + eventPropertyAsString);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "observeValue: Failed", e);
                    callbackContext.error(e.toString());
                }
            }
        });
    }

    private void observeValueStop(final String eventKey, final JSONObject eventProperty, final CallbackContext callbackContext) {
        Log.d(TAG, "observeValueStop: eventKey=" + eventKey +" eventProperty="+eventProperty);

        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    String eventPropertyAsString = eventProperty.toString();

                    HashMap<String, JSONObject> propertiesToProxy = mGlobalsToProxy.get(eventKey);
                    if(propertiesToProxy != null && propertiesToProxy.containsKey(eventPropertyAsString)) {
                        propertiesToProxy.remove(eventPropertyAsString);
                    } else {
                        Log.w(TAG, "observeValueStop: ignoring call for property=" + eventPropertyAsString);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "observeValueStop: Failed", e);
                    callbackContext.error(e.toString());
                }
            }
        });
    }

    //JS code should avoid triggering this multiple times for same value
    private void sendRequestList(final String eventKey, final JSONObject eventProperty) throws JSONException {
        Log.d(TAG, "sendRequestList: will request from core... eventKey=" + eventKey +" eventProperty="+eventProperty);

        ProtocolMessage message;
        if (eventProperty != null) {
            message = new ProtocolMessage("requestListElements", new JSONObject());
            JSONArray elements = new JSONArray();
            elements.put(eventProperty);
            message.getData().put("elements", elements);
            String cookie = UUID.randomUUID().toString();
            message.getData().put("cookie", cookie);
        } else {
            message = new ProtocolMessage("requestListAll", new JSONObject());
        }
        message.getData().put("type", eventKey);

        Log.d(TAG, "sendRequestList: about to send message="+message);

        BBMEnterprise.getInstance().getBbmdsProtocolConnector().send(message);
    }

    // Send a request to mutate a list, either by adding, removing or changing.
    private void sendRequestMutate(final String action, final String key, final JSONArray elements, CallbackContext callbackContextPfinal) throws JSONException {
        Log.d(TAG, "send " + action + ": will request from core... key=" + key +" elements="+elements);

        ProtocolMessage message = new ProtocolMessage(action, new JSONObject());
        message.getData().put("elements", elements);
        message.getData().put("type", key);

        Log.d(TAG, "sendRequestList: about to send message="+message);

        BBMEnterprise.getInstance().getBbmdsProtocolConnector().send(message);
    }

    public void observeSparkState(final String eventKey, final JSONObject eventProperty, final CallbackContext callbackContext) {
        mMainHandler.post(new Runnable() {
            //remember the last state reported to JS to avoid reporting the same state multiple times when
            //it hasn't changed. This is needed since multiple values here map to a single value in JS
            String lastSentState = null;

            // The states are not consistent between android and iOS, so map
            // them into a common set.
            private String mapState(String state)
            {
              switch(BBMEnterpriseState.valueOf(state)) {
              case STARTING:
              case STOPPED:
              case UNINITIALIZED:
                return "Stopped";
              case STARTED:
                return "Started";
              case FAILED:
              default:
                return "Failed";
              }
            }

            private void sendEventIfChanged(Object val) throws JSONException {
                String newState = mapState(val.toString());
                Log.d(TAG, "observeSparkState.sendEventIfChanged: new="+newState+" old="+lastSentState+" current="+BBMEnterprise.getInstance().getState().get());
                if (!newState.equals(lastSentState)) {
                    lastSentState = newState;
                    CordovaHelper.sendChangedEvent(eventKey, eventProperty, newState);
                }
            }

            @Override
            public void run() {
                try {
                    final ObservableValue ov = BBMEnterprise.getInstance().getState();
                    if (mSparkStateObserver != null) {
                        ov.removeObserver(mSparkStateObserver);
                    }
                    mSparkStateObserver = new Observer() {
                        public void changed() {
                            Object val = ov.get();
                            Log.d(TAG, "observeSparkState.changed: " + val);
                            try {
                                sendEventIfChanged(val);
                            } catch (JSONException je) {
                                Log.e(TAG, "observeSparkState.changed: Failed to send result", je);
                                callbackContext.error(je.toString());
                            }
                        }
                    };
                    ov.addObserver(mSparkStateObserver);

                    Object val = ov.get();
                    Log.d(TAG, "listenObservableValue:  eventKey=" + eventKey + " val=" + val);
                    sendEventIfChanged(val);

                    callbackContext.success("SUCCESS: observing " + eventKey + "." + eventProperty);
                } catch (Exception e) {
                    Log.e(TAG, "SparkProxy: listenObservableValue: Failed", e);
                    callbackContext.error(e.toString());
                }
            }
        });
    }

    public void observeSparkStateStop(final String eventKey, final JSONObject eventProperty, final CallbackContext callbackContext) {
        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                final ObservableValue ov = BBMEnterprise.getInstance().getState();
                ov.removeObserver(mSparkStateObserver);
                callbackContext.success("SUCCESS: stop observing " + eventKey + "." + eventProperty);
            }
        });
    }

    public void observeList(final String eventKey, final CallbackContext callbackContext) {
        Log.d(TAG, "observeList: eventKey=" + eventKey);

        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    if (!mListsToProxy.contains(eventKey)) {
                        // Add this type of list to the set. This is needed so the protocol listener
                        // knows to proxy the list messages
                        // for this type to the JS side
                        mListsToProxy.add(eventKey);

                        sendRequestList(eventKey, null);
                    } else {
                        Log.w(TAG, "SparkProxy: observeList: ignoring repeat call for List eventKey=" + eventKey);
                    }
                    callbackContext.success("SUCCESS: observing " + eventKey);
                } catch (Exception e) {
                    Log.e(TAG, "observeList: Failed", e);
                    callbackContext.error(e.toString());
                }
            }
        });
    }

    public void observeListStop(final String eventKey, final CallbackContext callbackContext) {
        Log.d(TAG, "observeListStop: eventKey=" + eventKey);

        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mListsToProxy.contains(eventKey)) {
                        mListsToProxy.remove(eventKey);
                    } else {
                        Log.w(TAG, "SparkProxy: observeListStop: ignoring call for List not found eventKey=" + eventKey);
                    }
                    callbackContext.success("SUCCESS: observing " + eventKey);
                } catch (Exception e) {
                    Log.e(TAG, "observeListStop: Failed", e);
                    callbackContext.error(e.toString());
                }
            }
        });
    }

    private boolean setupStart(JSONArray args, CallbackContext callbackContext) throws JSONException {
        String domain = args.getString(0);
        String environment = args.getString(1);
        String appName = args.getString(2);

        // Parse the environment.
        boolean sandbox;
        switch (environment) {
        case "Sandbox":
            sandbox = true;
            break;
        case "Production":
            sandbox = false;
            break;
        default:
            Log.w(TAG, "setupStart: invalid environment="+environment);
            return false;
        }

        mMainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "start: calling BBMEnterprise.getInstance().initialize...");
                    Bundle bundle = new Bundle();

                    bundle.putString("com.bbm.sdk.UserDomain", domain);
                    bundle.putBoolean("com.bbm.sdk.environment.sandbox", sandbox);

                    BBMEnterprise.getInstance().initialize(getActivity(),

                        //TODO: some of these callbacks could result in events sent to JS
                        new BBMEnterpriseCallback() {
                        @Override
                        public void onNetworkChanged(int type) {
                        }

                        @Override
                        public void onUpdateNetworkParameters() {
                        }

                        @Override
                        public void onConnectionStatusChanged(BBMEnterpriseNetworkState stat) {
                        }

                        @Override
                        public void onInitialize() {
                        }

                        @Override
                        public void onStarted() {
                        }

                        @Override
                        public void onStopped(boolean fatalError) {
                        }
                    }, bundle);

                    BBMEnterprise.getInstance().start();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to auth user and start BBM", e);
                    callbackContext.error("SparkProxy: start: FAILED: error=" + e);
                }
            }
        });

        return true;
    }

    private Activity getActivity() {
        return cordova.getActivity();
    }
}
