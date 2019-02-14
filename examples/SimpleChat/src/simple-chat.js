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

import { html } from '../node_modules/@polymer/polymer/polymer-element.js';
import { afterNextRender } from '../node_modules/@polymer/polymer/lib/utils/render-status.js';
import { flush } from '../node_modules/@polymer/polymer/lib/utils/flush.js';
import { } from '../node_modules/@polymer/polymer/lib/elements/dom-repeat.js';
import '../node_modules/@polymer/iron-list/iron-list.js';
import MessageListElement from './MessageListElement.js';
import ObservableElement from './ObservableElement.js';

class SimpleChat extends ObservableElement(MessageListElement) {
  constructor () {
    super();
  }

  ready() {
    super.ready();

    if (window.cordova.platformId === "android") {
      document.addEventListener("backbutton", (e) => {
        e.preventDefault();
        this.onCloseClicked();
      });

      this.$.closeButton.style.display = 'none';
    }
  }

  static get template() {
    return html`
    <style>
      :host {
        left: 0px;
        top: 0px;
        width: 100vw;
        height: 100vh;
        position: absolute;
        background: white;
        display: flex;
        flex-direction:column;
      }

      :host .header-wrapper {
        width: 100%;
        display: flex;
        flex-direction: row;
      }

      :host .header {
        font-size: xx-large;
        color: #087099;
        margin: 10px;
        display: flex;
        flex: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host .message-list-wrapper {
        display: block;
        margin: 10px;
        height: calc(100vh - 130px);
        height: -webkit-calc(100vh - 130px);
        max-height: calc(100vh - 130px);
        max-height: -webkit-calc(100vh - 130px);
      }

      :host .message-list-wrapper .message-list {
        max-height: calc(100vh - 130px);
        max-height: -webkit-calc(100vh - 130px);
      }

      :host .message-list-wrapper .message-list .content {
        margin-bottom: 10px;
      }

      :host .content-in-unread {
        font-weight: bold;
        margin-bottom: 10px;
      }

      :host .content-unknown-tag {
        font-style: italic;
        margin-bottom: 10px;
      }

      :host .message-list-wrapper .message-list .time-stamp {
        font-size: small;
        color: gray;
      }

      :host .button {
        width: 100px;
        background: #087099;
        color: white;
        height: 30px;
        text-align: center;
        align-content: center;
        align-items: center;
        align-self: center;
        display: grid;
        font-weight: bold;
        cursor: pointer;
        margin: 10px;
      }

      :host .input-wrapper {
        width: 100%;
        display: flex;
        border-top: 1px solid #96c5d8;
      }

      .input-wrapper input {
        white-space: nowrap;
        font-size: large;
        display: flex;
        flex: auto;
        border: none;
        outline: none;
        padding: 10px;
      }

      .typing-notification {
        display: [[showTypingMessage]];
        width: 100%;
        height: 20px;
        align-items: center;
      }

      .typing-text {
        font-size: 12px;
        margin-left: 10px;
        font-style: italic;
      }
    </style>
    <div class="header-wrapper">
      <div class="header">
        [[chat.subject]]
      </div>
      <div id="closeButton" class="button" on-click="onCloseClicked" on-tap="onCloseClicked">Close</div>
    </div>
    <div class="message-list-wrapper" id="messageListWrapper">
      <iron-list id="messageList" class="message-list" items="[[messages]]">
        <template>
          <div class="message">
            <div class="time-stamp">[[item.time]]</div>
            <div class$="[[getContentClass(item.incoming, item.state, item.tag)]]">[[getState(item.incoming, item.state)]][[getContent(item.tag, item.content)]]</div>
          </div>
        </template>
      </iron-list>
    </div>
    <div class="typing-notification" id="typingNotification">
      <label class="typing-text">[[typingMessage]]</label>
    </div>
    <div class="input-wrapper">
      <input type="text"
        id="messageInput"
        placeholder="Protected. Enter message."
        value={{message::input}}
        on-keypress="onInputKeyPress"></input>
      <div class="button" on-click="onSendClicked" on-tap="onSendClicked">Send</div>
    </div>
    `;
  }

