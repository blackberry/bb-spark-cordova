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

 const Message = require('./utils/Message');

/**
 * class ChatKeyExport
 * @classdesc
 * Request that bbmcore return the locally stored chat key for a chat.  Iff the
 * 'chatId' exists, this will trigger a 'chatKey' response.
 *
 * To avoid event loops, your application must only react with 'chatKeyExport'
 * to <em>changes</em> of the chat's 'keyState' <em>to</em> 'Export'.  Your
 * application must not react to updates from bbmcore that indicate the chat's
 * 'keyState' is 'Export' when the chat's 'keyState' was already known to your
 * application to be 'Export'.  In other words, your application must not export
 * keys unless the chat's 'keyState' is actually changing or being learned for
 * the first time.  By following this rule, failed exports will not result in
 * tight event loops and will allow retries (at a minimum on application
 * restart, but also whenever bbmcore decides to toggle the state).
 *
 * The chat's 'keyState' is not updated in response to this message, and thus
 * must be set to 'Synced' via a 'requestListChange' once the key is
 * successfully stored externally.
 *
 * This message will be ignored by bbmcore if your application uses the
 * BlackBerry Key Management Service.
 */
class ChatKeyExport extends Message {
  constructor(parameters) {
    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatKeyExport';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class EndpointUpdate
 * @classdesc
 * Requests that bbmcore update the identified endpoint's registration  details.
 * This will result in an 'endpointUpdateResult' with the  given cookie from
 * bbmcore.
 *
 * This message should be called for the local endpointId before  registering
 * (when the 'setupState' is 'NotRequested'i) to set the  potentially new
 * endpoint's description on the BlackBerry Infrastructure.
 */
class EndpointUpdate extends Message {
  constructor(parameters) {
    if(typeof parameters.isLegacyDelegate !== "boolean") {
      throw new TypeError('parameters.isLegacyDelegate must be of type boolean');
    }

    if(typeof parameters.nickname !== "string") {
      throw new TypeError('parameters.nickname must be of type string');
    }

    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    if(typeof parameters.description !== "string") {
      throw new TypeError('parameters.description must be of type string');
    }

    if(parameters.endpointId !== undefined) {
        if(typeof parameters.endpointId !== "string") {
          throw new TypeError('parameters.endpointId must be of type string');
        }
    }

    super(parameters);
    this.name = 'endpointUpdate';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatKeysImport
 * @classdesc
 * Request that bbmcore set one or more chat keys.
 *
 * Your application should try to include keys for as many chats as possible in
 * a single 'chatKeysImport' request (within BBMDS message size limits) for
 * greater efficiency.
 *
 * If no chat with a given 'mailboxId' exists, or the chat is not waiting for a
 * key, the request is ignored.
 *
 * If a chat's key is imported successfully, the chat's 'keyState' will be
 * updated to 'Synced', and if the chat's 'state' was 'Waiting' (for the key) it
 * will be updated to 'Ready'.  If the import fails, the chat's 'keyState' and
 * 'state' will remain unchanged.
 *
 * To avoid event loops, your application must only react with 'chatKeysImport'
 * to <em>changes</em> of a chat's 'keyState' <em>to</em> 'Import'.  Your
 * application must not react to updates from bbmcore that indicate the
 * 'keyState' is 'Import' when the 'keyState' was already known to your
 * application to be 'Import'.  When your application first learns of a chat
 * (such as after starting up) and its 'keyState' is 'Import', your application
 * should consider that a change and can react to it with 'chatKeysImport'.  In
 * other words, your application must not import keys unless the 'keyState' is
 * actually changing or being learned for the first time.  By following this
 * rule, failed imports will not result in tight event loops and will allow
 * retries (at a minimum on application restart, but also whenever bbmcore
 * decides to toggle the state).
 *
 * This message will be ignored by bbmcore if your application uses the
 * BlackBerry Key Management Service.
 */
class ChatKeysImport extends Message {
  constructor(parameters) {
    if(typeof parameters.keys !== "object"
    || !Array.isArray(parameters.keys)) {
      throw new TypeError('parameters.keys must be of type array');
    }

    super(parameters);
    this.name = 'chatKeysImport';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageSend
 * @classdesc
 * Send a new message within an existing chat.  This will result in a 'listAdd'
 * on the 'listChatMessage' list, and the message will be sent to the BlackBerry
 * Infrastructure and forwarded to the other endpoints that are participating in
 * the chat.
 *
 * Sending a new message within a 1:1 chat before the invited party has joined
 * can trigger the invitation to be reissued when other conditions are also met.
 * This mechanism achieves a partially automatic user-speed retry of 1:1 chat
 * invitations.  There is no automatic mechanism for non-1:1 chats, but
 * invitations for all types of chats can be reissued upon request via
 * 'chatInvite'.
 */
class ChatMessageSend extends Message {
  constructor(parameters) {
    if(parameters.thumb !== undefined) {
        if(typeof parameters.thumb !== "string") {
          throw new TypeError('parameters.thumb must be of type string');
        }
    }

    if(parameters.ref !== undefined) {
        if(typeof parameters.ref !== "object"
        || !Array.isArray(parameters.ref)) {
          throw new TypeError('parameters.ref must be of type array');
        }
    }

    if(parameters.content !== undefined) {
        if(typeof parameters.content !== "string") {
          throw new TypeError('parameters.content must be of type string');
        }
    }

    if(parameters.filePolicy !== undefined) {
        if(typeof parameters.filePolicy !== "string") {
          throw new TypeError('parameters.filePolicy must be of type string');
        }
    }

    if(typeof parameters.tag !== "string") {
      throw new TypeError('parameters.tag must be of type string');
    }

    if(parameters.thumbPolicy !== undefined) {
        if(typeof parameters.thumbPolicy !== "string") {
          throw new TypeError('parameters.thumbPolicy must be of type string');
        }
    }

    if(parameters.file !== undefined) {
        if(typeof parameters.file !== "string") {
          throw new TypeError('parameters.file must be of type string');
        }
    }

    if(parameters.data !== undefined) {
        if(typeof parameters.data !== "object") {
          throw new TypeError('parameters.data must be of type object');
        }

        if(parameters.data.Picture !== undefined) {
            if(typeof parameters.data.Picture !== "object") {
              throw new TypeError('parameters.data.Picture must be of type object');
            }

            if(typeof parameters.data.Picture.mimeType !== "string") {
              throw new TypeError('parameters.data.Picture.mimeType must be of type string');
            }

            if(parameters.data.Picture.suggestedFilename !== undefined) {
                if(typeof parameters.data.Picture.suggestedFilename !== "string") {
                  throw new TypeError('parameters.data.Picture.suggestedFilename must be of type string');
                }
            }
        }

        if(parameters.data.Quote !== undefined) {
            if(typeof parameters.data.Quote !== "object") {
              throw new TypeError('parameters.data.Quote must be of type object');
            }

            if(typeof parameters.data.Quote.text !== "string") {
              throw new TypeError('parameters.data.Quote.text must be of type string');
            }

            if(parameters.data.Quote.timestamp !== undefined) {
                if(typeof parameters.data.Quote.timestamp !== "number"
                && typeof parameters.data.Quote.timestamp !== "string") {
                  throw new TypeError('parameters.data.Quote.timestamp must be of type number');
                }
            }

            if(parameters.data.Quote.source !== undefined) {
                if(typeof parameters.data.Quote.source !== "string") {
                  throw new TypeError('parameters.data.Quote.source must be of type string');
                }
            }
        }

        if(parameters.data.Sticker !== undefined) {
            if(typeof parameters.data.Sticker !== "object") {
              throw new TypeError('parameters.data.Sticker must be of type object');
            }

            if(typeof parameters.data.Sticker.id !== "string") {
              throw new TypeError('parameters.data.Sticker.id must be of type string');
            }
        }

        if(parameters.data.VoiceNote !== undefined) {
            if(typeof parameters.data.VoiceNote !== "object") {
              throw new TypeError('parameters.data.VoiceNote must be of type object');
            }

            if(parameters.data.VoiceNote.suggestedFilename !== undefined) {
                if(typeof parameters.data.VoiceNote.suggestedFilename !== "string") {
                  throw new TypeError('parameters.data.VoiceNote.suggestedFilename must be of type string');
                }
            }
        }

        if(parameters.data.ReferencedUpdate !== undefined) {
            if(typeof parameters.data.ReferencedUpdate !== "object") {
              throw new TypeError('parameters.data.ReferencedUpdate must be of type object');
            }

            if(typeof parameters.data.ReferencedUpdate.type !== "string") {
              throw new TypeError('parameters.data.ReferencedUpdate.type must be of type string');
            }

            if(parameters.data.ReferencedUpdate.update !== undefined) {
                if(typeof parameters.data.ReferencedUpdate.update !== "string") {
                  throw new TypeError('parameters.data.ReferencedUpdate.update must be of type string');
                }
            }
        }

        if(parameters.data.MediaConf !== undefined) {
            if(typeof parameters.data.MediaConf !== "object") {
              throw new TypeError('parameters.data.MediaConf must be of type object');
            }

            if(typeof parameters.data.MediaConf.url !== "string") {
              throw new TypeError('parameters.data.MediaConf.url must be of type string');
            }

            if(parameters.data.MediaConf.requireAuth !== undefined) {
                if(typeof parameters.data.MediaConf.requireAuth !== "boolean") {
                  throw new TypeError('parameters.data.MediaConf.requireAuth must be of type boolean');
                }
            }
        }

        if(parameters.data.priority !== undefined) {
            if(typeof parameters.data.priority !== "string") {
              throw new TypeError('parameters.data.priority must be of type string');
            }
        }

        if(parameters.data.Glympse !== undefined) {
            if(typeof parameters.data.Glympse !== "object") {
              throw new TypeError('parameters.data.Glympse must be of type object');
            }

            if(typeof parameters.data.Glympse.id !== "string") {
              throw new TypeError('parameters.data.Glympse.id must be of type string');
            }
        }

        if(parameters.data.Contact !== undefined) {
            if(typeof parameters.data.Contact !== "object") {
              throw new TypeError('parameters.data.Contact must be of type object');
            }

            if(parameters.data.Contact.suggestedFilename !== undefined) {
                if(typeof parameters.data.Contact.suggestedFilename !== "string") {
                  throw new TypeError('parameters.data.Contact.suggestedFilename must be of type string');
                }
            }
        }

        if(parameters.data.Call !== undefined) {
            if(typeof parameters.data.Call !== "object") {
              throw new TypeError('parameters.data.Call must be of type object');
            }

            if(typeof parameters.data.Call.callType !== "string") {
              throw new TypeError('parameters.data.Call.callType must be of type string');
            }

            if(typeof parameters.data.Call.eventType !== "string") {
              throw new TypeError('parameters.data.Call.eventType must be of type string');
            }

            if(parameters.data.Call.duration !== undefined) {
                if(typeof parameters.data.Call.duration !== "number"
                && typeof parameters.data.Call.duration !== "string") {
                  throw new TypeError('parameters.data.Call.duration must be of type number');
                }
            }

            if(parameters.data.Call.secure !== undefined) {
                if(typeof parameters.data.Call.secure !== "boolean") {
                  throw new TypeError('parameters.data.Call.secure must be of type boolean');
                }
            }
        }

        if(parameters.data.Location !== undefined) {
            if(typeof parameters.data.Location !== "object") {
              throw new TypeError('parameters.data.Location must be of type object');
            }

            if(parameters.data.Location.city !== undefined) {
                if(typeof parameters.data.Location.city !== "string") {
                  throw new TypeError('parameters.data.Location.city must be of type string');
                }
            }

            if(parameters.data.Location.name !== undefined) {
                if(typeof parameters.data.Location.name !== "string") {
                  throw new TypeError('parameters.data.Location.name must be of type string');
                }
            }

            if(parameters.data.Location.country !== undefined) {
                if(typeof parameters.data.Location.country !== "string") {
                  throw new TypeError('parameters.data.Location.country must be of type string');
                }
            }

            if(parameters.data.Location.altitude !== undefined) {
                if(typeof parameters.data.Location.altitude !== "string") {
                  throw new TypeError('parameters.data.Location.altitude must be of type string');
                }
            }

            if(typeof parameters.data.Location.longitude !== "string") {
              throw new TypeError('parameters.data.Location.longitude must be of type string');
            }

            if(parameters.data.Location.postalCode !== undefined) {
                if(typeof parameters.data.Location.postalCode !== "string") {
                  throw new TypeError('parameters.data.Location.postalCode must be of type string');
                }
            }

            if(parameters.data.Location.state !== undefined) {
                if(typeof parameters.data.Location.state !== "string") {
                  throw new TypeError('parameters.data.Location.state must be of type string');
                }
            }

            if(parameters.data.Location.street !== undefined) {
                if(typeof parameters.data.Location.street !== "string") {
                  throw new TypeError('parameters.data.Location.street must be of type string');
                }
            }

            if(parameters.data.Location.horizontalAccuracy !== undefined) {
                if(typeof parameters.data.Location.horizontalAccuracy !== "string") {
                  throw new TypeError('parameters.data.Location.horizontalAccuracy must be of type string');
                }
            }

            if(typeof parameters.data.Location.latitude !== "string") {
              throw new TypeError('parameters.data.Location.latitude must be of type string');
            }
        }

        if(parameters.data.File !== undefined) {
            if(typeof parameters.data.File !== "object") {
              throw new TypeError('parameters.data.File must be of type object');
            }

            if(parameters.data.File.suggestedFilename !== undefined) {
                if(typeof parameters.data.File.suggestedFilename !== "string") {
                  throw new TypeError('parameters.data.File.suggestedFilename must be of type string');
                }
            }

            if(typeof parameters.data.File.contentType !== "string") {
              throw new TypeError('parameters.data.File.contentType must be of type string');
            }
        }

        if(parameters.data.timed !== undefined) {
            if(typeof parameters.data.timed !== "number"
            && typeof parameters.data.timed !== "string") {
              throw new TypeError('parameters.data.timed must be of type number');
            }
        }

        if(parameters.data.Link !== undefined) {
            if(typeof parameters.data.Link !== "object") {
              throw new TypeError('parameters.data.Link must be of type object');
            }

            if(parameters.data.Link.url !== undefined) {
                if(typeof parameters.data.Link.url !== "string") {
                  throw new TypeError('parameters.data.Link.url must be of type string');
                }
            }

            if(parameters.data.Link.image !== undefined) {
                if(typeof parameters.data.Link.image !== "string") {
                  throw new TypeError('parameters.data.Link.image must be of type string');
                }
            }

            if(parameters.data.Link.name !== undefined) {
                if(typeof parameters.data.Link.name !== "string") {
                  throw new TypeError('parameters.data.Link.name must be of type string');
                }
            }

            if(parameters.data.Link.descr !== undefined) {
                if(typeof parameters.data.Link.descr !== "string") {
                  throw new TypeError('parameters.data.Link.descr must be of type string');
                }
            }

            if(typeof parameters.data.Link.title !== "string") {
              throw new TypeError('parameters.data.Link.title must be of type string');
            }
        }

        if(parameters.data.Calendar !== undefined) {
            if(typeof parameters.data.Calendar !== "object") {
              throw new TypeError('parameters.data.Calendar must be of type object');
            }

            if(parameters.data.Calendar.suggestedFilename !== undefined) {
                if(typeof parameters.data.Calendar.suggestedFilename !== "string") {
                  throw new TypeError('parameters.data.Calendar.suggestedFilename must be of type string');
                }
            }
        }

        if(parameters.data.GlympseRequest !== undefined) {
            if(typeof parameters.data.GlympseRequest !== "object") {
              throw new TypeError('parameters.data.GlympseRequest must be of type object');
            }

            if(typeof parameters.data.GlympseRequest.duration !== "number"
            && typeof parameters.data.GlympseRequest.duration !== "string") {
              throw new TypeError('parameters.data.GlympseRequest.duration must be of type number');
            }
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageSend';
  }

  updateList() {
    return [
      ["data", "Quote", "timestamp"],
      ["data", "Call", "duration"],
      ["data", "timed"],
      ["data", "GlympseRequest", "duration"]
    ];
  }
}

/**
 * This enumeration tells bbmcore what to do with the file referenced by 'file'.
 * For all other documentation, please see 'thumbPolicy'.
 */
ChatMessageSend.FilePolicy = Object.freeze({
    /**
     * See 'thumbPolicy'.
     */
    Copy: 'Copy',

    /**
     * See 'thumbPolicy'.
     */
    Move: 'Move',

    /**
     * See 'thumbPolicy'.
     */
    Delete: 'Delete'
});

/**
 * <p>Indicates the type of message.  Your application may include any arbitrary
 * value in the 'tag' field that is meaningful to it, with one exception:
 * bbmcore will <em>ignore</em> any 'chatMessageSend' from your application that
 * uses one of the reserved tags: 'Join', 'Leave', 'Subject', 'Gap', 'Shred',
 * 'Clear', 'Admin', or 'Remove'.</p>
 */
ChatMessageSend.Tag = Object.freeze({
    /**
     * The message contains a calendar. It must contain a 'file'. The 'content'
     * may contain plain text entered by the sender. 'data' must contain
     * 'Calendar'.
     */
    Calendar: 'Calendar',

    /**
     * The message contains a BBM call event. This tag contains no content.
     * 'data' must contain 'Call'.
     */
    Call: 'Call',

    /**
     * The message contains a contact card. It must contain a 'file'. The
     * 'content' may contain plain text entered by the sender. 'data' must
     * contain 'Contact'.
     */
    Contact: 'Contact',

    /**
     * The message contains a generic file. It must contain a 'file' or 'thumb'
     * or both. The 'content' may contain plain text entered by the sender.
     * 'data' must contain 'File'.
     */
    File: 'File',

    /**
     * The message contains an invitation to view a realtime location shared by
     * the sender and provided by Glympse. The 'content' may contain plain text
     * entered by the sender. 'data' must contain 'Glympse'.
     */
    Glympse: 'Glympse',

    /**
     * The message contains a request for a realtime location provided by
     * Glympse. The 'content' may contain plain text entered by the sender.
     * 'data' must contain 'GlympseRequest'.
     */
    GlympseRequest: 'GlympseRequest',

    /**
     * The sender is sharing a web link. The 'content' must contain a web link.
     * 'data' must contain 'Link'.
     */
    Link: 'Link',

    /**
     * The message contains a location. The 'content' may contain plain text
     * entered by the sender. 'data' must contain 'Location'.
     */
    Location: 'Location',

    /**
     * The message contains information on how to join a media conference.  The
     * 'content' may contain plain text entered by the sender.  The 'data' must
     * contain 'MediaConf'.
     */
    MediaConf: 'MediaConf',

    /**
     * The message contains an image. It must contain a 'file' or 'thumb' or
     * both. The 'content' may contain plain text entered by the sender. 'data'
     * must contain 'Picture'.
     */
    Picture: 'Picture',

    /**
     * The message contains quoted content that provides context to the plain
     * text entered by the sender in 'content'. 'data' must contain 'Quote'.
     */
    Quote: 'Quote',

    /**
     * The message contains a referenced BBM update that provides context to the
     * plain text entered by the sender in 'content'. 'data' must contain
     * 'ReferencedUpdate'.
     */
    ReferencedUpdate: 'ReferencedUpdate',

    /**
     * The sender has taken a screencap of the chat. The tag has no 'content'.
     */
    Screencap: 'Screencap',

    /**
     * The message contains a BBM sticker. This tag contains no content. 'data'
     * must contain 'Sticker'.
     */
    Sticker: 'Sticker',

    /**
     * The message contains plain text content.  This tag requires 'content'
     */
    Text: 'Text',

    /**
     * The message contains a voice note. It must contain a 'file'. The
     * 'content' may contain plain text entered by the sender. 'data' must
     * contain 'VoiceNote'.
     */
    VoiceNote: 'VoiceNote'
});

/**
 * This enumeration tells bbmcore what to do with the file referenced by
 * 'thumb'. If not provided a default of Copy is used. Note that in the case of
 * Delete and Move, bbmcore _will_ _not_ delete the source file if the request
 * was invalid to the point of being indecipherable, or if bbmcore lacks
 * permissions to delete the file (including when the source file is open and
 * the OS doesn't permit open files to be deleted).
 */
ChatMessageSend.ThumbPolicy = Object.freeze({
    /**
     * Leave the source file unmodified (and don't delete it).  Your application
     * retains ownership of the file.  The path in a resulting chatMessage
     * record will refer to the original source file.
     */
    Copy: 'Copy',

    /**
     * Move the source file to an internal location and retain it for the life
     * of the associated chatMessage entry.  The path in a resulting chatMessage
     * record will point to the moved file (which is owned by bbmcore).
     */
    Move: 'Move',

    /**
     * Delete the source file when bbmcore no longer requires it in order to
     * complete the operation.  The path in a resulting chatMessage record will
     * point to the moved file (which is owned by bbmcore and will be deleted).
     */
    Delete: 'Delete'
});

/**
 * class UserKeysImport
 * @classdesc
 * Request that bbmcore set one or more users' keys.
 *
 * Your application should try to include keys for as many users as possible in
 * a single 'userKeysImport' request (within BBMDS message size limits) for
 * greater efficiency.
 *
 * If no user with a given 'regId' exists, a new user is created with a
 * 'keyState' of 'Synced' and protection enabled.  If the import fails, no user
 * is created at all and no response is sent by bbmcore.
 *
 * If the user with a given 'regId' exists, the user's 'keyState' will be
 * changed to 'Synced' and protection will be enabled for the user.  If the
 * import fails, the user's 'keyState' will remain unchanged.
 *
 * To avoid event loops, your application must only react with 'userKeysImport'
 * to <em>changes</em> of a user's 'keyState' <em>to</em> 'Import'.  Your
 * application must not react to updates from bbmcore that indicate the
 * 'keyState' is 'Import' when the 'keyState' was already known to your
 * application to be 'Import'.  When your application first learns of a user
 * (such as after starting up) and their 'keyState' is 'Import', your
 * application should consider that a change and can react to it with
 * 'userKeysImport'.  In other words, your application must not import keys
 * unless the 'keyState' is actually changing or being learned for the first
 * time.  By following this rule, failed imports will not result in tight event
 * loops and will allow retries (at a minimum on application restart, but also
 * whenever bbmcore decides to toggle the state).
 *
 * Regardless of a user's 'keyState', if your application has external evidence
 * that the user has for some reason newly available or updated keys, your
 * application can use 'userKeysImport' to provide those keys, subject the event
 * reaction restrictions documented above.
 *
 * This message will be ignored by bbmcore if your application uses the
 * BlackBerry Key Management Service.
 */
class UserKeysImport extends Message {
  constructor(parameters) {
    if(typeof parameters.keys !== "object"
    || !Array.isArray(parameters.keys)) {
      throw new TypeError('parameters.keys must be of type array');
    }

    super(parameters);
    this.name = 'userKeysImport';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageStateGet
 * @classdesc
 * Your application sends this request to ask for the per-recipient message
 * delivery state  details for a particular message in a chat.  If bbmcore
 * accepts the request, it will respond with a 'chatMessageState'  response.
 */
class ChatMessageStateGet extends Message {
  constructor(parameters) {
    if(typeof parameters.messageId !== "string") {
      throw new TypeError('parameters.messageId must be of type string');
    }

    if(parameters.cookie !== undefined) {
        if(typeof parameters.cookie !== "string") {
          throw new TypeError('parameters.cookie must be of type string');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageStateGet';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class StatsCommitted
 * @classdesc
 * Your application sends this message to indicate two things:<ol><li>Your
 * application has taken custodianship of the most recently fetched 'stat' list
 * values.  Your application did (or will) record them in its reporting
 * system.</li><li>Those previously reported 'stat' values must no longer be
 * included in future fetches of the 'stat' list.  In other words, it resets the
 * counters, but does so without losing the stats collected since the last
 * 'stat' list fetch.</li></ol>
 *
 * See the 'stat' list for a detailed explanation how to use this message.
 *
 * Note that 'statsCommitted' always applies to the most recently fetched 'stat'
 * list values.  If no 'stat' list values have ever been fetched, this has no
 * effect.
 *
 * There is no reply to this message.
 */
class StatsCommitted extends Message {
  constructor(parameters) {


    super(parameters);
    this.name = 'statsCommitted';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ParticipantPromote
 * @classdesc
 * <p>Promote the given participant to be an admin of the specified chat.  The
 * change will be reflected locally immediately via a change to the participant,
 * and a request will be initiated to the BlackBerry Infrastructure to effect
 * the promotion.  Once complete, a 'chatMessage' will be posted to the chat
 * indicating that the local user has promoted the participant.</p><p>This
 * request is ignored if:</p><ul><li>the chat is a one-to-one chat,
 * or</li><li>the local user is not an admin of the chat, or</li><li>the chat's
 * 'state' is not 'Ready'.</li></ul><only for='bbm'><p>This request applies only
 * to non-legacy chats.</p></only>
 */
class ParticipantPromote extends Message {
  constructor(parameters) {
    if(typeof parameters.userUri !== "string") {
      throw new TypeError('parameters.userUri must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'participantPromote';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageRead
 * @classdesc
 * Your application sends this message to bbmcore to notify it that incoming
 * messages have been read by the local user.  All unread incoming messages in
 * the chat with a 'messageId' less than or equal to that of the specified
 * 'messageId' will be marked as read.
 *
 * Note that when a chat's 'numUnread' field is zero, then 'chatMessageRead'
 * will have no effect on that chat because that means the chat has no unread
 * incoming messages.
 */
class ChatMessageRead extends Message {
  constructor(parameters) {
    if(typeof parameters.messageId !== "string") {
      throw new TypeError('parameters.messageId must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageRead';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatTyping
 * @classdesc
 * Your application sends this to bbmcore when it considers the user to have
 * started typing in a chat.  This event will be relayed in real-time to other
 * participants of the chat.
 *
 * Received typing events are reported to receivers via the 'typing' list.  On
 * the receiving endpoints, the typing state of a user automatically decays back
 * to "not typing" after a short delay or when a message from them is added to
 * the chat's history.  There is no need for your application to inform bbmcore
 * when a user stops typing.
 *
 * In certain conditions, bbmcore may not actually transmit the typing
 * notification to the other participants of the chat.  These conditions include
 * when there are no previous messages in the chat (on the local endpoint) or
 * when the previous messages in the chat are older than five minutes.
 * Filtering the events in this way helps optimize message transmission for
 * cases where it is very unlikely that the other participants are expected to
 * read a typing indicator on their endpoints.
 *
 * It is recommended that your application wait a short delay after the
 * commencement of typing before issuing this request.  Short messages can often
 * be typed in a few seconds, and it is often better to simply send the message
 * itself instead of a typing notification followed by the message in very short
 * succession.
 */
class ChatTyping extends Message {
  constructor(parameters) {
    if(parameters.tag !== undefined) {
        if(typeof parameters.tag !== "string") {
          throw new TypeError('parameters.tag must be of type string');
        }
    }

    if(parameters.messageId !== undefined) {
        if(typeof parameters.messageId !== "string") {
          throw new TypeError('parameters.messageId must be of type string');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatTyping';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageDestroy
 * @classdesc
 * <p>Request that one or many 'chatMessage' entries previously sent by the
 * local user's identity be recalled and destroyed from:</p><ul><li>the local
 * endpoint,</li><li>other endpoints of the local user's identity,</li><li>all
 * endpoints of all other participants of the chat, and</li><li>the BlackBerry
 * Infrastructure.</li></ul><p>An outgoing message can be destroyed regardless
 * of its delivery state, except that requests to destroy a 'chatMessage' in
 * 'state' 'Failed' will be ignored.</p><p>The 'chatMessage' 'recall' state will
 * be updated to reflect the state of the process on the sender endpoint and all
 * recipients' endpoints.  There is no guarantee that the recipients have not
 * read the message prior to it being destroyed.</p>
 */
class ChatMessageDestroy extends Message {
  constructor(parameters) {
    if(parameters.messageId !== undefined) {
        if(typeof parameters.messageId !== "string") {
          throw new TypeError('parameters.messageId must be of type string');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageDestroy';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class Wipe
 * @classdesc
 * Request that bbmcore forget all information associated with the current Spark
 * Communications identity by deleting all data and stopping, thus triggering a
 * required BBMDS resync by your application (as is necessary on all BBMDS
 * reconnects).
 */
class Wipe extends Message {
  constructor(parameters) {


    super(parameters);
    this.name = 'wipe';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatEventSend
 * @classdesc
 * With this request, your application asks bbmcore to send a chat event to all
 * participants of an existing chat.  The chat event will not be stored
 * persistently in the chat mailbox for later delivery and will be sent only to
 * the endpoints of chat participants that are currently connected to the
 * BlackBerry Infrastructure.  Chat events are either sent immediately or they
 * fail immediately, and they do not interact with the flow or queue of other
 * outgoing messages within a chat.  Endpoints that are not connected when this
 * message is sent will never receive a copy of this message.  There is no
 * mechanism to tell if a chat event is delivered to any or all chat
 * participants.
 *
 * These properties make chat events cheaper in terms of storage and network
 * usage than messages sent with 'chatMessageSend'.
 *
 * The local user's other connected endpoints can and will receive their own
 * identity's chat events.  This endpoint will never receive its own chat
 * events.
 *
 * This mechanism is useful in cases where applications want to send frequent,
 * timely information to all participants that has no value other than in the
 * moment.  For example, an application might want to send live location
 * information from one or more participants to all other participants.
 */
class ChatEventSend extends Message {
  constructor(parameters) {
    if(typeof parameters.tag !== "string") {
      throw new TypeError('parameters.tag must be of type string');
    }

    if(parameters.data !== undefined) {
        if(typeof parameters.data !== "object") {
          throw new TypeError('parameters.data must be of type object');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatEventSend';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class IdentitiesGet
 * @classdesc
 * Requests that the given list of identities, either application user ids or
 * Spark Communications regIds, be resolved to find the associated  identity
 * information, and returned via an 'identities' message.
 *
 * Identities for which identity information cannot be found are omitted  from
 * the results.
 *
 * Overlapping 'identitiesGet' requests are issued in parallel.  Issuing too
 * many parallel requests at once can exceed system limits and cause those
 * requests to fail.
 */
class IdentitiesGet extends Message {
  constructor(parameters) {
    if(parameters.appUserIds !== undefined) {
        if(typeof parameters.appUserIds !== "object"
        || !Array.isArray(parameters.appUserIds)) {
          throw new TypeError('parameters.appUserIds must be of type array');
        }
    }

    if(parameters.regIds !== undefined) {
        if(typeof parameters.regIds !== "object"
        || !Array.isArray(parameters.regIds)) {
          throw new TypeError('parameters.regIds must be of type array');
        }
    }

    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    super(parameters);
    this.name = 'identitiesGet';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class Search
 * @classdesc
 * Search bbmcore's local data.  <only for='bbm'><p>First, this will search
 * chats and legacy conversations with one or more participants whose display
 * name contains the search text.</p></only>This will search for chats <only
 * for='bbm'>and legacy conversations</only> that contain messages that contain
 * the search 'text'.
 *
 * Your application will receive a 'searchResult' in response.
 */
class Search extends Message {
  constructor(parameters) {
    if(typeof parameters.text !== "string") {
      throw new TypeError('parameters.text must be of type string');
    }

    if(parameters.suggestedMaxResults !== undefined) {
        if(typeof parameters.suggestedMaxResults !== "number"
        && typeof parameters.suggestedMaxResults !== "string") {
          throw new TypeError('parameters.suggestedMaxResults must be of type number');
        }
    }

    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    if(parameters.returnIdentifier !== undefined) {
        if(typeof parameters.returnIdentifier !== "boolean") {
          throw new TypeError('parameters.returnIdentifier must be of type boolean');
        }
    }

    super(parameters);
    this.name = 'search';
  }

  updateList() {
    return [
      ["suggestedMaxResults"]
    ];
  }
}

/**
 * class EndpointDeregister
 * @classdesc
 * Requests that bbmcore de-register the identified endpoint.  This will
 * forward the de-register request to the BlackBerry Infrastructure, and result
 * in an  'endpointDeregisterResult' with the given cookie from bbmcore.
 *
 * De-registering an endpoint will revoke its registration on the BlackBerry
 * Infrastructure  and remove it from the Spark Communications identity's list
 * of registered endpoints.  If currently connected to the BlackBerry
 * Infrastructure, it will be  disconnected as soon as possible and wiped.
 */
class EndpointDeregister extends Message {
  constructor(parameters) {
    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    if(typeof parameters.endpointId !== "string") {
      throw new TypeError('parameters.endpointId must be of type string');
    }

    super(parameters);
    this.name = 'endpointDeregister';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class SetupRetry
 * @classdesc
 * Requests that bbmcore restart setup after a previous setup attempt was
 * stopped.
 *
 *  If the current 'setupState' 'state' global is 'DeviceSwitchRequired', this
 * will move the user's profile from the user's other device to this one.
 *
 *  If the current 'setupState' 'state' global is 'Full', this will register and
 * add the current endpoint to any existing endpoints.
 *
 * This message will be ignored for any other 'setupState' 'state'.
 */
class SetupRetry extends Message {
  constructor(parameters) {


    super(parameters);
    this.name = 'setupRetry';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageDetach
 * @classdesc
 * Request that bbmcore remove the 'file' and/or 'thumb' attachments
 * <em>locally</em> for a single 'chatMessage'.  This message does not change
 * the 'chatMessage' for any other endpoints or identities.
 */
class ChatMessageDetach extends Message {
  constructor(parameters) {
    if(parameters.detachFile !== undefined) {
        if(typeof parameters.detachFile !== "boolean") {
          throw new TypeError('parameters.detachFile must be of type boolean');
        }
    }

    if(typeof parameters.messageId !== "string") {
      throw new TypeError('parameters.messageId must be of type string');
    }

    if(parameters.detachThumb !== undefined) {
        if(typeof parameters.detachThumb !== "boolean") {
          throw new TypeError('parameters.detachThumb must be of type boolean');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageDetach';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class RetryServerRequests
 * @classdesc
 * The purpose of this message is to provide bbmcore with a series of user-
 * driven events to drive its internal retry logic, such as retrying failed
 * BlackBerry Infrastructure requests.  Your application must determine the best
 * event(s) to use to drive this logic. In the optimum case, your application
 * will use this message whenever your application goes from being 'not on the
 * screen' to being 'on the screen'. This transition event is considered to be a
 * good representation of the user becoming interested in interacting with Spark
 * Communications Services again, and thus a good event to use as a user-driver
 * retry trigger. However, your application may choose to report only when
 * specific screens transition to be 'on the screen', or tie this trigger to an
 * explicit user action such as a 'Refresh' button.
 *
 * Your application does not need to "rate limit" or otherwise filter
 * 'retryServerRequests' messages.
 */
class RetryServerRequests extends Message {
  constructor(parameters) {


    super(parameters);
    this.name = 'retryServerRequests';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class EndpointsGet
 * @classdesc
 * Requests that bbmcore retrieve all of the Spark Communications identity's
 * registered  endpoints and reply with an 'endpoints' message.
 *
 * Endpoints are individual application installations associated to the same
 * Spark Communications identity.  Such an identity can have zero or more
 * endpoints, with a  maximum enforced by the BlackBerry Infrastructure.
 */
class EndpointsGet extends Message {
  constructor(parameters) {
    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    super(parameters);
    this.name = 'endpointsGet';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ProfileKeysExport
 * @classdesc
 * Request that bbmcore return the identity keys that are being used by the
 * local user.  This will trigger a 'profileKeys' response.
 *
 * To avoid event loops, your application must only react with
 * 'profileKeysExport' (or 'profileKeysImport') to <em>changes</em> of the
 * 'profileKeysState' <em>to</em> 'NotSynced'.  Your application must not react
 * to updates from bbmcore that indicate the 'profileKeysState' is 'NotSynced'
 * when the 'profileKeysState' was already known to your application to be
 * 'NotSynced'.  In other words, your application must not export keys unless
 * the 'profileKeysState' is actually changing or being learned for the first
 * time.  By following this rule, failed exports will not result in tight event
 * loops and will allow retries (at a minimum on application restart, but also
 * whenever bbmcore decides to toggle the state).
 *
 * The 'profileKeysState' global is not updated in response to this message, and
 * thus must be set to 'Synced' via a 'requestListChange' once the key is
 * successfully stored externally.
 *
 * This message will be ignored by bbmcore if your application uses the
 * BlackBerry Key Management Service.
 */
class ProfileKeysExport extends Message {
  constructor(parameters) {


    super(parameters);
    this.name = 'profileKeysExport';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatLeave
 * @classdesc
 * This will first hide the chat (see 'chatHide'), and then begin the process of
 * leaving the chat, eventually resulting in bbmcore deleting all local data
 * related to the chat, notifying the other participants of our departure, and
 * removal of the chat from the 'chat' list.  A chat that is being left will not
 * gain any additional incoming or outgoing messages.
 */
class ChatLeave extends Message {
  constructor(parameters) {
    if(typeof parameters.chatIds !== "object"
    || !Array.isArray(parameters.chatIds)) {
      throw new TypeError('parameters.chatIds must be of type array');
    }

    super(parameters);
    this.name = 'chatLeave';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageDelete
 * @classdesc
 * Your application sends this message to bbmcore to request that a chat
 * message be deleted for all the endpoints of the user's identity.  Any content
 * or foreign keys for the deleted message are removed.  Both incoming and
 * outgoing messages may be deleted.  If a message that matches the given chatId
 * and message id  is found, bbmcore will respond with an update for the
 * message.
 */
class ChatMessageDelete extends Message {
  constructor(parameters) {
    if(typeof parameters.id !== "string") {
      throw new TypeError('parameters.id must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageDelete';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class SyncPasscodeChange
 * @classdesc
 * Applications that use the BlackBerry Key Management Service (KMS) send this
 * message to bbmcore on an endpoint that has completed setup in order to change
 * the passcode that must be provided by 'syncStart' on new endpoints.
 *
 * This message uses information already known to this endpoint to protect the
 * existing sync data in KMS with the new 'passcode'.  The old passcode is not
 * required and will not be checked.  Because of this, applications can let
 * users change the sync passcode without knowing the current sync passcode.  In
 * all circumstances, applications should take steps to re-confirm the identity
 * of the user with a relevant credentials challenge before issuing this request
 * to bbmcore.
 *
 * The result of this action is reported by 'syncPasscodeChangeResult'.
 * Applications must not issue overlapping requests.
 *
 * This action does not deregister existing endpoints (unlike 'syncStart' with
 * 'action' 'New').
 *
 * It is an error to send a 'syncPasscodeChange' request when your application
 * isn't using the BlackBerry Key Management Service or when setup hasn't yet
 * completed.
 */
class SyncPasscodeChange extends Message {
  constructor(parameters) {
    if(typeof parameters.passcode !== "string") {
      throw new TypeError('parameters.passcode must be of type string');
    }

    super(parameters);
    this.name = 'syncPasscodeChange';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ProfileKeysImport
 * @classdesc
 * Request that bbmcore set the profile keys.
 *
 * If the profile's keys are imported successfully, the 'profileKeysState'
 * global will be updated to 'Synced'.  If the import fails, the
 * 'profileKeyState' will remain unchanged.
 *
 * To avoid event loops, your application must only react with
 * 'profileKeysImport' (or 'profileKeysExport') to <em>changes</em> of the
 * 'profileKeysState' <em>to</em> 'NotSynced'.  Your application must not react
 * to updates from bbmcore that indicate the 'profileKeysState' is 'NotSynced'
 * when the 'profileKeysState' was already known to your application to be
 * 'NotSynced'.  In other words, your application must not import keys unless
 * the 'profileKeysState' is actually changing or being learned for the first
 * time.  By following this rule, failed imports will not result in tight event
 * loops and will allow retries (at a minimum on application restart, but also
 * whenever bbmcore decides to toggle the state).
 *
 * Regardless of the 'profileKeysState', if your application has external
 * evidence that the user has for some reason newly available or updated keys,
 * your application can use 'profileKeysImport' to provide those keys, subject
 * the event reaction restrictions documented above.
 *
 * This message will be ignored by bbmcore if your application uses the
 * BlackBerry Key Management Service.
 */
class ProfileKeysImport extends Message {
  constructor(parameters) {
    if(typeof parameters.publicKeys !== "object") {
      throw new TypeError('parameters.publicKeys must be of type object');
    }

    if(typeof parameters.publicKeys.encryption !== "string") {
      throw new TypeError('parameters.publicKeys.encryption must be of type string');
    }

    if(typeof parameters.publicKeys.signing !== "string") {
      throw new TypeError('parameters.publicKeys.signing must be of type string');
    }

    if(typeof parameters.privateKeys !== "object") {
      throw new TypeError('parameters.privateKeys must be of type object');
    }

    if(typeof parameters.privateKeys.encryption !== "string") {
      throw new TypeError('parameters.privateKeys.encryption must be of type string');
    }

    if(typeof parameters.privateKeys.signing !== "string") {
      throw new TypeError('parameters.privateKeys.signing must be of type string');
    }

    super(parameters);
    this.name = 'profileKeysImport';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatHide
 * @classdesc
 * Your application sends this message to bbmcore to mark a chat as hidden.
 * bbmcore will automatically un-hide the chat the next time a message is added
 * to its history.
 *
 * For a chat that can never become unhidden (such as some chats in the
 * 'Defunct' state), bbmcore will treat a 'chatHide' action as if it were
 * 'chatLeave' to ensure the chat does not linger, forever invisible to the
 * user.
 */
class ChatHide extends Message {
  constructor(parameters) {
    if(typeof parameters.chatIds !== "object"
    || !Array.isArray(parameters.chatIds)) {
      throw new TypeError('parameters.chatIds must be of type array');
    }

    super(parameters);
    this.name = 'chatHide';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class AuthToken
 * @classdesc
 * Your application uses this message to provide bbmcore with an updated
 * authToken value.  See the 'authTokenState' global for more information on
 * when to use this message.
 *
 * This message also will trigger setup when it has not yet been started within
 * bbmcore and bbmcore is waiting for the initial (or subsequent) authToken
 * value.  See the documentation for the 'setupState' 'NotRequested' enumeration
 * for more information on how setup proceeds after being started by
 * 'authToken'.
 */
class AuthToken extends Message {
  constructor(parameters) {
    if(typeof parameters.authToken !== "string") {
      throw new TypeError('parameters.authToken must be of type string');
    }

    if(typeof parameters.userId !== "string") {
      throw new TypeError('parameters.userId must be of type string');
    }

    super(parameters);
    this.name = 'authToken';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class RequestPin
 * @classdesc
 * Sent by your application to bbmcore to request the currently registered
 * device  PINs for the given regIds.  This always triggers a BlackBerry
 * Infrastructure request;  bbmcore never considers its local list of users.
 * Your application should  first consult the user list to see if bbmcore
 * already knows a PIN for  a regId.
 *
 * The result is returned via a pinResult message.
 */
class RequestPin extends Message {
  constructor(parameters) {
    if(typeof parameters.regIds !== "object"
    || !Array.isArray(parameters.regIds)) {
      throw new TypeError('parameters.regIds must be of type array');
    }

    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    super(parameters);
    this.name = 'requestPin';
  }

  updateList() {
    return [
      ["regIds"]
    ];
  }
}

/**
 * class SyncStart
 * @classdesc
 * <only for='bbm'><p>Send this message to bbmcore when the 'setupState' global
 * is in 'state' 'SyncRequired' to proceed with setup.  This message provides
 * bbmcore with the passcode needed to initiate a sync with the existing
 * endpoint(s) for this Spark Communications identity.</p><ul><li>On success,
 * the 'setupState' global will move to 'state' 'SyncStarted'.</li><li>Any
 * failures will cause the 'setupState' global to remain or move back to 'state'
 * 'SyncRequired' and a 'syncError' response will be sent by bbmcore indicating
 * the reason for the error.</li></ul></only><only for='sdk'><p>This message is
 * only used by applications that use the BlackBerry Key Management Service
 * (KMS).  When the 'setupState' is 'SyncRequired', your application must
 * examine the 'syncPasscodeState' global.</p><ul><li>If the 'syncPasscodeState'
 * is 'None', then your application must wait until 'syncPasscodeState' changes
 * to another value.</li><li>If the 'syncPasscodeState' is 'New', then bbmcore
 * has not found any existing sync data in KMS for this identity and it must
 * create new sync data.  Your application must send 'syncStart' with an
 * 'action' of 'New' and supply the 'passcode' that will be used to protect and
 * upload the new sync data to KMS.</li><li>If the 'syncPasscodeState' is
 * 'Existing', then bbmcore has found existing sync data in the KMS and your
 * application must do one of the following.<ol><li>Your application can send
 * 'syncStart' with an 'action' of 'Existing' to supply a 'passcode' to use when
 * unprotecting the existing sync data.  The 'setupState' will move to 'state'
 * 'SyncStarted' during the attempt.<ul><li>If the attempt to unprotect the sync
 * data works, endpoint sync has finished and the 'setupState' will move to
 * 'state' 'Ongoing'.</li><li>If the attempt doesn't work, 'setupState' will
 * move back to 'state' 'SyncRequired' and a 'syncError' response will be sent
 * by bbmcore indicating the reason for the error.  Your application can take
 * one of these actions again.</li></li></ul><li>Your application can send
 * 'syncStart' with an 'action' of 'New' to delete all existing sync data from
 * KMS and start again with newly generated sync data protected by the new
 * 'passcode'.  In response, bbmcore will move the 'setupState' to 'state'
 * 'SyncStarted'.  All other endpoints will be automatically deregistered and
 * will have to go through setup again during which they will have to provide
 * the new 'passcode' value (as an 'Existing' action).<ul><li>If successful, the
 * 'setupState' will move to 'state' 'Ongoing'.</li><li>If unsuccessful, the
 * 'setupState' will return to 'state' 'SyncRequired' and a 'syncError' response
 * will be sent by bbmcore indicating the reason for the
 * error.</li></ul></li></ol></li></ul></only>
 */
class SyncStart extends Message {
  constructor(parameters) {
    if(typeof parameters.passcode !== "string") {
      throw new TypeError('parameters.passcode must be of type string');
    }

    if(parameters.action !== undefined) {
        if(typeof parameters.action !== "string") {
          throw new TypeError('parameters.action must be of type string');
        }
    }

    super(parameters);
    this.name = 'syncStart';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * <p>This field is ignored by bbmcore unless your application uses the
 * BlackBerry Key Management Service.</p><p>This controls whether the passcode
 * is being used to try to unprotect existing keys or to protect new keys.  See
 * the message description for more information.</p>
 */
SyncStart.Action = Object.freeze({
    /**
     * Use the 'passcode' to protect and export new sync data.  Any existing
     * sync data will be deleted and all other endpoints will be deregistered.
     */
    New: 'New',

    /**
     * Valid only when 'syncPasscodeState' is 'Existing'.  Try to use the
     * 'passcode' to unprotect and import the existing sync data.
     */
    Existing: 'Existing'
});

/**
 * class ParticipantDemote
 * @classdesc
 * <p>Demote the given participant to no longer be an admin of the specified
 * chat.  The change will be reflected locally immediately via a change to the
 * participant, and a request will be initiated to the BlackBerry Infrastructure
 * to effect the demotion.  Once complete, a 'chatMessage' will be posted to the
 * chat indicating that the local user has demoted the participant.</p><p>This
 * request is ignored if:</p><ul><li>the chat is a one-to-one chat,
 * or</li><li>the local user is not an admin of the chat, or</li><li>the chat's
 * 'state' is not 'Ready'.</li></ul><only for='bbm'><p>This request applies only
 * to non-legacy chats.</p></only>
 */
class ParticipantDemote extends Message {
  constructor(parameters) {
    if(typeof parameters.userUri !== "string") {
      throw new TypeError('parameters.userUri must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'participantDemote';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatMessageFileDownload
 * @classdesc
 * Request that bbmcore start downloading a file attachment for a single
 * 'chatMessage'.
 */
class ChatMessageFileDownload extends Message {
  constructor(parameters) {
    if(typeof parameters.messageId !== "string") {
      throw new TypeError('parameters.messageId must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatMessageFileDownload';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ParticipantRemove
 * @classdesc
 * <p>Remove the given participant from the specified chat.  The change will be
 * reflected locally immediately via a change to the participant, and a request
 * will be initiated to the BlackBerry Infrastructure to effect the removal.
 * Once complete, a 'chatMessage' will be posted to the chat indicating that the
 * local user has removed the participant.</p><p>This request is ignored
 * if:</p><ul><li>the chat is a one-to-one chat, or</li><li>the local user is
 * not an admin of the chat, or</li><li>the chat's 'state' is not
 * 'Ready'.</li></ul><only for='bbm'><p>This request applies only to non-legacy
 * chats.</p></only><p>Removing a participant does not remove any messages they
 * have posted in the chat.</p>
 */
class ParticipantRemove extends Message {
  constructor(parameters) {
    if(typeof parameters.userUri !== "string") {
      throw new TypeError('parameters.userUri must be of type string');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'participantRemove';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatInvite
 * @classdesc
 * <p>Send this message to bbmcore to invite one or more participants to an
 * existing chat <em>or</em> resend existing chat invitations to invitees that
 * have not yet joined.</p><only for='bbm'><p>Bbmcore can perform key exchanges
 * with invitees before inviting them.</p></only>
 */
class ChatInvite extends Message {
  constructor(parameters) {
    if(typeof parameters.invitees !== "object"
    || !Array.isArray(parameters.invitees)) {
      throw new TypeError('parameters.invitees must be of type array');
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatInvite';
  }

  updateList() {
    return [
      ["invitees", "regId"]
    ];
  }
}

/**
 * class ChatParticipantTimesGet
 * @classdesc
 * Your application sends this request to ask for the message delivery time
 * details for a particular participant in a chat.  If bbmcore  accepts the
 * request, it will respond with a 'chatParticipantTimes'  response.
 */
class ChatParticipantTimesGet extends Message {
  constructor(parameters) {
    if(parameters.cookie !== undefined) {
        if(typeof parameters.cookie !== "string") {
          throw new TypeError('parameters.cookie must be of type string');
        }
    }

    if(parameters.userUri !== undefined) {
        if(typeof parameters.userUri !== "string") {
          throw new TypeError('parameters.userUri must be of type string');
        }
    }

    if(typeof parameters.chatId !== "string") {
      throw new TypeError('parameters.chatId must be of type string');
    }

    super(parameters);
    this.name = 'chatParticipantTimesGet';
  }

  updateList() {
    return [

    ];
  }
}

/**
 * class ChatStart
 * @classdesc
 * This message requests that a new chat be started.  When successful, a
 * 'listAdd' will be emitted for the new 'chat' element.  Otherwise, bbmcore
 * will respond with a 'chatStartFailed' message.
 *
 * If 'isOneToOne' is true and a 1:1 <only for='bbm'>enterprise</only> chat
 * already exists for the invitee, bbmcore will respond with a 'chatStartFailed'
 * with a reason of 'AlreadyExists' and the 'chatId' of that existing chat.
 */
class ChatStart extends Message {
  constructor(parameters) {
    if(parameters.privateData !== undefined) {
        if(typeof parameters.privateData !== "object") {
          throw new TypeError('parameters.privateData must be of type object');
        }
    }

    if(parameters.isOneToOne !== undefined) {
        if(typeof parameters.isOneToOne !== "boolean") {
          throw new TypeError('parameters.isOneToOne must be of type boolean');
        }
    }

    if(typeof parameters.cookie !== "string") {
      throw new TypeError('parameters.cookie must be of type string');
    }

    if(parameters.localData !== undefined) {
        if(typeof parameters.localData !== "object") {
          throw new TypeError('parameters.localData must be of type object');
        }
    }

    if(typeof parameters.invitees !== "object"
    || !Array.isArray(parameters.invitees)) {
      throw new TypeError('parameters.invitees must be of type array');
    }

    if(parameters.data !== undefined) {
        if(typeof parameters.data !== "object") {
          throw new TypeError('parameters.data must be of type object');
        }
    }

    if(parameters.invitePolicy !== undefined) {
        if(typeof parameters.invitePolicy !== "string") {
          throw new TypeError('parameters.invitePolicy must be of type string');
        }
    }

    if(parameters.subject !== undefined) {
        if(typeof parameters.subject !== "string") {
          throw new TypeError('parameters.subject must be of type string');
        }
    }

    super(parameters);
    this.name = 'chatStart';
  }

  updateList() {
    return [
      ["invitees", "regId"]
    ];
  }
}

/**
 * The policy that controls who may invite participants to the chat.  This only
 * applies when the 'isOneToOne' field is absent or false.
 */
ChatStart.InvitePolicy = Object.freeze({
    /**
     * Only chat admins may invite participants to the chat.
     */
    AdminsOnly: 'AdminsOnly',

    /**
     * Only chat participants may invite participants to the chat.
     */
    ParticipantsOnly: 'ParticipantsOnly'
});

/**
 * Export all symbols.
 */
module.exports = {
  ChatKeyExport: ChatKeyExport,
  EndpointUpdate: EndpointUpdate,
  ChatKeysImport: ChatKeysImport,
  ChatMessageSend: ChatMessageSend,
  UserKeysImport: UserKeysImport,
  ChatMessageStateGet: ChatMessageStateGet,
  StatsCommitted: StatsCommitted,
  ParticipantPromote: ParticipantPromote,
  ChatMessageRead: ChatMessageRead,
  ChatTyping: ChatTyping,
  ChatMessageDestroy: ChatMessageDestroy,
  Wipe: Wipe,
  ChatEventSend: ChatEventSend,
  IdentitiesGet: IdentitiesGet,
  Search: Search,
  EndpointDeregister: EndpointDeregister,
  SetupRetry: SetupRetry,
  ChatMessageDetach: ChatMessageDetach,
  RetryServerRequests: RetryServerRequests,
  EndpointsGet: EndpointsGet,
  ProfileKeysExport: ProfileKeysExport,
  ChatLeave: ChatLeave,
  ChatMessageDelete: ChatMessageDelete,
  SyncPasscodeChange: SyncPasscodeChange,
  ProfileKeysImport: ProfileKeysImport,
  ChatHide: ChatHide,
  AuthToken: AuthToken,
  RequestPin: RequestPin,
  SyncStart: SyncStart,
  ParticipantDemote: ParticipantDemote,
  ChatMessageFileDownload: ChatMessageFileDownload,
  ParticipantRemove: ParticipantRemove,
  ChatInvite: ChatInvite,
  ChatParticipantTimesGet: ChatParticipantTimesGet,
  ChatStart: ChatStart
};
