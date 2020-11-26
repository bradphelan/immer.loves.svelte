/* eslint-disable functional/no-let */
/* eslint-disable functional/no-loop-statement */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/immutable-data */
import { derived, Readable, Writable } from "svelte/store";

import { subStore, Substore } from "./subStore";

// Converts a store for a read-only array to a readable store for sub-stores for each element in the array.
// @tparam V the type of record in the array
export function arrayStore<V>(rootStore: Writable<readonly V[]>)
  : Readable<readonly Substore<V>[]> {
  return derived(rootStore, (rv) => {
    const r: Substore<V>[] = [];
    for (let i = 0; i < rv.length; ++i) {
      r.push(subStore(rootStore, (v) => v[i]));
    }

    return r;
  });
};
