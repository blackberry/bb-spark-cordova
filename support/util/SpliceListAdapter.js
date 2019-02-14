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

/**
 * A handler which receives list-type updates, and transforms them into calls
 * to a function with the signature of Array.splice. The actual function to
 * call is supplied by the caller.
 *
 * TODO - support sorted lists. The _updater can run more efficiently if the
 * list is known to be sorted, plus being sorted is just desirable for some
 * lists.
 *
 * @param {function} splice A function which has the signature of Array.splice.
 *                          This is the mechanism by which the SpliceListAdapter
 *                          will update the underlying list.
 * @param {function} getElement A function which takes an index into the list
 *                              and returns the element. This is used to compare
 *                              existing elements to new elements in cases where
 *                              the set of elements is to be merged.
 * @param {function} getLength A function which returns the number of elements
 *                             currently in the list. It is guaranteed that
 *                             getElement will not attempt to retrieve an
 *                             element outside of this limit.
 * @param {Observable} [observable] The observable to listen to. If unspecified,
 *                                  no observable will be listened to, and no
 *                                  updates will occur until setObservable is
 *                                  called.
 */
class SpliceListAdapter {
  constructor(splice, getElement, getLength, observable)
  {
    // Remember how to work with the list.
    this._splice = splice;
    this._getElement = getElement;
    this._getLength = getLength;
    this._boundUpdater = this._updater.bind(this);

    // Remember any pending updates. This is to handle updates from the SDK
    // that come as multiple messages.
    this._pendingUpdate = undefined;

    // Whether the pending update is a listAll. If false when there is a pending
    // update, then it's a listElements.
    this._pendingAll = false;

    // Having an observable is optional. It may be set later, or unset later.
    if(observable) {
      this._observable = observable;
      this._start();
    }
  }

  /**
   * Set the observable whose list events will be transformed into splices.
   *
   * @param {Observable} [observable] The observable to listen to. May be
   *                                  undefined to stop listening to any
   *                                  observable.
   *
   */
  setObservable(observable) {
    if(this._observable) {
      this._stop();
    }

    this._observable = observable;
    if(this._observable) {
      this._start();
    }
  }

