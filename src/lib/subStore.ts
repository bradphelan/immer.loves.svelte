/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-return-void */

import { Draft, isDraft, produce } from 'immer';
import { Nothing } from 'immer/dist/internal';
import { Writable } from 'svelte/store';

type Updatable<T> = {
  readonly __update__: (r: T) => Nothing;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
function sink(_v: any) {}

function makeUpdateProxyImpl<T>(
  obj: Draft<T>,
  update: (r: T) => void = sink
): T {
  const handler = {
    get: (target: any, prop: any) => {
      if (prop === '__update__') return update;

      const newTarget = target[prop];
      if (isDraft(newTarget))
        return makeUpdateProxyImpl(target[prop], (v) => (target[prop] = v));
      else return makeUpdateProxyImpl({}, (v) => (target[prop] = v));
    },
  };
  return new Proxy(obj, handler);
}

const makeUpdateProxy = <T, U>(
  target: Draft<T>,
  selector: (r: T) => U
): ((r: U) => void) => {
  const u = <Updatable<U>>(<unknown>selector(makeUpdateProxyImpl(target)));
  return (r: U) => u.__update__(r);
};

type Updater<T> = (arg0: T) => T;

export function lens<T, U>(
  store: Writable<T>,
  selector: (r: T) => U
): Writable<U> {
  const { subscribe, update } = store;

  function subSet(u: U): void {
    const rootUpdater = (oldValue: T) => {
      return produce(oldValue, (ds: Draft<T>) => {
        makeUpdateProxy(ds, selector)(u);
      });
    };
    update(rootUpdater);
  }

  function subUpdate(updater: Updater<U>): void {
    const rootUpdater = (oldValue: T) => {
      return produce(oldValue, (ds: Draft<T>) => {
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
