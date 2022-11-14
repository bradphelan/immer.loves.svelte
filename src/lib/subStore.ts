/* eslint-disable functional/no-return-void */
/* eslint-disable functional/immutable-data */

import { isDraft, produce } from 'immer';
import { Nothing } from 'immer/dist/internal';
import { Readable,Writable,writable } from 'svelte/store';

type Updatable<T> = {
  // Use a stupid name for the update method extension to avoid name collisions.
  // Is there a better way. String interning in JS should mean that a long
  // string does not mean a long time for a positive match.
  readonly __immer_loves_svelte_update__: (r: T) => Nothing;
  readonly __immer_loves_svelte_del__: () => Nothing;
} & T;

// An empty object to use
const empty = {}
const noprop = ""

type RecordUnknown = Record<symbol, unknown> | { readonly [index:number]:unknown}

function makeUpdateProxyImpl<T extends RecordUnknown, P extends RecordUnknown>(
  obj: T,
  parent: P,
  parentProp: string|symbol
) 
{
  const handler:ProxyHandler<T> = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get (target: T, prop: string|symbol, _receiver:any)
    {
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

function makeDelProxyImpl<T extends RecordUnknown, P extends RecordUnknown>(
  obj: T,
  parent: P,
  parentProp: string|symbol
) 
{
  const handler:ProxyHandler<T> = {
    get (target: T, prop: string|symbol, _receiver:any)
    {
      if (prop === '__immer_loves_svelte_del__') 
        return (()=>delete parent[parentProp])
      const newTarget = target[prop];
      if (isDraft(newTarget))
        return makeDelProxyImpl( newTarget, target, prop);
      else return makeDelProxyImpl(empty, target, prop);
    },
  };
  return new Proxy(obj, handler);
}

const makeUpdateProxy = <T extends RecordUnknown, U>(
  target: T,
  selector: (r: T) => U
): ((r: U) => void) => {

  // Pass the proxied target through the selector to generate a
  // setter for the subfield 
  const u = <Updatable<U>> <unknown> selector(makeUpdateProxyImpl(target, empty, noprop));

  // Return a function to perform the update
  return (r: U) => u.__immer_loves_svelte_update__(r);

};

const makeDelProxy = <T extends RecordUnknown, U>(
  target: T,
  selector: (r: T) => U
): (() => void) => {

  // Pass the proxied target through the selector to generate a
  // deleter for the subfield 
  const u = <Updatable<U>> <unknown> selector(makeDelProxyImpl(target, empty, noprop));

  // Return a function to perform the delete
  return () => u.__immer_loves_svelte_del__(); 

};

type Updater<T> = (arg0: T) => T;

export type Substore<T> = Writable<T> & {
  readonly errors: Readable<unknown>
  readonly delete: ()=>void
};

 
export function subStore<T extends RecordUnknown, U>(
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

  function subDel(): void {
    const rootUpdater = (oldValue: T) => {
      return produce(oldValue, (ds: T) => {
        makeDelProxy(ds, selector)();
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
    subscribe: (subscriber) => {
      // eslint-disable-next-line functional/no-let
      let old:readonly U[] = [] 
      return subscribe((v:T) => {
        try {
          const newItem:U = selector(v);
          if(old.length==0||old[0]!==newItem)
          {
            subscriber(newItem)
            old = [newItem];
          }
        } catch (error) {
          errors.set(error);
        }
      });
    },
    set: subSet,
    update: subUpdate,
    errors: errors,
    delete: subDel,
  };
}
