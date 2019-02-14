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


import android.os.Handler;
import android.os.Looper;

import android.util.Log;

import java.util.Date;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.List;
import java.util.HashSet;


import org.apache.cordova.PluginResult;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

public class CordovaHelper {
  private static final String TAG = "CordovaHelper";
  private static CallbackContext sMonitorCallbackContext;

  public static void monitorStart(final CallbackContext callbackContext) {
    Log.d(TAG, "monitorStart:");
    sMonitorCallbackContext = callbackContext;
  }

  public static void sendChangedEvent(String propertyName, Object param, String value) throws JSONException {
    sendChangedEvent(propertyName, param, new PluginResult(PluginResult.Status.OK, toCordovaResponse(propertyName, param, value, false)));
  }

  public static void sendChangedEvent(String propertyName, Object param, JSONObject json, boolean merge) throws JSONException {
    sendChangedEvent(propertyName, param, new PluginResult(PluginResult.Status.OK, toCordovaResponse(propertyName, param, json, merge)));
  }

  public static void sendChangedEvent(String propertyName, Object param, PluginResult result) throws JSONException {
    result.setKeepCallback(true);
    sMonitorCallbackContext.sendPluginResult(result);
  }

  public static JSONArray toCordovaResponse(String propertyName, Object param, Object value, boolean merge) throws JSONException {
    JSONArray response = new JSONArray();
    response.put(propertyName);
    response.put(param != null ? param : "");
    response.put(value);
    response.put(merge);
    return response;
  }
}
