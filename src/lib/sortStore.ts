import { derived, Readable, Writable } from "svelte/store";
import _ from 'underscore'

import { subStore, Substore } from "./subStore";

// Provides sorting for an immutable record set. The result
// can be rendered out into a svelte {#each} block
// @param rootStore. A single object whose fields are all objects of the same type V
// @param sortKeySelector. A function that takes a V and provides a sorting key
// @param provides an observable of stores for editing type V. 
// @tparam V the type of record in the database
// @tparam I the index type of the record
// @tparam K the field type used for sorting
export function sortStore <
    V,
    I extends string | number | symbol,
    K
    >
    ( rootStore:Writable<Record<I,V>>
    , sortKeySelector:(arg:V)=>K
    ) 
    : Readable<readonly Substore<V>[]>
{
  return derived(rootStore, (rv) => {
    const s = Object
        .keys(rv)
        .map((k) => {
            const ss = subStore(rootStore, (v) => v[k]);
            return {value:rv[k], store:ss};
        });

    return _
        .sortBy(s, i=>sortKeySelector(i.value))
        .map(i=>i.store);
  });
};
