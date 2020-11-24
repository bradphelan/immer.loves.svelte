/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-return-void */

import { isDraft, produce } from 'immer';
import { Nothing } from 'immer/dist/internal';
import { Readable,Writable,writable } from 'svelte/store';

type Updatable<T> = {
  // Use a stupid name for the update method extension to avoid name collisions.
  // Is there a better way. String interning in JS should mean that a long
  // string does not mean a long time for a positive match.
  readonly __immer_loves_svelte_update__: (r: T) => Nothing;
} & T;

// An empty object to use
const empty = {}
const noprop = ""

// eslint-disable-next-line @typescript-eslint/ban-types
function makeUpdateProxyImpl<T extends object, P extends object>(
  obj: T,
  parent: P,
  parentProp: string|number
) 
{
  const handler = {
    get (target: T, prop: string|number)
    {
      // 
      if (prop === '__immer_loves_svelte_update__') 
        return ((r:T)=>parent[parentProp]=r)
      const newTarget = target[prop];
      if (isDraft(newTarget))
        return makeUpdateProxyImpl( newTarget, target, prop);
      else return makeUpdateProxyImpl(empty, target, prop);
    },
  };
  return new Proxy(obj, handler);
}

// eslint-disable-next-line @typescript-eslint/ban-types
const makeUpdateProxy = <T extends object, U>(
  target: T,
  selector: (r: T) => U
): ((r: U) => void) => {

  // Pass the proxied target through the selector to generate a
  // setter for the subfield 
  const u = <Updatable<U>> <unknown> selector(makeUpdateProxyImpl(target, empty, noprop));

  // Return a function to perform the update
  return (r: U) => u.__immer_loves_svelte_update__(r);

};

type Updater<T> = (arg0: T) => T;

export type Substore<T> = Writable<T> & {
  readonly errors: Readable<unknown>
};

// eslint-disable-next-line @typescript-eslint/ban-types
export function subStore<T extends object, U>(
  store: Writable<T>,
  selector: (r: T) => U
): Substore<U> {
  const { subscribe, update } = store;
  const errors = writable(undefined)

  function subSet(u: U): void {
    const rootUpdater = (oldValue: T) => {
      return produce(oldValue, (ds: T) => {
        makeUpdateProxy(ds, selector)(u);
      });
    };
    update(rootUpdater);
  }

  function subUpdate(updater: Updater<U>): void {
    const rootUpdater = (oldValue: T) => {
      return produce(oldValue, (ds: T) => {
        makeUpdateProxy(ds, selector)(updater(selector(oldValue)));
      });
    };
    update(rootUpdater);
  }

  return {
    subscribe: (subscriber) => subscribe((v) =>{
      try {
        subscriber(selector(v))
      } catch (error)
      {
        errors.set(error)
      } 
    } ),
    set: subSet,
    update: subUpdate,
    errors: errors
  };
}
