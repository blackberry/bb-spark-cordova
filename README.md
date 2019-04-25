![BlackBerry Spark Communications Services](https://developer.blackberry.com/files/bbm-enterprise/documents/guide/resources/images/bnr-bbm-enterprise-sdk-title.png)
Introduction
============

This repository contains code to use the BlackBerry Spark Communications
Services SDK from an Apache Cordova environment. The supported platforms are
Android and iOS. It has been verified to work in Cordova 8.0 and 9.0.

This code provides a layer on top of the Spark Communications SDK. The SDK
itself must be obtained separately.

Obtaining the SDK
-----------------
The SDK may be obtained from [here](https://community.blackberry.com/community/gdn/resources/bbm_enterprise).

After downloading the SDK, it needs to be placed in the appropriate location.

* Android

If developing for android, the entire downloaded archive should be placed in
BBMEnterprise/src/android.

* iOS

If developing for iOS, the entire downloaded archive should be placed in
BBMEnterprise/src/iOS.

These steps must be completed prior to installing the plugin.

Directory layout
----------------

* BBMEnterprise

  This directory contains the code that directly interfaces with the BlackBerry
  Spark Communications Services SDK for mobile. This directory contains the
  interface code to use these SDKs in a Cordova environment. It is a Cordova
  plugin, and may be installed using the Cordova tools.

  By default, messages can be pushed to your application with Firebase Cloud
  Messaging. This requires a file called google-services.json, which you must
  obtain from the Firebase web portal (https://firebase.google.com) and
  placed in platforms/android/app of your application.

* support

  This directory contains support code that is not needed to use the BlackBerry
  Spark Communications Services SDK in a Cordova application, but which may be
  useful in such an application. It is a Cordova plugin, and may be installed
  using the Cordova tools.

* examples

  This directory contains example Cordova applications that demonstrate how to
  use these plugins.

Testing
=======

You can test the plugins in two ways. You can test all components using the
'Test' example application, which runs the tests using
cordova-plugin-test-framework.

In addition, you can test the modules that consist of pure JavaScript by
running `npx jasmine runner.js` from the support directory.

This requires an installion of Node.js to be in the user's path, and does run
much faster. However, it cannot be used with any module of the code which
requires native Android or iOS code.
