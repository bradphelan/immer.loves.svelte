/* eslint-disable functional/no-let */
/* eslint-disable functional/no-return-void */

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

export const newPerson = (): Person => {
  return {
    id: newId(),
    name: '',
    age: 0,
  };
};

const newPersonStoreArrayStore = () => {
  const rootStore = writable(people);
  const personStoreArrayStore = arrayStore(rootStore);
  return { rootStore, personStoreArrayStore };
};

test('arrayStore elements match underlying array elements', (t) => {
  const { personStoreArrayStore } = newPersonStoreArrayStore();
  const personStoreArray = get(personStoreArrayStore);

  t.deepEqual(personStoreArray.length, people.length);

  t.deepEqual(personStoreArray.map((v) => get(v)), people);
});

test('arrayStore updates work', (t) => {
  const { personStoreArrayStore } = newPersonStoreArrayStore();
  const personStoreArray = get(personStoreArrayStore);

  const ageStore = subStore(personStoreArray[personStoreArray.length - 1], v => v.age);
  t.notDeepEqual(get(ageStore), 5);

  let valuesSeen = [];
  ageStore.subscribe((v) => { valuesSeen = [...valuesSeen, v]; });
  ageStore.set(5);

  t.deepEqual(get(ageStore), 5);
  t.deepEqual(get(personStoreArray[personStoreArray.length - 1]).age, 5);
  t.deepEqual(valuesSeen, [1, 5]);
});

test('arrayStore handles adding and removing elements', (t) => {
  const { rootStore, personStoreArrayStore } = newPersonStoreArrayStore();

  const person = newPerson();
  rootStore.update(v => [...v, person]);
  t.deepEqual(get(personStoreArrayStore).map((v) => get(v)), [...people, person]);

  rootStore.update(v => v.slice(1));
  t.deepEqual(get(personStoreArrayStore).map((v) => get(v)), [...people.slice(1), person]);
});
