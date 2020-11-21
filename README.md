# immer-loves-svelte

A library of svelte store wrappers

- **subStore** Create views on to leaf stores using arrow functions to specify the scope. Uses immer js under the hood.
- **undoStore** Wrap any store with undo redo features
- **transactionStore** Wrap any store with validation and transactions

[HomePage](https://bradphelan.github.io/immer.loves.svelte)

subStore
========
```childStore = subStore(mainStore, root => root.a.b.c["foo"].q.r.really.but.it.still.works)```

Under the hood immer and proxy types are used to do the work.

For example 

```

import {subStore} from "immer-loves-svelte"

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

  let result: Bar = null;

  // create a normal writable store
  const barStore = writable(bar);

  // create a store referencing a sub tree or sub value using just a selector 
  const s = subStore(barStore, b => b.foo1.a);

  // collect the results using subscribe
  barStore.subscribe((v: Bar) => {
    result = v;
  });

  // Set the value using the subStore setter
  s.set(77);

  // Check that the result is correct 
  t.deepEqual(result.foo1.a, 77);


});

```

One of the benefits is being able to use ``bind:value`` with immutable stores. For example if you have a store with type

```
type Data {
  readonly a:string
  readonly b:string
}

let store:Writable<Data>
```
now you can 

```
<script>
  let aStore = subStore(store,s=>s.a)
  let bStore = subStore(store,s=>s.b)
</script>

<input type="text" bind:Value={$aStore}/>
<input type="text" bind:Value={$bStore}/>
```

the original store is always updated using **immutable** updates.

Ideally you defined a single main store for your entire app and then
distribute subStore views to individual components.

undoStore
=========

Wrap any store to provide undo/redo capabilities. Is able to wrap **subStores**.

The provided interface is
```
export function undoStore<T>(
  store: Writable<T>,
): UndoRedoStore<T>;

export type UndoRedoStore<T> = Writable<T> & {
  readonly undo: ()=>void
  readonly redo: ()=>void
  readonly clear: ()=>void
  readonly canUndo: Readable<boolean>
  readonly canRedo: Readable<boolean>
};
```

transactionStore
================
Wrap any store to provide transaction like capabilities with validation. This could be useful when you want to provide updates in a form or dialog with an **ok button**. 

```
export function transactionStore<T>(
  store: Writable<T>,
  validator:Validator<T> = alwaysValid
): TransactionStore<T>;

export type TransactionStore<T> = Writable<T> & {
  // Commit the transaction. Will only work if the the store is valid
  readonly commit: ()=>void
  // Cancel the transaction and revert all changes
  readonly cancel: ()=>void
  readonly hasChanges: Readable<boolean>
  readonly validationError: Readable<ValidationError>
};
```
