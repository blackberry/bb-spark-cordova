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

 const Observable = require('./utils/Observable');
const ObservableList = require('./utils/ObservableList');

/**
 * @class AppMessage
 *
 * @classdesc
 * This list holds the set of application messages known to bbmcore.
 * Application messages are application-specific messages with application-
 * defined content sent to one or more identities for delivery to all their
 * registered endpoints.  Application messages are injected at the
 * infrastructure level, not by typical endpoints.<only for='sdk'>  If you are
 * interested in sending application messages to your application, please
 * contact the Spark Communications Services sales team.</only>
 *
 * These messages are not processed by bbmcore but are stored for your
 * application to consume as it sees fit.  Only 1000 application messages will
 * be stored by bbmcore at any one time.  If more application messages arrive,
 * older ones will be deleted to make room.  No 'listRemove' notification will
 * be sent for such removals.
 */
class AppMessageList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["id"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'appMessage';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byId(id) {
    if(this._property) {
      throw new Error("Cannot specify Id after specifying a criterion");
    }

    return new AppMessage({
      id: id
    }, false);
  }
}

/**
 * @class AppMessage
 *
 * @classdesc
 * This list holds the set of application messages known to bbmcore.
 * Application messages are application-specific messages with application-
 * defined content sent to one or more identities for delivery to all their
 * registered endpoints.  Application messages are injected at the
 * infrastructure level, not by typical endpoints.<only for='sdk'>  If you are
 * interested in sending application messages to your application, please
 * contact the Spark Communications Services sales team.</only>
 *
 * These messages are not processed by bbmcore but are stored for your
 * application to consume as it sees fit.  Only 1000 application messages will
 * be stored by bbmcore at any one time.  If more application messages arrive,
 * older ones will be deleted to make room.  No 'listRemove' notification will
 * be sent for such removals.
 */
class AppMessage extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["id"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'appMessage';
  }
}

/**
 * @class ChatMessage
 *
 * @classdesc
 * Each element in this list is a message in a chat.  The primary key for each
 * element is the 'chatId' and 'messageId'.
 *
 * The range of valid message ids for a given chat can be found in the chat list
 * as ['lastMessage' - 'numMessages', 'lastMessage'].
 *
 * When a new message is added to a chat, bbmcore will first 'listAdd' the
 * message entry, and then will 'listChange' the chat to update the
 * 'lastMessage' and 'numMessages' fields.
 *
 * Note that 'listRemove' is not supported for this list.  The message counters
 * maintained in the chat list indicate when messages have been removed from
 * this list.
 */
