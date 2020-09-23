import test from 'ava';
import { writable } from 'svelte/store';

import { lens as subStore } from './subStore';

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