  /**
   * A function to handle updates from the observable, and generate splices in
   * response.
   *
   * @param {ListEvent} e An event from the SDK.
   *
   * @internal
   */
  _updater(e) {
    if (e.listAdd) {
      const newItems = e.listAdd.elements;
      if (newItems && newItems.length > 0) {
        this._splice(this._getLength(), 0, ...newItems);
      }
    }
    else if (e.listElements) {
      this._pendingAll = false;
      this._pendingUpdate = [];
    }
    else if (e.listAll) {
      this._pendingAll = true;
      this._pendingUpdate = [];
    }
    else if (e.listRemove) {
      const removedItems = e.listRemove.elements;
      if (removedItems && removedItems.length > 0) {
        const key = this._observable.getPrimaryKey();
        for(const removedItem of removedItems) {
          // Find removed item in the list of chats.
          const length = this._getLength();
          let i;
          for(i = 0 ; i < length; ++i) {
            let match = true;
            const item = this._getElement(i);
            for(const keyPart of key) {
              if(item[keyPart] !== removedItem[keyPart]) {
                match = false;
                break;
              }
            }
            if(match) {
              this._splice(i, 1);
              break;
            }
          }
          if(i === length) {
            console.error('Original element is not found in the list for ' +
              JSON.stringify(e));
          }
        }
      }
    }
    else if (e.listChunk) {
      // Add the chunk into the pending updates.
      Array.prototype.push.apply(this._pendingUpdate, e.listChunk.elements);

      // If this is the last chunk, then apply the pending updates.
      if(e.listChunk.last) {
        if(this._pendingAll) {
          // We apply all by replacing all elements in the array.
          this._splice(0, this._getLength(), ...this._pendingUpdate);
        } else {
          // This is an elements update. We want to apply this by replacing all
          // elements which share a primary key, but neither array is known to
          // be sorted. We therefore look through the elements of the current
          // array, and for each one, we see if it's in the update array. If it
          // is, we will proceed to find one that isn't and replace the chunk
          // all at once. This will minimize the number of splices that happen,
          // which should hopefully minimize flickering. That's slow, but we
          // can't do any better without sorting the arrays, and we don't
          // want to sort the array since it may intentionally be sorted in some
          // way other than by primary key.
          const key = this._observable.getPrimaryKey();

          // Iterate over all of the existing elements.
          const length = this._getLength();
          for(let i = 0; i < length;) {
            // Find the matching item in the update array.
            const index = this._pendingUpdate.findIndex(item => {
              for(const keyPart of key) {
                if(item[keyPart] !== this._getElement(i)[keyPart]) {
                  return false;
                }
              }
              return true;
            });

            if(index !== -1) {
              const pendingSplice = [this._pendingUpdate[index]];
              // Remove it from the pending updates.
              this._pendingUpdate.splice(index, 1);
              // This is the start of a splice. Find the end.
              let endIndex = i + 1;
              for(; endIndex < length; ++endIndex) {
                const index = this._pendingUpdate.findIndex(item => {
                  for(const keyPart of key) {
                    if(item[keyPart] !== this._getElement(endIndex)[keyPart]) {
                      return false;
                    }
                  }

                  return true;
                });
                if(index === -1) {
                  // Found something that isn't updated. This is the end of the
                  // splice.
                  break;
                } else {
                  // Found this element's primary key. Push the updated element
                  // into the update list.
                  pendingSplice.push(this._pendingUpdate[index]);
                  // Remove it from the pending updates.
                  this._pendingUpdate.splice(index, 1);
                }
              }

              // Replace the section.
              this._splice(i, endIndex - i, ...pendingSplice);
              i = endIndex + 1;
            } else {
              // It didn't have a match. Proceed to the next element.
              ++i;
            }
          }

          // Done replacing elements. Push whatever is left to the end.
          this._splice(this._getLength(), 0, ...this._pendingUpdate);
        }

        // This doesn't actually have to be cleared as it will be cleared on
        // the next list command with pending updates, but this allow the memory
        // to be GC'ed earlier.
        this._pendingUpdate.length = 0;
      }
    }
    else if (e.listChange) {
      const changedItems = e.listChange.elements;
      if (changedItems && changedItems.length > 0) {
        const key = this._observable.getPrimaryKey();
        for(const changedItem of changedItems) {
          // Find changed item in the list of chats.
          const length = this._getLength();
          let i;
          for(i = 0 ; i < length; ++i) {
            let match = true;
            const item = this._getElement(i);
            for(const keyPart of key) {
              if(item[keyPart] !== changedItem[keyPart]) {
                match = false;
                break;
              }
            }
            if(match) {
              // Even though we can update the element directly in the array we
              // need to go through the iron list api so it updates UI. We can't
              // just replace it since the change only has the properties that
              // changed, so update merge in new properties. The iron list doesn't
              // seem to update the UI if you try to splice in the same object so
              // create new object and merge from both.
              const newItem = Object.assign({}, item, changedItem);
              // Element is found, update the element in the list.
              this._splice(i, 1, newItem);
              break;
            }
          }
          if(i === length) {
            console.error('Original element is not found in the list for ' +
              JSON.stringify(e));
          }
        }
      }
    }
    else if (e.listResync) {
      // The expected behaviour for listResync is to notify the client that
      // there are many changes in a list, and to query only about those that
      // the client is interested in. This behaviour does not work well with
      // SpliceListAdapter, as it does not know which elements of the list it
      // populates are interesting to the client, and also because a list big
      // enough to not support requestListAll probably shouldn't be spliced into
      // an array.
      //
      // At the time of this writing, listResync is supported only on the
      // chatMessage list. To use the chatMessage list, MessageListSpliceAdapter
      // should be used in preference to SpliceListAdapter as it won't encounter
      // these problems.
      console.error('listResync is not supported by SpliceListAdapter');
    } else {
      console.error(`Non-list event ${JSON.stringify(e)} received by SpliceListAdapter`);
    }
  }

  /**
   * Start receiving events from the Observable.
   *
   * @internal
   */
  _start() {
    this._observable.addEventListener(this._boundUpdater);
  }

  /**
   * Stop receiving events from the Observable.
   *
   * @internal
   */
  _stop() {
    this._observable.removeEventListener(this._boundUpdater);
  }
};

module.exports = SpliceListAdapter;
