/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-return-void */

import test from 'ava';
import { produce } from 'immer';
import { get as getFromStore, Readable, writable } from 'svelte/store';

import { subStore } from '../lib/subStore';

function get<T>(store: Readable<T>) {
  return getFromStore(store) as T;
}

type Foo = {
  readonly a: number;
  readonly b: string;
};

type Bar = {
  readonly foo1: Foo;
  readonly foo2: Foo;
  readonly foo3: readonly Foo[];
};

const bar: Bar = {
  foo1: { a: 10, b: 'monkey' },
  foo2: { a: 20, b: 'cat' },
  foo3: [
    { a: 10, b: 'monkey' },
    { a: 20, b: 'cat' },
  ],
};

test('creating a subStore through object path works', (t) => {
  // eslint-disable-next-line functional/no-let
  let result: Bar = null;
  const barStore = writable(bar);
  const s = subStore(barStore, (b) => b.foo1.a);
  barStore.subscribe((v: Bar) => {
    result = v;
  });
  s.set(77);
  t.deepEqual(result.foo1.a, 77);
});

test('creating a subStore through array path works', (t) => {
  // eslint-disable-next-line functional/no-let
  let result: Bar = null;
  const barStore = writable(bar);
  const s = subStore(barStore, (b) => b.foo3[1].b);
  barStore.subscribe((v: Bar) => {
    result = v;
  });
  s.set('giraffe');
  t.deepEqual(result.foo3[1].b, 'giraffe');
});

test('creating a subStore for non leaf path works', (t) => {
  // eslint-disable-next-line functional/no-let
  let result: Bar = null;
  const barStore = writable(bar);
  const s = subStore(barStore, (b) => b.foo3);
  barStore.subscribe((v: Bar) => {
    result = v;
  });
  s.set([{ a: 11, b: 'horse' }]);
  t.deepEqual(result.foo3, [{ a: 11, b: 'horse' }]);
});

test('subscribe for sub stores works', (t) => {
  // eslint-disable-next-line functional/no-let
  let result: number = null;
  const barStore = writable(bar);

  const s0 = subStore(barStore, (b) => b.foo1.a);
  s0.subscribe((v: number) => {
    result = v;
  });

  const s1 = subStore(barStore, (b) => b.foo1);
  s1.update((v: Foo) =>
    produce(v, (d) => {
      d.a = 99;
    })
  );

  t.deepEqual(result, 99);
});

test('deleting a substore removes the node', (t) => {
  const barStore = writable(bar);
  const fooStore = subStore(barStore, (k) => k.foo1);
  fooStore.delete();

  t.deepEqual(get(barStore).foo1, undefined);
});

test('changes on one leaf do not notify on another unrelated leaf', (t) => {
  const barStore = writable(bar);
  const foo1Store = subStore(barStore, (k) => k.foo1.a);
  const foo2Store = subStore(barStore, (k) => k.foo2.a);
  // eslint-disable-next-line functional/no-let
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  foo1Store.subscribe((_v: number) => {
    count++;
  });
  t.deepEqual(count,1);
  
  foo2Store.update((v:number)=>v+1);
  t.deepEqual(count,1);
});

test('changes on one branch do not notify on another branch leaf', (t) => {
  const barStore = writable(bar);
  const foo1Store = subStore(barStore, (k) => k.foo1.a);
  const foo2Store = subStore(barStore, (k) => k.foo2);
  // eslint-disable-next-line functional/no-let
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  foo1Store.subscribe((_v: number) => {
    count++;
  });
  t.deepEqual(count,1);
  
  foo2Store.update((v:Foo)=>produce(v, vs=>{vs.a=vs.a+1}));
  t.deepEqual(count,1);
});