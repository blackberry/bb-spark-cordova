//****************************************************************************
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
'use strict';

/**
 * @typedef {Object} AuthConfig
 * @memberof Support.Auth.MockAuthManager
 * @property {string} domain Spark domain
 */

/**
 * Manages authentication without an identity provider. It generates an access
 * token which is used by Spark SDK for authentication. This access token
 * is not signed and is not validated against any identity provider.
 * 
 * This requires an application to override getUserId() function to return a
 * Promise of the user ID.
 * 
 * @param {Support.Auth.MockAuthManager.AuthConfig} appAuthConfig The
 * configuration required to authenticate.
 * @memberof Support.Auth
 * @class MockAuthManager
 */
function MockAuthManager(appAuthConfig) {

  let m_localUserInfo;

  //#region Private methods

  // Create non signed JWT.
  const createToken = () => {
    const jti = btoa(
      window.crypto.getRandomValues(new Uint8Array(20))).substring(0, 18);

    const tokenHeader = btoa(JSON.stringify({
      alg: 'none'
    }));

    const tokenBody = btoa(JSON.stringify({
      iss: 'NoIDP',
      jti: jti,
      sub: m_localUserInfo.userId,
      iat: Date.now(),
      exp: Date.now() + 3600 * 1000
    }));

    return `${tokenHeader}.${tokenBody}.`;
  };

  //#endregion Private methods

  //#region Public methods

  /**
   * This function must be overridden by client application to return a promise
   * of userId.
   * @returns {Promise<string>} Promise of user ID.
   */
  this.getUserId = () => {
    throw new Error('getUserId must return a promise of userId');
  };

  /**
   * Performs the client authentication.
   * @returns {Promise<Support.Identity.MockUserManager.UserInfo>} Returns
   * promise of user information.
   */
  this.authenticate = async function() {
    const userId = await this.getUserId();
    m_localUserInfo = {
      displayName: userId,
      userId: userId,
    };
    return m_localUserInfo;
  };

  /**
   * Get local user information that was retrieved from the authentication user
   * info service.
   * @returns {Support.Identity.MockUserManager.UserInfo} The information for
   * the local user.
   */
  this.getLocalUserInfo = function() {
    return m_localUserInfo;
  };

  /**
   * @returns {Promise<string>} The promise of an access token that can be sent
   * to the BBM Enterprise server.
   */
  this.getBbmSdkToken = function() {
    const token = createToken();
    return Promise.resolve(token);
  };

  /**
   * @returns {boolean} Returns true if application is authenticated. Returns
   * false otherwise.
   */
  this.isAuthenticated = function() {
    return !!m_localUserInfo;
  };

  //#endregion Public methods
}

module.exports = MockAuthManager;

//****************************************************************************
