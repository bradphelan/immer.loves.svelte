# immer-loves-svelte

Create writable sub stores from primary stores using a simple selector syntax

[HomePage](https://bradphelan.github.io/immer.loves.svelte)

```childStore = subStore(mainStore, root => root.a.b.c["foo"].q.r.really.but.it.still.works)```

Under the hood it is all immer and custom svelte stores.


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
