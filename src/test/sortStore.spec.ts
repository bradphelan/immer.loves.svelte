/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-let */
/* eslint-disable functional/no-return-void */

import test from 'ava';
import { get as getFromStore, Readable, writable } from 'svelte/store';

import { sortStore } from '../lib/sortStore';
import { subStore } from '../lib/subStore';

let id = 0;
const newId = () => {
  id++;
  return id;
};

function get<T>(store: Readable<T>) {
  return getFromStore(store) as T;
}

type Person = {
  readonly id: number;
  readonly name: string;
  readonly age: number;
};

const data: readonly Person[] = [
  { id: 0, name: 'toby', age: 4 },
  { id: 1, name: 'sarah', age: 3 },
  { id: 2, name: 'finn', age: 2 },
  { id: 3, name: 'stacy', age: 1 },
];

export const newPerson = () => {
  return {
    id: newId(),
    name: '',
    age: '',
  };
};

const people: Record<number, Person> = {};

data.forEach((p) => {
  people[p.id] = p;
});

test('sortStore works', (t) => {
  const rootStore = writable(people);
  const personStoreArrayStore = sortStore(rootStore, (s) => s.age);

  {
    const personStoreArray = get(personStoreArrayStore);
    t.deepEqual(get(personStoreArray[personStoreArray.length - 1]).id, 0);

    // Set the last sorted value ( ie the one with the largest age)
    // to -1. It should go to the beginning
    subStore(personStoreArray[personStoreArray.length - 1], (v) => v.age).set(
      -1
    );
  }
  {
    const currentVal = get(personStoreArrayStore);
    t.deepEqual(get(currentVal[0]).id, 0);
    t.deepEqual(get(currentVal[currentVal.length - 1]).id, 1);
  }
});
