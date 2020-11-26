/* eslint-disable functional/no-let */

import test from 'ava';
import { get as getFromStore, Readable, writable } from 'svelte/store';

import { arrayStore } from '../lib/arrayStore';
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

const people: readonly Person[] = [
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

test('arrayStore works', (t) => {
  const rootStore = writable(people);
  const personStoreArrayStore = arrayStore(rootStore);

  {
    const personStoreArray = get(personStoreArrayStore);
    t.deepEqual(personStoreArray.length, people.length);

    personStoreArray.forEach((v, i) => {
      t.deepEqual(get(v), people[i]);
    });
  }
  {
    const personStoreArray = get(personStoreArrayStore);
    const ageStore = subStore(personStoreArray[personStoreArray.length - 1], v => v.age);
    t.notDeepEqual(get(ageStore), 5);
    let valuesSeen = [];
    ageStore.subscribe((v) => { valuesSeen = [...valuesSeen, v]; });
    ageStore.set(5);
    t.deepEqual(get(ageStore), 5);
    t.deepEqual(get(personStoreArray[personStoreArray.length - 1]).age, 5);
    t.deepEqual(valuesSeen, [1, 5]);
  }
});
