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

exports.defineAutoTests = function() {
  // Keep track of which observables are registered.
  const observables = {};

  // Keep track of which observables registered and unregistered.
  const logBook = [];

  // Define an observable to track.
  class Observable {
    constructor(name)
    {
      this.name = name;
    }

    getPrimaryKey() {
      return ['key'];
    }

    addEventListener(handler) {
      this.handler = handler;
      logBook.push('Add ' + this.name);

      // When registering an observable, make sure no other observable is
      // registered with the same name.
      expect(observables[this.name]).toBe(undefined);
      observables[this.name] = this;
    }

    removeEventListener(handler) {
      expect(this.handler).toBe(handler);
      this.handler = undefined;
      logBook.push('Remove ' + this.name);

      // When unregistering an observable, make sure this observable is
      // registered with the same name.
      expect(observables[this.name]).toBe(this);
      delete observables[this.name];
    }

    trigger(value) {
      if(this.handler) {
        logBook.push(`Trigger ${this.name} with ${value}`);
        this.handler(value);
      }
    }
  };

  afterEach(() => {
    // Make sure observables are cleaned up after each test.
    expect(observables).toEqual({});
  });

  describe('Tracker', () => {
    beforeEach(() => {
      // Clear out any leftover observables.
      for(const name in observables) {
        const observable = observables[name];
        observable.removeEventListener(observable.handler);
      }

      // And clear out anything that might have been done with them.
      logBook.length = 0;
    });

    // Test that the tracker works with an observer.
    it('Basic tracking', function() {
      const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

      // Make an observable.
      const a = new Observable('a');

      // A basic check that doesn't do any chaining.
      const check1 = x => {
        expect(x).toBe('w');
        expect(Object.keys(observables)).toEqual(['a']);
      };

      // Add an event handler.
      const t = Tracker(a);
      t.addEventListener(check1);
      // Check that the right things happened.
      expect(logBook).toEqual(['Add a']);
      a.trigger('w');
      expect(logBook).toEqual(['Add a', 'Trigger a with w']);
      expect(Object.keys(observables).sort()).toEqual(['a']);

      // Remove the event handler.
      t.removeEventListener(check1);
      // Check that the right things happened.
      expect(logBook).toEqual(['Add a', 'Trigger a with w', 'Remove a']);
      a.trigger('w');
      expect(logBook).toEqual(['Add a', 'Trigger a with w', 'Remove a']);
      expect(observables).toEqual({});
    });

    // Test that two trackers can work on the same observable.
    it('Parallel tracking', function() {
      // An Observable that supports more than one listener.
      class ParallelObservable {
        constructor(name)
        {
          this.name = name;
          this.handler = [];
        }

        addEventListener(handler) {
          this.handler.push(handler);
          logBook.push('Add ' + this.name);

          // Register on the first listener.
          if(this.handler.length === 1) {
            observables[this.name] = this;
          }
        }

        removeEventListener(handler) {
          this.handler.splice(this.handler.indexOf(handler), 1);
          logBook.push('Remove ' + this.name);

          // Deregister on the last listener.
          if(this.handler.length === 0) {
            delete observables[this.name];
          }
        }

        trigger(value) {
          for(const h of this.handler) {
            logBook.push(`Trigger ${this.name} with ${value}`);
            h(value);
          }
        }
      }

      const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

      // Make an observable.
      const a = new ParallelObservable('a');

      // A basic check that doesn't do any chaining.
      const check1 = x => {
        expect(x).toBe('w');
        expect(Object.keys(observables)).toEqual(['a']);
      };

      // Another basic check that doesn't do any chaining.
      const check2 = x => {
        expect(x).toBe('w');
        expect(Object.keys(observables)).toEqual(['a']);
      };

      // Add two event handlers.
      const t1 = Tracker(a);
      t1.addEventListener(check1);

      const t2 = Tracker(a);
      t2.addEventListener(check2);

      // Check that the right things happened.
      expect(logBook).toEqual(['Add a', 'Add a']);
      a.trigger('w');
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w']);
      expect(Object.keys(observables).sort()).toEqual(['a']);

      // Remove one event handler.
      t1.removeEventListener(check1);
      // Check that the right things happened.
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w',
                               // There's just one removal so far.
                               'Remove a']);

      // Remove the other event handler.
      t2.removeEventListener(check2);
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w',
                               // Now both listerens are gone.
                               'Remove a',
                               'Remove a']);

      expect(observables).toEqual({});
    });

    // Test that on can be called twice on a tracker.
    it('Multiple tracking', function() {
      // An Observable that supports more than one listener.
      class ParallelObservable {
        constructor(name)
        {
          this.name = name;
          this.handler = [];
        }

        addEventListener(handler) {
          this.handler.push(handler);
          logBook.push('Add ' + this.name);

          // Register on the first listener.
          if(this.handler.length === 1) {
            observables[this.name] = this;
          }
        }

        removeEventListener(handler) {
          this.handler.splice(this.handler.indexOf(handler), 1);
          logBook.push('Remove ' + this.name);

          // Deregister on the last listener.
          if(this.handler.length === 0) {
            delete observables[this.name];
          }
        }

        trigger(value) {
          for(const h of this.handler) {
            logBook.push(`Trigger ${this.name} with ${value}`);
            h(value);
          }
        }
      }

      const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

      // Make an observable.
      const a = new ParallelObservable('a');

      // A basic check that doesn't do any chaining.
      const check1 = x => {
        expect(x).toBe('w');
        expect(Object.keys(observables)).toEqual(['a']);
      };

      // Another basic check that doesn't do any chaining.
      const check2 = x => {
        expect(x).toBe('w');
        expect(Object.keys(observables)).toEqual(['a']);
      };

      // Add two event handlers.
      const t = Tracker(a);
      t.addEventListener(check1);
      t.addEventListener(check2);

      // Check that the right things happened.
      expect(logBook).toEqual(['Add a', 'Add a']);
      a.trigger('w');
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w']);
      expect(Object.keys(observables).sort()).toEqual(['a']);

      // Remove one event handler.
      t.removeEventListener(check1);
      // Check that the right things happened.
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w',
                               // There's just one removal so far.
                               'Remove a']);

      // Remove the other event handler.
      t.removeEventListener(check2);
      expect(logBook).toEqual(['Add a', 'Add a',
                               'Trigger a with w', 'Trigger a with w',
                               // Now both listerens are gone.
                               'Remove a',
                               'Remove a']);

      expect(observables).toEqual({});
    });

    // Test tracking where there is a child observer.
    it('Track child', function() {
      const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

      // Make some observables.
      const a = new Observable('a');
      const b = new Observable('b');
      const c = new Observable('c');

      // Remember the inner and outer trackers.
      let outer;
      let inner1;
      let inner2;

      const check2 = x => {
        expect(x).toBe('v');
        expect(Object.keys(observables)).toEqual(['a', 'b', 'c']);
      };

      // A check that has a child.
      const check1 = x => {
        expect(x).toBe('w');

        // Add a child.
        inner1 = Tracker(b);
        inner1.addEventListener(check2);
        inner2 = Tracker(c);
        inner2.addEventListener(check2);
      };

      // Add an event handler.
      outer = Tracker(a);
      outer.addEventListener(check1);

      expect(logBook).toEqual(['Add a']);
      expect(Object.keys(observables).sort()).toEqual(['a']);
      // When the parent is triggered, it should cause the children to be added.
      a.trigger('w');
      expect(logBook).toEqual(['Add a', 'Trigger a with w', 'Add b', 'Add c']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b', 'c']);

      // When the child is triggered, it should just add a child trigger.
      b.trigger('v');
      expect(logBook).toEqual([
        'Add a',
        'Trigger a with w',
        'Add b',
        'Add c',
        'Trigger b with v']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b', 'c']);
      logBook.length = 0;

      // When the parent is triggered, it should add a parent trigger and also a
      // re-registration of the child.
      a.trigger('w');
      expect(logBook).toEqual([
          'Trigger a with w',
          'Remove b',
          'Remove c',
          'Add b',
          'Add c']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b', 'c']);
      logBook.length = 0;

      // Remove a child handler.
      inner1.removeEventListener(check2);

      // Check that the right things happened.
      expect(logBook).toEqual(['Remove b']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'c']);

      // Trigger the parent, and verify that the child is re-added.
      a.trigger('w');
      expect(logBook).toEqual([
        'Remove b',
        'Trigger a with w',
        'Remove c',
        'Add b',
        'Add c']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b', 'c']);
      logBook.length = 0;

      // Remove the parent and verify that everything goes away.
      outer.removeEventListener(check1);
      expect(logBook).toEqual([
        'Remove b',
        'Remove c',
        'Remove a']);
      expect(Object.keys(observables).sort()).toEqual([]);
    });

    it('Track nested', function() {
      const Tracker = cordova.require('cordova-plugin-bbmenterprise-support.util/Tracker');

      // Make some observables.
      const a = new Observable('a');
      const b = new Observable('b');
      const c = new Observable('c');

      // Remember the inner and outer trackers.
      let outer;
      let inner;
      let deepInner;

      // The innermost check.
      const check3 = x => {
        expect(x).toBe('x');
      };

      // A check that is a child and has its own child.
      const check2 = x => {
        expect(x).toBe('v');

        // Add a child.
        deepInner = Tracker(c);
        deepInner.addEventListener(check3);
      };

      // A check that has a child.
      const check1 = x => {
        expect(x).toBe('w');

        // Add a child.
        inner = Tracker(b);
        inner.addEventListener(check2);
      };

      // Add an event handler.
      outer = Tracker(a);
      outer.addEventListener(check1);

      expect(logBook).toEqual(['Add a']);
      expect(Object.keys(observables).sort()).toEqual(['a']);
      expect(inner).toBe(undefined);
      expect(deepInner).toBe(undefined);
      // When the parent is triggered, it should cause the child to be added.
      a.trigger('w');
      expect(logBook).toEqual([
        'Add a',
        'Trigger a with w',
        'Add b']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b']);
      expect(inner).not.toBe(undefined);
      expect(deepInner).toBe(undefined);

      // When the child is trigger, it should add the deeper child.
      b.trigger('v');
      expect(logBook).toEqual([
        'Add a',
        'Trigger a with w',
        'Add b',
        'Trigger b with v',
        'Add c']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b', 'c']);
      expect(inner).not.toBe(undefined);
      expect(deepInner).not.toBe(undefined);
      logBook.length = 0;

      // If the parent is triggered, we will re-register the child and lose the
      // deep child.
      a.trigger('w');
      expect(logBook).toEqual([
        'Trigger a with w',
        'Remove c',
        'Remove b',
        'Add b']);
      expect(Object.keys(observables).sort()).toEqual(['a', 'b']);

      // Deregister everything.
      outer.removeEventListener(check1);
    });
  });

  describe('SpliceListAdapter', () => {
    // Import the list adapter module.
    const SpliceListAdapter = cordova.require('cordova-plugin-bbmenterprise-support.util/SpliceListAdapter');

    // Create a list to update using the observable.
    const elements = [];

    // Make an observable to perform the updates.
    const observable = new Observable('a');

    // Make a new SpliceListAdapter to apply the observable updates to the list.
    const adapter = new SpliceListAdapter(
      // splice
      (index, removed, ...newElements) => {
        elements.splice(index, removed, ...newElements);
      },
      // getElement
      index => elements[index],
      // getLength
      () => elements.length);

    beforeEach(() => {
      // Clear out any leftover observables.
      for(const name in observables) {
        const observable = observables[name];
        observable.removeEventListener(observable.handler);
      }

      // And the results.
      elements.length = 0;

      adapter.setObservable(observable);

      // And clear out anything that might have been done with them.
      logBook.length = 0;
    });

    afterEach(() => {
      adapter.setObservable(undefined);
    });

    it('ListAdd', () => {
      // Send a list update on the observable.
      observable.trigger({
        listAdd: {
          elements: [
            { key: 1, prop: 1 },
            { key: 2, prop: 2 }
          ]
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]']);
      expect(elements).toEqual([{ key: 1, prop: 1}, {key: 2, prop: 2}]);

      // Send another list update on the observable.
      observable.trigger({
        listAdd: {
          elements: [
            { key: 3, prop: 3 },
            { key: 4, prop: 4 }
          ]
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]',
                               'Trigger a with [object Object]']);
      expect(elements).toEqual([{ key: 1, prop: 1},{key: 2, prop: 2},
                                { key: 3, prop: 3},{key: 4, prop: 4}]);
    });

    it('ListAll', () => {
      // Insert something to start off with. This will be erased.
      elements.push({ key: 6 });

      // Send a list update on the observable.
      observable.trigger({
        listAll: {}
      });

      // It hasn't done anything yet.
      expect(elements).toEqual([{ key: 6}]);

      // The last chunk triggers the update.
      observable.trigger({
        listChunk: {
          elements: [
            { key: 1, prop: 1 },
            { key: 2, prop: 2 }
          ],
          last: true
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]',
                               'Trigger a with [object Object]']);
      expect(elements).toEqual([{ key: 1, prop: 1}, {key: 2, prop: 2}]);

      // Send another list update on the observable.
      observable.trigger({
        listAll: {}
      });
      observable.trigger({
        listChunk: {
          elements: [
            // This changes the value of an existing element.
            { key: 1, prop: 2 }
          ]
        }
      });

      // No effect yet.
      expect(elements).toEqual([{ key: 1, prop: 1}, {key: 2, prop: 2}]);

      observable.trigger({
        listChunk: {
          elements: [
            // This adds a new element.
            { key: 3, prop: 3 }
          ],
          // And it's the last.
          last: true
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]',
                               'Trigger a with [object Object]',
                               'Trigger a with [object Object]',
                               'Trigger a with [object Object]',
                               'Trigger a with [object Object]']);
      expect(elements).toEqual([{ key: 1, prop: 2},{key: 3, prop: 3}]);
    });

    it('ListRemove', () => {
      elements.push({ key: 1, prop: 1 },
                    { key: 2, prop: 2 },
                    { key: 3, prop: 3 });

      // Send a list remove.
      observable.trigger({
        listRemove: {
          elements: [
            { key: 1, prop: 2 },
            { key: 3, prop: 4 }
          ]
        }
      });

      // This should remove two elements from the list.
      expect(logBook).toEqual(['Trigger a with [object Object]']);
      expect(elements).toEqual([{key: 2, prop: 2}]);

    });

    it('ListChange', () => {
      elements.push({ key: 1, prop: 1 },
                    { key: 2, prop: 2 },
                    { key: 3, prop: 3 });

      // Send a list change.
      observable.trigger({
        listChange: {
          elements: [
            { key: 1, prop: 2 },
            { key: 3, prop: 4 }
          ]
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]']);
      expect(elements).toEqual([{key: 1, prop: 2},
                                {key: 2, prop: 2},
                                {key: 3, prop: 4}]);

      // Trigger on a non-existant element. This produces a warning, but has no
      // other effect.
      observable.trigger({
        listChange: {
          elements: [
            { key: 5, prop: 4 }
          ]
        }
      });

      // There is a trigger.
      expect(logBook).toEqual(['Trigger a with [object Object]',
                               'Trigger a with [object Object]']);
      // But no effect on the property.
      expect(elements).toEqual([{key: 1, prop: 2},
                                        {key: 2, prop: 2},
                                        {key: 3, prop: 4}]);
    });

    it('ListElements', () => {
      elements.push({ key: 1, prop: 1 },
                    { key: 2, prop: 2 },
                    { key: 5, prop: 5 },
                    { key: 6, prop: 6 });

      // Update consecutive elements.
      observable.trigger({
        listElements: {
        }
      });
      observable.trigger({
        listChunk: {
          elements: [
            { key: 1, prop: 2 },
            { key: 2, prop: 3 }
          ],
          last: true
        }
      });

      // This should add an element to the list.
      expect(logBook).toEqual(['Trigger a with [object Object]',
                               'Trigger a with [object Object]']);
      // See that the elements were updated.
      expect(elements).toEqual([{key: 1, prop: 2},
                                {key: 2, prop: 3},
                                {key: 5, prop: 5},
                                {key: 6, prop: 6}]);

      // Send an update which is not sorted, and not consecutive.
      observable.trigger({
        listElements: {
        }
      });
      observable.trigger({
        listChunk: {
          elements: [
            { key: 6, prop: 5 },
            { key: 1, prop: 3 }
          ],
          last: true
        }
      });

      // See that the elements were updated.
      expect(elements).toEqual([{key: 1, prop: 3},
                                {key: 2, prop: 3},
                                {key: 5, prop: 5},
                                {key: 6, prop: 5}]);

      // Send an update which adds an element.
      observable.trigger({
        listElements: {
        }
      });
      observable.trigger({
        listChunk: {
          elements: [
            { key: 6, prop: 4 },
            { key: 3, prop: 8 },
            { key: 1, prop: 5 }
          ],
          last: true
        }
      });

      // See that the elements were updated. The new element always goes at the
      // end.
      expect(elements).toEqual([{key: 1, prop: 5},
                                {key: 2, prop: 3},
                                {key: 5, prop: 5},
                                {key: 6, prop: 4},
                                {key: 3, prop: 8}]);
    });
  });
  describe('MessageListSpliceAdapter', () => {
    // Import the list adapter module.
    const MessageListSpliceAdapter = cordova.require('cordova-plugin-bbmenterprise-support.util/MessageListSpliceAdapter');

    // Create a list to update using the observable.
    const elements = [];

    let expectedChatId;
    let listHandler;
    let watchers = new Map();

    const chatListObserver = {
      on: handler => {
        // Record the list handler so that it can be triggered from the test.
        console.log('On chat handler');
        expect(listHandler).toBe(undefined);
        listHandler = handler;
      },
      off: handler => {
        // Make sure the same thing that was registered gets deregistered.
        expect(listHandler).toBe(handler);
        listHandler = undefined;
      }
    };

    const makeMessageWatcher = index => {
      return {
        on: handler => {
          // Record the list handler so that it can be triggered from the test.
          //console.log(`On message ${index} handler`);
          watchers.set(index, handler);
        },
        off: handler => {
          // Make sure the same thing that was registered gets deregistered.
          //console.log(`Off message ${index} handler`);
          expect(watchers.get(index)).toBe(handler);
          watchers.delete(index);
        }
      };
    };

    // Make a new SpliceListAdapter to apply the observable updates to the list.
    const adapter = new MessageListSpliceAdapter(
      // splice
      (index, removed, ...newElements) => {
        elements.splice(index, removed, ...newElements);
      },
      // bbmeSdk
      {
        chat: {
          byChatId: chatId => {
            expect(chatId).toBe(expectedChatId);

            //console.log('Get chat ' + chatId);
            return chatListObserver
          }
        },
        chatMessage: {
          byChatIdAndMessageId: (chatId, messageId) => {
            //console.log(`Observe for (${chatId},${messageId})`);
            expect(chatId).toBe(expectedChatId);
            return makeMessageWatcher(messageId);
          }
        }
      });

    beforeEach(() => {
      // Clear the results.
      elements.length = 0;

      // And clear out anything that might have been done with them.
      logBook.length = 0;
    });

    afterEach(() => {
      adapter.setChatId(undefined);
    });

    // See that the MessageListSpliceAdapter can start up and shut down.
    it('start', () => {
      // Start on some chat.
      expectedChatId = 'a';
      adapter.setChatId('a');

      // The list should initially be empty.
      expect(elements.length).toBe(0);

      // As soon as the length returns, it returns a size greater than the
      // default, the array should resize to hold the default 30 elements which
      // are each a default object.
      listHandler({
        chatId: 'a',
        lastMessage: 40
      });
      expect(elements.length).toBe(30);

      for(element of elements) {
        expect(element).toEqual({});
      }

      // The keys should be 30 values leading up to 40, meaning 11 to 40.
      expect(Array.from(watchers.keys()))
      .toEqual(Array(30).fill(1).map((x, y) => (x + y + 10).toString()));

      // If we stop watching, all the watchers should detach.
      adapter.setChatId(undefined);

      expect(Array.from(watchers.keys())).toEqual([]);
    });

    // See that the an update of an element results in a splice.
    it('basic', () => {
      // Start on some chat.
      expectedChatId = 'a';
      adapter.setChatId('a');

      listHandler({
        chatId: 'a',
        lastMessage: 40
      });

      // Set one element to a different value at index 15. Since our list is
      // showing elements 11-40, this should impact the 4th element of the
      // array.
      watchers.get('15')('data');

      // Element 4 should now be this value.
      expect(elements[4]).toBe('data');
    });

    // See that resizing the view of the observable results in the proper
    // splice calls.
    it('resize', () => {
      // Start on some chat.
      expectedChatId = 'a';
      adapter.setChatId('a');

      listHandler({
        chatId: 'a',
        lastMessage: 40
      });

      // Set one element to a different value at index 15. Since our list is
      // showing elements 11-40, this should impact the 4th element of the
      // array.
      watchers.get('15')('data');

      // Add elements at the beginning, to change the index. This will shift
      // the elements later by 2, so the length should now be 32, and element 6
      // is the one that was modified.
      adapter.addToBeginning(2);

      expect(elements[4]).toEqual({});
      expect(elements[6]).toBe('data');
      expect(elements.length).toBe(32);

      // Remove elements at the beginning, to change the index. This will shift
      // the elements earlier by 3, so the length should now be 29, and element
      // 3 is the one that was modified.
      adapter.removeFromBeginning(3);

      expect(elements[3]).toBe('data');
      expect(elements.length).toBe(29);

      // Removing from the end doesn't impact indices of existing data, but it
      // does change the length.
      adapter.removeFromEnd(2);

      expect(elements[3]).toBe('data');
      expect(elements.length).toBe(27);

      // Adding to the end creates new default items.
      adapter.addToEnd(1);

      expect(elements[3]).toBe('data');
      expect(elements[26]).toEqual({});
      expect(elements.length).toBe(28);
    });

    // See that splices are applied correctly when the underlying observable
    // indicates that the message list has changed size.
    it('autoexpand', () => {
      // Start on some chat.
      expectedChatId = 'a';
      adapter.setChatId('a');

      listHandler({
        chatId: 'a',
        lastMessage: 40
      });

      expect(elements.length).toBe(30);

      // With autoexpand false, shrinking the message list will result in a
      // shrink splice, but expanding the view will not result in an expand
      // splice.
      listHandler({
        chatId: 'a',
        lastMessage: 38
      });

      expect(elements.length).toBe(28);

      listHandler({
        chatId: 'a',
        lastMessage: 40
      });

      // Still 28, no expansion.
      expect(elements.length).toBe(28);

      // Turn on autoexpand.
      adapter.setAutoExpand(true);

      // Now the array will still shrink in the same way.
      listHandler({
        chatId: 'a',
        lastMessage: 36
      });
      expect(elements.length).toBe(26);

      // But it also grows.
      listHandler({
        chatId: 'a',
        lastMessage: 40
      });
      expect(elements.length).toBe(30);
    });
  });
};