  static get properties() {
    return {
      spark: {
        value: null,
        observer: 'onSparkChanged'
      },

      chatId: {
        type: Object,
        value: null,
        observer: 'onChatIdChanged'
      },
      chat: {
        type: Object,
        value: null
      },
      message: {
        value: ''
      },
      messages: {
        value: []
      },
      typingUsers: {
        type: Array,
        value: [],
        notify: true
      },
      typingMessage: {
        type: String,
        value: 'None',
        computed: 'getNotificationString(typingUsers.*, chat)',
        observer: 'onTypingChanged'
      }
    };
  }

  static get is() {
    return 'simple-chat';
  }

  getNotificationString(typingUsers, chat) {
    const users = this.typingUsers.filter(user => user.chatId === chat.chatId);

    if(users.length === 1) {
      return `${users[0].userUri} is typing`;
    } else if(users.length > 1) {
      return `${users[0].userUri} and ${users.length-1} are typing`;
    }
  }

  onTypingChanged(typingMessage) {
    this.$.typingNotification.style.display = typingMessage ? 'flex' : 'none';
  }

  getState(isIncoming, state) {
    if(isIncoming) return '';

    switch(state) {
      case 'Sending': return '(...): ';
      case 'Sent': return '(S): ';
      case 'Delivered': return '(D): ';
      case 'Read': return '(R): ';
      case 'Failed': return '(F): ';
      default: return '(?): ';
    }
  }

  getContent(tag, content) {
    if (tag === "Text") {
      return content;
    } else {
      return tag;
    }
  }

  getContentClass(isIncoming, state, tag) {
    if (tag !== "Text") {
      return "content-unknown-tag";
    }
    if(isIncoming && state != 'Read') {
      return "content-in-unread";
    }
    return "content";
  }

  onCloseClicked() {
    // Just mark messages read when user closes chat screen.
    this.markRead();

    const len = this.messages.length;
    this.splice('messages', 0, len);
    flush();
    this.set('message', '');
    this.set('chatId', null);
  }

  markRead() {
    if (this.chat && this.chat.numUnread > 0) {
      const params = {
        chatId: this.chat.chatId,
        messageId: String(this.chat.lastMessage)
      };
      return this.spark.invoke(BBMEnterprise.Messages.ChatMessageRead, params);
    }
  }

  // Invoked when this switches to a different chat, not when the current chat properties change.
  onChatIdChanged(chatId, oldChatId) {
    if (!chatId) {
      this.style.display = 'none';
      this.unbindMessages('messages');
      if (this.spark) {
        this.unbind('typingUsers', this.spark.typing);
      }

      //Stop listening to the chat observable
      if (oldChatId && this.onChatChangedBound) {
        this.spark.chat.byChatId(oldChatId).off(this.onChatChangedBound);
      }
      this.chat = undefined;
    } else {
      this.style.display = 'flex';
      this.bindMessages('messages', chatId);
      this.bind('typingUsers', this.spark.typing);

      this.onChatChangedBound = this.onChatChanged.bind(this);
      this.spark.chat.byChatId(chatId).on(this.onChatChangedBound);
    }
  }

  onChatChanged(chat) {
    this.chat = chat;
  }

  onSparkChanged(spark, oldSpark) {
    if(oldSpark) {
      // If there was a previous spark, remove any old bindings.
      this.unbind('messages');
    }

    this.setBbmeSdk(spark);
    this.chat = undefined;
    this.chatId = undefined;
  }

  onSendClicked() {
    if (!this.message) {
      return;
    }
    const params = {
      chatId: this.chatId,
      tag: 'Text',
      content: this.message,
      cookie: 'cookie-' + (new Date()).getTime()
    };
    this.spark.invoke(BBMEnterprise.Messages.ChatMessageSend, params);
    this.set('message', '');

    afterNextRender(this, () => {
      this.$.messageList.scrollTop = this.$.messageList.scrollHeight;
      this.$.messageList.notifyResize();
    });

    this.$.messageInput.focus();
  }

  onInputKeyPress(e) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this.onSendClicked();
    }
  }
}

window.customElements.define(SimpleChat.is, SimpleChat);


