/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable functional/no-let */
import test from 'ava';
import { get as getFromStore,Readable,writable } from 'svelte/store';

import { subStore } from '../lib/subStore';
import { undoStore } from '../lib/undoStore';

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

function get<T>(store:Readable<T>){
  return getFromStore(store) as T
}

test('undo works',(t)=>{
  const store = writable(bar);
  const foo1_b_store = subStore(store,s=>s.foo1.b)
  const undoable_foo1_b_store = undoStore(foo1_b_store);
  
  let result:Bar = null;

  store.subscribe((v:Bar)=>{result=v});

  t.deepEqual(result.foo1.b,'monkey')

  undoable_foo1_b_store.update(_=>'cow')

  t.deepEqual(get(store).foo1.b,'cow')
  t.deepEqual(get(undoable_foo1_b_store.canUndo), true)
  t.deepEqual(get(undoable_foo1_b_store.canRedo), false)

  undoable_foo1_b_store.undo()

  t.deepEqual(get(store).foo1.b,'monkey')
  t.deepEqual(get(undoable_foo1_b_store.canUndo), false)
  t.deepEqual(get(undoable_foo1_b_store.canRedo), true)

  undoable_foo1_b_store.redo()

  t.deepEqual(get(store).foo1.b,'cow')
  t.deepEqual(get(undoable_foo1_b_store.canUndo), true)
  t.deepEqual(get(undoable_foo1_b_store.canRedo), false)

})