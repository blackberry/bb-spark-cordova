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
  ChatMessageSend: Object.freeze({
    /**
     * This enumeration tells bbmcore what to do with the file referenced by
     * 'file'. For all other documentation, please see 'thumbPolicy'.
     */
    FilePolicy: Object.freeze({
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
    }),
    /**
     * <p>Indicates the type of message.  Your application may include any
     * arbitrary value in the 'tag' field that is meaningful to it, with one
     * exception: bbmcore will <em>ignore</em> any 'chatMessageSend' from your
     * application that uses one of the reserved tags: 'Join', 'Leave',
     * 'Subject', 'Gap', 'Shred', 'Clear', 'Admin', or 'Remove'.</p>
     */
    Tag: Object.freeze({
      /**
       * The message contains plain text content.  This tag requires 'content'
       */
      Text: 'Text'
    }),
    /**
     * This enumeration tells bbmcore what to do with the file referenced by
     * 'thumb'. If not provided a default of Copy is used. Note that in the case
     * of Delete and Move, bbmcore _will_ _not_ delete the source file if the
     * request was invalid to the point of being indecipherable, or if bbmcore
     * lacks permissions to delete the file (including when the source file is
     * open and the OS doesn't permit open files to be deleted).
     */
    ThumbPolicy: Object.freeze({
      /**
       * Leave the source file unmodified (and don't delete it).  Your
       * application retains ownership of the file.  The path in a resulting
       * chatMessage record will refer to the original source file.
       */
      Copy: 'Copy',

      /**
       * Move the source file to an internal location and retain it for the life
       * of the associated chatMessage entry.  The path in a resulting
       * chatMessage record will point to the moved file (which is owned by
       * bbmcore).
       */
      Move: 'Move',

      /**
       * Delete the source file when bbmcore no longer requires it in order to
       * complete the operation.  The path in a resulting chatMessage record
       * will point to the moved file (which is owned by bbmcore and will be
       * deleted).
       */
      Delete: 'Delete'
    })
  }),
  SyncStart: Object.freeze({
    /**
     * <p>This field is ignored by bbmcore unless your application uses the
     * BlackBerry Key Management Service.</p><p>This controls whether the
     * passcode is being used to try to unprotect existing keys or to protect
     * new keys.  See the message description for more information.</p>
     */
    Action: Object.freeze({
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
    })
  }),
  ChatStart: Object.freeze({
    /**
     * The policy that controls who may invite participants to the chat.  This
     * only applies when the 'isOneToOne' field is absent or false.
     */
    InvitePolicy: Object.freeze({
      /**
       * Only chat admins may invite participants to the chat.
       */
      AdminsOnly: 'AdminsOnly',

      /**
       * Only chat participants may invite participants to the chat.
       */
      ParticipantsOnly: 'ParticipantsOnly'
    })
  })
};
