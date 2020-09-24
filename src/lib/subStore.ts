/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-return-void */

import { isDraft, produce } from 'immer';
import { Nothing } from 'immer/dist/internal';
import { Writable } from 'svelte/store';

type Updatable<T> = {
  readonly __update__: (r: T) => Nothing;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
function sink(_v: any) {}

// An empty object to use
const empty = {}

// eslint-disable-next-line @typescript-eslint/ban-types
function makeUpdateProxyImpl<T extends object>(
  obj: T,
  update: (r: T) => void = sink
): T 
{
  const handler = {
    get: (target: T, prop: string|number) => {
      if (prop === '__update__') return update;

      const newTarget = target[prop];
      if (isDraft(newTarget))
        return makeUpdateProxyImpl( target[prop], (v) => (target[prop] = v));
      else return makeUpdateProxyImpl(empty, (v) => (target[prop] = v));
    },
  };
  return new Proxy<T>(obj, handler);
}

// eslint-disable-next-line @typescript-eslint/ban-types
const makeUpdateProxy = <T extends object, U>(
  target: T,
  selector: (r: T) => U
): ((r: U) => void) => {
  const u = <Updatable<U>>(<unknown>selector(makeUpdateProxyImpl(target)));
  return (r: U) => u.__update__(r);
};

type Updater<T> = (arg0: T) => T;

// eslint-disable-next-line @typescript-eslint/ban-types
export function subStore<T extends object, U>(
  store: Writable<T>,
  selector: (r: T) => U
): Writable<U> {
  const { subscribe, update } = store;

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
    subscribe: (subscriber) => subscribe((v) => subscriber(selector(v))),
    set: subSet,
    update: subUpdate,
  };
}
