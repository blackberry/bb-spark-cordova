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

/*
 * A module to help prevent observer leaks when using chained observers.
 *
 * A common usecase for observers is:
 * observable1.on(key, value => {
 *   observable2.on(value, value2 => {
 *     ...
 *   }
 * });
 *
 * In this case, when the outer event handler receives an event, the inner
 * event handler will run, and begin listening for an event. If the outer
 * handler then re-runs, a new inner handler will be created and the old one
 * will be left running as well, which is probably undesirable. Tracker helps
 * with this case by automatically deregistering the inner handler.
 *
 * Usage:
 * Tracker(observable1).on(key, value => {
 *   Tracker(observable2).on(value, value2 => {
 *     ...
 *   });
 * });
 *
 * Given this usage, the outer tracker function will return an object with the
 * same properties and prototype as the observable passed to it, but with the
 * eventlistener functions wrapped.
 *
 * These wrappers will call the original event listener functions, but also
 * remember any other Trackers registered to handle events within the event
 * handler. It will automatically stop any handler on a Tracker that was
 * registered on a previous callback before running the next callback.
 *
 * The tracked observable object makes use of the original Observable, but
 * operates independently of it, meaning that it will not interfere with other
 * users of the Observable, or other trackers on the Observable.
 */

let removeContext = context => {
  // Children will self-remove from the children list, so just keep
  // triggering their removal until none are left.
  while(context.children.length > 0) {
    const child = context.children[0];
    removeContext(child);
  }
  context.end();

  // Remove this context from its parent.
  if(context.parent) {
    context.parent.children.splice(context.parent.children.indexOf(context), 1);
  }
};

// Store the tracker context in which new contexts will be added. This causes
// the contexts to be stored in a tree structure where each adds itself to
// the current context, with the tree rooted at a context created when the
// active context is undefined.
let activeTrackerContext = undefined;

function track(observable) {
  // Create an object which is a clone of observable.
  const cloned = Object.create(observable);

  // Override the listener properties. Remember the old values.
  const oldAddEventListener = cloned.addEventListener.bind(observable);
  const oldRemoveEventListener = cloned.removeEventListener.bind(observable);

  cloned.addEventListener = handler => {
    // See if there is a global context. If there is, then make a new context
    // and add it into the current one.
    let trackContext = {
      parent: activeTrackerContext,
      children: [],
      // We will set the end callback later. We can't set it until the wrapper
      // function is created, and the wrapper function needs to reference this
      // context.
      end: undefined,
      name: cloned.name
    };

    // See if there is a parent to whom we need to add ourself as a child.
    if(activeTrackerContext) {
      activeTrackerContext.children.push(trackContext);
    }

    // Bind the handler to the original observable.
    const oldHandler = handler.bind(observable);

    // Create a bound function, so that the function can be unregistered.
    const wrappedHandler = value => {
      // Remove any children that were previously registered.
      // Children will self-remove from the children list, so just keep
      // triggering their removal until none are left.
      while(trackContext.children.length > 0) {
        const child = trackContext.children[0];
        removeContext(child);
      }

      // Set this as the new global context.
      const previousContext = activeTrackerContext;
      activeTrackerContext = trackContext;

      // Run the handler, which may create new children.
      oldHandler(value);

      // Switch back to the old parent.
      activeTrackerContext = previousContext;
    };

    // Run the listener, but override its handler. We need the handler to clear
    // out anything that was left over from a previous run of the handler.
    trackContext.end = () => oldRemoveEventListener(wrappedHandler);
    oldAddEventListener(wrappedHandler);

    // Remember the trackContext associated with this function so that it can
    // be removed later.
    cloned._trackContext.set(handler, trackContext);
  };

  cloned.removeEventListener = handler => {
    // Look up the trackContext for this object. Iterate over all children and
    // stop listening on them.
    const context = cloned._trackContext.get(handler);
    if(context) {
      removeContext(context);
    }
  };

  // Create a map to map original handlers to wrapped handlers, so that the
  // listeners can be properly unregistered.
  cloned._trackContext = new Map();

  // Return the object which now does tracking.
  return cloned;
}

module.exports = track;