class ChatMessageList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "messageId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatMessage';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byChatIdAndMessageId(chatId, messageId) {
    if(this._property) {
      throw new Error("Cannot specify ChatIdAndMessageId after specifying a criterion");
    }

    return new ChatMessage({
      chatId: chatId,
    messageId: messageId
    }, false);
  }

  /**
   * Filters the requested list by the 'chatId' attribute. This field is
   * required, and at least one of the other fields must also be present.
   */
  filterByChatId(chatId) {
    return new ChatMessageList(Object.assign(this._property || {}, {
      chatId: chatId
    }), true);
  }

  /**
   * When provided, the requested list will be filtered by the 'tag' attribute.
   * 'Text' is not a supported value for this criteria.
   */
  filterByTag(tag) {
    return new ChatMessageList(Object.assign(this._property || {}, {
      tag: tag
    }), true);
  }

  /**
   * When present, this criterion filters the requested list to only those
   * messages that reference another individual message. In the
   * 'requestListMatching' request, this 'ref' field's value must be a single
   * element with 'tag' and 'messageId' fields that will be used to match the
   * 'chatMessage' element's 'ref' array. Any 'chatMessage' that has a 'ref'
   * with the same 'tag' and 'messageId' will match.
   */
  filterByRef(ref) {
    return new ChatMessageList(Object.assign(this._property || {}, {
      ref: ref
    }), true);
  }

  transform(element) {
    const newElement = Object.assign({
      'incoming': false,
      'unverified': false,
      'deleted': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The 'senderUri' is not the local user, and the message may be
         * considered to be incoming from the local user's perspective.  This is
         * a convenience alias for inspecting the 'senderUri' field.  The
         * absence of this flag reflects the fact that the 'senderUri' is the
         * local user.
         */
        case 'I':
          newElement.incoming = true;
          break;

        /**
         * The message's signature was not verified as being from the claimed
         * sender.  Despite this, the content of the message is made available
         * to be processed or ignored as your application sees fit.
         */
        case 'U':
          newElement.unverified = true;
          break;

        /**
         * The message has been deleted.
         */
        case 'D':
          newElement.deleted = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class ChatMessage
 *
 * @classdesc
 * Each element in this list is a message in a chat.  The primary key for each
 * element is the 'chatId' and 'messageId'.
 *
 * The range of valid message ids for a given chat can be found in the chat list
 * as ['lastMessage' - 'numMessages', 'lastMessage'].
 *
 * When a new message is added to a chat, bbmcore will first 'listAdd' the
 * message entry, and then will 'listChange' the chat to update the
 * 'lastMessage' and 'numMessages' fields.
 *
 * Note that 'listRemove' is not supported for this list.  The message counters
 * maintained in the chat list indicate when messages have been removed from
 * this list.
 */
class ChatMessage extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "messageId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatMessage';
  }

  transform(element) {
    const newElement = Object.assign({
      'incoming': false,
      'unverified': false,
      'deleted': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The 'senderUri' is not the local user, and the message may be
         * considered to be incoming from the local user's perspective.  This is
         * a convenience alias for inspecting the 'senderUri' field.  The
         * absence of this flag reflects the fact that the 'senderUri' is the
         * local user.
         */
        case 'I':
          newElement.incoming = true;
          break;

        /**
         * The message's signature was not verified as being from the claimed
         * sender.  Despite this, the content of the message is made available
         * to be processed or ignored as your application sees fit.
         */
        case 'U':
          newElement.unverified = true;
          break;

        /**
         * The message has been deleted.
         */
        case 'D':
          newElement.deleted = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class Typing
 *
 * @classdesc
 * This is used to store the set of users that are currently typing a  message
 * in a chat.  When bbmcore believes the remote user to be  typing a message in
 * a chat, it will insert the user/chat pair into  this list. When it no longer
 * believes the user to be typing a message,  it removes the pair from the list.
 * The same user may be typing in  multiple chats, and the same chat may contain
 * multiple typing users.  This list never contains entries for the local user.
 * This list may  contain entries for nonexistent users and chats.
 */
class TypingList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["userUri", "chatId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'typing';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byUserUriAndChatId(userUri, chatId) {
    if(this._property) {
      throw new Error("Cannot specify UserUriAndChatId after specifying a criterion");
    }

    return new Typing({
      userUri: userUri,
    chatId: chatId
    }, false);
  }
}

/**
 * @class Typing
 *
 * @classdesc
 * This is used to store the set of users that are currently typing a  message
 * in a chat.  When bbmcore believes the remote user to be  typing a message in
 * a chat, it will insert the user/chat pair into  this list. When it no longer
 * believes the user to be typing a message,  it removes the pair from the list.
 * The same user may be typing in  multiple chats, and the same chat may contain
 * multiple typing users.  This list never contains entries for the local user.
 * This list may  contain entries for nonexistent users and chats.
 */
class Typing extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["userUri", "chatId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'typing';
  }
}

/**
 * @class Chat
 *
 * @classdesc
 * This list contains an entry for each chat the user is participating in.
 * Chats are backed by the BlackBerry Infrastructure, and they will be restored
 * when signing into an existing Spark Communications identity.
 *
 * Chats must be started explicitly via the 'chatStart' message, and content may
 * be added using the 'chatMessageSend' message.
 *
 * When bbmcore issues a 'listRemove' for a chat, or when the 'numMessages'
 * counter decreases, it is not necessary to also issue a separate 'listRemove'
 * for the messages.  Your application will cleanup their cache of the (now
 * orphaned) messages when appropriate.
 */
class ChatList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chat';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byChatId(chatId) {
    if(this._property) {
      throw new Error("Cannot specify ChatId after specifying a criterion");
    }

    return new Chat({
      chatId: chatId
    }, false);
  }

  /**
   * Match the single chat with the specified mailboxId.  When this criterion is
   * specified, all other criteria are ignored.
   */
  filterByMailboxId(mailboxId) {
    return new ChatList(Object.assign(this._property || {}, {
      mailboxId: mailboxId
    }), true);
  }

  /**
   * Match all chats with the given 'keyState'.  Returns an empty list if no
   * match is found, or any errors occur.
   */
  filterByKeyState(keyState) {
    return new ChatList(Object.assign(this._property || {}, {
      keyState: keyState
    }), true);
  }

  transform(element) {
    const newElement = Object.assign({
      'admin': false,
      'hidden': false,
      'oneToOne': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The local user is an admin for the chat, and may perform
         * administrative actions such as promoting/demoting other participants
         * to/from admin status, and removing other participants from the chat.
         */
        case 'A':
          newElement.admin = true;
          break;

        /**
         * The chat has been hidden (by 'stopConversation').  The chat will
         * automatically stop being hidden when:<ul><li>the next incoming or
         * outgoing 'chatMessage' is added, or</li><li>(iff this is a 1:1 chat)
         * when a 'chatStart' request identifying this chat is received.</li>
         */
        case 'H':
          newElement.hidden = true;
          break;

        /**
         * The chat is the singular 1:1 chat between the local user and the
         * other party.  bbmcore ensures that only one such non-Defunct chat per
         * remote party will exist at a time.  Otherwise, the chat is a multi-
         * party chat, even if there are fewer than two remote parties.
         */
        case 'O':
          newElement.oneToOne = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class Chat
 *
 * @classdesc
 * This list contains an entry for each chat the user is participating in.
 * Chats are backed by the BlackBerry Infrastructure, and they will be restored
 * when signing into an existing Spark Communications identity.
 *
 * Chats must be started explicitly via the 'chatStart' message, and content may
 * be added using the 'chatMessageSend' message.
 *
 * When bbmcore issues a 'listRemove' for a chat, or when the 'numMessages'
 * counter decreases, it is not necessary to also issue a separate 'listRemove'
 * for the messages.  Your application will cleanup their cache of the (now
 * orphaned) messages when appropriate.
 */
class Chat extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chat';
  }

  transform(element) {
    const newElement = Object.assign({
      'admin': false,
      'hidden': false,
      'oneToOne': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The local user is an admin for the chat, and may perform
         * administrative actions such as promoting/demoting other participants
         * to/from admin status, and removing other participants from the chat.
         */
        case 'A':
          newElement.admin = true;
          break;

        /**
         * The chat has been hidden (by 'stopConversation').  The chat will
         * automatically stop being hidden when:<ul><li>the next incoming or
         * outgoing 'chatMessage' is added, or</li><li>(iff this is a 1:1 chat)
         * when a 'chatStart' request identifying this chat is received.</li>
         */
        case 'H':
          newElement.hidden = true;
          break;

        /**
         * The chat is the singular 1:1 chat between the local user and the
         * other party.  bbmcore ensures that only one such non-Defunct chat per
         * remote party will exist at a time.  Otherwise, the chat is a multi-
         * party chat, even if there are fewer than two remote parties.
         */
        case 'O':
          newElement.oneToOne = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class Stat
 *
 * @classdesc
 * Your application uses this list to retrieve stats that bbmcore has recorded
 * about its operation and performance.  Stats recorded by bbmcore are local to
 * the device and do not contain personally identifiable information. bbmcore
 * will only ever provide this data to your application when requested to do so.
 *
 * Every time your application retrieves this list with 'requestListAll', it can
 * contain different data.  Bbmcore remembers what values were sent in the most
 * recent 'stat' list collected by your application until your application sends
 * a 'statsCommitted' message.  When it receives 'statsCommitted', bbmcore
 * considers the values in the most recently collected 'stat' list to have been
 * exported by your application and committed permanently.  After that
 * 'statsCommitted' message, subsequent collections of stats with this list will
 * no longer include that committed data.
 *
 * If your application can't commit the values it collected with
 * 'requestListAll', it must not send 'statsCommitted'.  In such cases, the next
 * copy of of this list that your application collects will be even more up to
 * date and will include the data returned previously (back to the previous
 * 'statsCommitted').
 *
 * The values in this list persist across bbmcore restarts, and a
 * 'statsCommitted' message can and will complete a 'stats' retrieval even if it
 * was from a previous incarnation of bbmcore.
 *
 * Statistics whose values are zero when the list is requested are not included
 * in the list.
 *
 * No 'listElements' or 'listChange' will ever be sent for this list.
 *
 * This list does not define which statistics are recorded.  Interpretation of
 * the statistics is intended to be done by offline analysis and reporting.
 */
class StatList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["name"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'stat';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byName(name) {
    if(this._property) {
      throw new Error("Cannot specify Name after specifying a criterion");
    }

    return new Stat({
      name: name
    }, false);
  }
}

/**
 * @class Stat
 *
 * @classdesc
 * Your application uses this list to retrieve stats that bbmcore has recorded
 * about its operation and performance.  Stats recorded by bbmcore are local to
 * the device and do not contain personally identifiable information. bbmcore
 * will only ever provide this data to your application when requested to do so.
 *
 * Every time your application retrieves this list with 'requestListAll', it can
 * contain different data.  Bbmcore remembers what values were sent in the most
 * recent 'stat' list collected by your application until your application sends
 * a 'statsCommitted' message.  When it receives 'statsCommitted', bbmcore
 * considers the values in the most recently collected 'stat' list to have been
 * exported by your application and committed permanently.  After that
 * 'statsCommitted' message, subsequent collections of stats with this list will
 * no longer include that committed data.
 *
 * If your application can't commit the values it collected with
 * 'requestListAll', it must not send 'statsCommitted'.  In such cases, the next
 * copy of of this list that your application collects will be even more up to
 * date and will include the data returned previously (back to the previous
 * 'statsCommitted').
 *
 * The values in this list persist across bbmcore restarts, and a
 * 'statsCommitted' message can and will complete a 'stats' retrieval even if it
 * was from a previous incarnation of bbmcore.
 *
 * Statistics whose values are zero when the list is requested are not included
 * in the list.
 *
 * No 'listElements' or 'listChange' will ever be sent for this list.
 *
 * This list does not define which statistics are recorded.  Interpretation of
 * the statistics is intended to be done by offline analysis and reporting.
 */
class Stat extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["name"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'stat';
  }
}

/**
 * @class ChatMessageFileProgress
 *
 * @classdesc
 * This list reports upload and download progress information for active
 * 'chatMessage' file attachment transfers.
 *
 * Each item in this list corresponds to a single 'chatMessage' entry and is
 * identified by the same key fields: 'chatId' and 'messageId'.  When an entry
 * exists in this list, bbmcore is actively trying to upload or download the
 * attached file.  The fields of the entry in this list indicate the progress
 * bbmcore has made in that active transfer.  When an entry is removed from this
 * list, bbmcore is no longer actively trying to transfer it.  When a transfer
 * attempt fails, it will not be represented in this list until bbmcore retries
 * it, but the associated 'chatMessage' 'fileState' will still be
 * 'Transferring'.
 *
 * Changes in this list will be reported only when the previously reported value
 * of 'bytes' and the current value of 'bytes' differ enough that the progress
 * towards the 'total' achieves a different 5% increment.
 *
 * For example, if a file was 100 bytes in 'total' and the previous report was
 * 37 'bytes', then a change would only be reported for this entry after 'bytes'
 * reached at least 40.  A change from 37 to 39 would not be reported by bbmcore
 * because 'bytes' must reach at least 40 to move from the 35-40% increment to
 * the 40-45% (or higher) increment.
 *
 * Your application doesn't have to wait for a change in 'bytes' to get an
 * initial progress value for an active transfer it has previously been
 * ignoring.  Your application can query the list directly with
 * 'requestListElements' at any time.  When such a request returns no entry for
 * a given pair of ids, it means that bbmcore isn't currently trying to upload
 * or download the attached file or no progress information is available for the
 * transfer.  (See the caveat on 'total'.)
 */
class ChatMessageFileProgressList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "messageId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatMessageFileProgress';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byChatIdAndMessageId(chatId, messageId) {
    if(this._property) {
      throw new Error("Cannot specify ChatIdAndMessageId after specifying a criterion");
    }

    return new ChatMessageFileProgress({
      chatId: chatId,
    messageId: messageId
    }, false);
  }
}

/**
 * @class ChatMessageFileProgress
 *
 * @classdesc
 * This list reports upload and download progress information for active
 * 'chatMessage' file attachment transfers.
 *
 * Each item in this list corresponds to a single 'chatMessage' entry and is
 * identified by the same key fields: 'chatId' and 'messageId'.  When an entry
 * exists in this list, bbmcore is actively trying to upload or download the
 * attached file.  The fields of the entry in this list indicate the progress
 * bbmcore has made in that active transfer.  When an entry is removed from this
 * list, bbmcore is no longer actively trying to transfer it.  When a transfer
 * attempt fails, it will not be represented in this list until bbmcore retries
 * it, but the associated 'chatMessage' 'fileState' will still be
 * 'Transferring'.
 *
 * Changes in this list will be reported only when the previously reported value
 * of 'bytes' and the current value of 'bytes' differ enough that the progress
 * towards the 'total' achieves a different 5% increment.
 *
 * For example, if a file was 100 bytes in 'total' and the previous report was
 * 37 'bytes', then a change would only be reported for this entry after 'bytes'
 * reached at least 40.  A change from 37 to 39 would not be reported by bbmcore
 * because 'bytes' must reach at least 40 to move from the 35-40% increment to
 * the 40-45% (or higher) increment.
 *
 * Your application doesn't have to wait for a change in 'bytes' to get an
 * initial progress value for an active transfer it has previously been
 * ignoring.  Your application can query the list directly with
 * 'requestListElements' at any time.  When such a request returns no entry for
 * a given pair of ids, it means that bbmcore isn't currently trying to upload
 * or download the attached file or no progress information is available for the
 * transfer.  (See the caveat on 'total'.)
 */
class ChatMessageFileProgress extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "messageId"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatMessageFileProgress';
  }
}

/**
 * @class ChatParticipant
 *
 * @classdesc
 * This list holds the participants for each chat identified by chatId.  The
 * local user is never included in this list.
 */
class ChatParticipantList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "userUri"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatParticipant';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byChatIdAndUserUri(chatId, userUri) {
    if(this._property) {
      throw new Error("Cannot specify ChatIdAndUserUri after specifying a criterion");
    }

    return new ChatParticipant({
      chatId: chatId,
    userUri: userUri
    }, false);
  }

  /**
   * When provided, all participants for the given chat will be returned. The
   * local user's participant is not included. This criteria may not be used in
   * combination with any other.
   */
  filterByChatId(chatId) {
    return new ChatParticipantList(Object.assign(this._property || {}, {
      chatId: chatId
    }), true);
  }

  /**
   * Must be used in combination with state. When provided, returns all
   * participants from any chat if they match the given userUri and state.
   */
  filterByUserUri(userUri) {
    return new ChatParticipantList(Object.assign(this._property || {}, {
      userUri: userUri
    }), true);
  }

  /**
   * Must be used in combination with userUri.
   */
  filterByState(state) {
    return new ChatParticipantList(Object.assign(this._property || {}, {
      state: state
    }), true);
  }

  transform(element) {
    const newElement = Object.assign({
      'admin': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The participant is an admin for the chat.  This only applies to chats
         * without the 'oneToOne' flag.
         */
        case 'A':
          newElement.admin = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class ChatParticipant
 *
 * @classdesc
 * This list holds the participants for each chat identified by chatId.  The
 * local user is never included in this list.
 */
class ChatParticipant extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["chatId", "userUri"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'chatParticipant';
  }

  transform(element) {
    const newElement = Object.assign({
      'admin': false
    }, element);

    if(element.flags) {
      for(let i = 0; i < element.flags.length; ++i) {
        switch(element.flags.charAt(i)) {
        /**
         * The participant is an admin for the chat.  This only applies to chats
         * without the 'oneToOne' flag.
         */
        case 'A':
          newElement.admin = true;
          break;
        }
      }
    }

    return newElement;
  }
}

/**
 * @class User
 *
 * @classdesc
 * This list consists of all the users known to bbmcore.  Other lists, such as
 * the 'participant' list, often refer to entries in this 'user' list.  Your
 * application never requests the list in full.  Instead, it uses
 * 'requestListElements' calls to lookup one or more users by their 'uri'.
 */
class UserList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["uri"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'user';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byUri(uri) {
    if(this._property) {
      throw new Error("Cannot specify Uri after specifying a criterion");
    }

    return new User({
      uri: uri
    }, false);
  }

  /**
   * Match a single user by regId.  This is mutually exclusive with all other
   * criteria.  Returns an empty list if no match is found, any other criteria
   * are specified, or any errors are encountered.
   */
  byRegId(regId) {
    if(this._property) {
      throw new Error("Cannot specify RegId after specifying a criterion");
    }

    return new User({
      regId: regId
    }, false);
  }

  /**
   * Match a single user by PIN.  This is mutually exclusive with all other
   * criteria.  Returns an empty list if no match is found, any other criteria
   * are specified, or any errors are encountered.
   */
  byPin(pin) {
    if(this._property) {
      throw new Error("Cannot specify Pin after specifying a criterion");
    }

    return new User({
      pin: pin
    }, false);
  }

  /**
   * Match all users with the given 'keyState'.  The local user is not returned.
   * Its 'keyState' can be queried via the 'profileKeysState' global.  This is
   * mutually exclusive with all other criteria.  Returns an empty list if no
   * match is found, any other criteria are specified, or any errors are
   * encountered.
   */
  filterByKeyState(keyState) {
    return new UserList(Object.assign(this._property || {}, {
      keyState: keyState
    }), true);
  }
}

/**
 * @class User
 *
 * @classdesc
 * This list consists of all the users known to bbmcore.  Other lists, such as
 * the 'participant' list, often refer to entries in this 'user' list.  Your
 * application never requests the list in full.  Instead, it uses
 * 'requestListElements' calls to lookup one or more users by their 'uri'.
 */
class User extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["uri"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'user';
  }
}

/**
 * @class Global
 *
 * @classdesc
 * This list holds the set of global variables exchanged between your
 * application and bbmcore. The list uses string keys and mixed-type values. The
 * key is the variable name. The set of valid variables and their meaning is
 * documented in the 'globals' section.
 */
class GlobalList extends ObservableList {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["name"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'global';
  }

  /**
   * Return an element of the list indexed by primary key.
   */
  byName(name) {
    if(this._property) {
      throw new Error("Cannot specify Name after specifying a criterion");
    }

    return new Global({
      name: name
    }, false);
  }
}

/**
 * @class Global
 *
 * @classdesc
 * This list holds the set of global variables exchanged between your
 * application and bbmcore. The list uses string keys and mixed-type values. The
 * key is the variable name. The set of valid variables and their meaning is
 * documented in the 'globals' section.
 */
class Global extends Observable {
  constructor (property, matching) {
    super();
    this._property = property;
    this._matching = matching;
  }

  /**
   * Get the primary key of the list.
   */
  getPrimaryKey() {
    return ["name"];
  }

  /**
   * Override function to get Object ID.
   */
  getObjectId() {
    return 'global';
  }
}

/**
 * Export all symbols.
 */
module.exports = {
  lists: {
    appMessage: AppMessageList,
    chatMessage: ChatMessageList,
    typing: TypingList,
    chat: ChatList,
    stat: StatList,
    chatMessageFileProgress: ChatMessageFileProgressList,
    chatParticipant: ChatParticipantList,
    user: UserList,
    global: GlobalList
  },
  globals: {
    /**
     * The identifier for this endpoint. This must be treated as an opaque value
     * by application.
     */
    endpointId: new Global({
        name: 'endpointId'
      }, false),
    /**
     * In R5, endpoints are given this registration token when they are assigned
     * a regId during setup.  This token is signed by the BlackBerry
     * Infrastructure.  When decoded, the token contains trusted information
     * about the association of your application user id (as passed to
     * 'authToken') with the assigned regId.  The steps for decoding and
     * verifying the registration token are explained in detail in the Developer
     * Guide.
     *
     * Endpoints that have not yet been assigned a regId and endpoints that were
     * assigned a regId before the R5 release do not have a registration token
     * value.  In those endpoints, this global will be the empty string.
     */
    registrationToken: new Global({
        name: 'registrationToken'
      }, false),
    /**
     * Indicates the current state of the profile's signing and encryption key
     * pairs.
     *
     * This state only applies when your application uses Cloud Key Storage
     * without the BlackBerry Key Management Service.
     */
    profileKeysState: new Global({
        name: 'profileKeysState'
      }, false),
    /**
     * <p>This global boolean indicates when bbmcore is performing reconnect
     * synchronization with the BlackBerry Infrastructure.  On mobile OSes and
     * within other environments that are aggressive about terminating or
     * suspending applications, your application should take steps to keep
     * bbmcore running while this global is true.</p><p>For example, consider an
     * Android application that receives push notifications when there are
     * protocol messages waiting for bbmcore to fetch from the BlackBerry
     * Infrastructure.  Your application could use this global as part of the
     * following strategy.</p><ol><li>When your application receives the push,
     * it raises a "connected" foreground notification (if one is not already
     * raised) that will keep your application running.</li><li>When that
     * notification is raised, your application starts a short timer.  This
     * timer will give bbmcore time to connect to the BlackBerry Infrastructure,
     * which will happen before this global is raised.  If this timer expires,
     * your application "gives up" on waiting for the global to change, and
     * removes the foreground notification.</li><li>Your application then
     * forwards that push notification to the lower layers which will react by
     * connecting to the BlackBerry Infrastructure.</li><li>Once bbmcore has
     * successfully connected, it changes the 'syncing' global to 'true'.  In
     * response, your application raises the notification if it isn't already
     * raised.  Your application also sets or extends the notification timer for
     * a longer duration.  Again, if that timer expires, your application
     * removes the notification.</li><li>When the syncing process completes,
     * bbmcore changes the 'syncing' global back to 'false'.  In response, if
     * the notification is still raised, your application removes it and cancels
     * the timer.</li></ol><p>In extreme circumstances, the 'syncing' global can
     * remain true for a long time as bbmcore attempts to recover from unusual
     * failure cases.  The timers described above give your application control
     * over the maximum duration it is willing to keep the notification
     * raised.</p>
     */
    syncing: new Global({
        name: 'syncing'
      }, false),
    /**
     * Associates the PIN that is assigned by the BlackBerry Infrastructure with
     * the local profile. The PIN is an 8-character hexadecimal string (in lower
     * case), or it is an empty string if no PIN is currently assigned to the
     * local profile.
     */
    localPin: new Global({
        name: 'localPin'
      }, false),
    /**
     * This state is only used when your application uses the BlackBerry Key
     * Management Service and the 'setupState' is 'SyncRequired'.
     *
     * <p>When your application sees 'setupState' change to 'SyncRequired', it
     * should examine this global.</p><ol><li>When 'syncPasscodeState' is
     * 'None', your application should wait for 'syncPasscodeState' to change
     * before sending 'syncStart'.</li><li>When 'syncPasscodeState' is
     * <em>not</em> 'None', its value is already current and your application
     * does not have to wait.</li></ol><p>See 'syncStart' for more
     * information.</p>
     */
    syncPasscodeState: new Global({
        name: 'syncPasscodeState'
      }, false),
    /**
     * This indicates the state of the setup process.
     *
     * Endpoint setup includes registering the endpoint with the BlackBerry
     * Infrastructure and synchronizing the endpoint's copy of identity data,
     * including any security keys.
     *
     * The following diagram demonstrates the flow of state changes in
     * 'setupState' for all modes of setup: <br/><only for='bbm'><img src="img
     * /BBMDS-Core-setupState-bbm.png" style="margin-top: 1em;"/></only><only
     * for='sdk'><img src="img/BBMDS-Core-setupState-sdk.png" style="margin-top:
     * 1em;"/></only>
     */
    setupState: new Global({
        name: 'setupState'
      }, false),
    /**
     * This global indicates if bbmcore requires an authToken value from your
     * application, using the 'authToken' message.  The authToken value is used
     * by identity providers to grant further authorization within the
     * BlackBerry Infrastructure.
     *
     * Bbmcore will try to avoid requesting authToken values as much as
     * possible.
     *
     * Your application may rely on bbmcore to rate limit how often this global
     * value is something other than 'Ok'.  Your application should react
     * automatically when this global's value changes.
     */
    authTokenState: new Global({
        name: 'authTokenState'
      }, false),
    /**
     * This holds the local user's URI as a foreign key into 'listUser'. When a
     * user URI appears elsewhere in the protocol, your application compares the
     * user URI to the 'localUri' value, to determine if the URI refers to the
     * local user.
     */
    localUri: new Global({
        name: 'localUri'
      }, false),
    /**
     * This controls whether bbmcore will automatically download newly received
     * file attachments.
     *
     * Regardless of this setting, your application can ask for individual
     * attachments to be downloaded using the 'chatMessageFileDownload' request.
     */
    chatMessageFileAutoDownload: new Global({
        name: 'chatMessageFileAutoDownload'
      }, false),
    /**
     * Indicates if a new or existing Spark Communications identity was used
     * during the most recent setup attempt. Note: the value of this global
     * changes before setup is complete. To see what kind of identity was used
     * for the most recent setup attempt that was successful, check this
     * 'setupAccount' value when 'setupState' transitions to 'Success'.
     */
    setupAccount: new Global({
        name: 'setupAccount'
      }, false)
  }
};
