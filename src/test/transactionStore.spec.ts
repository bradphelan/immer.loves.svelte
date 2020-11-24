import test from 'ava';
import { get as getFromStore,Readable, writable } from 'svelte/store';

import { TransactionStore, transactionStore } from '../lib/transactionStore';

test('transaction stores work',(t)=>{
  const root = writable(1)
  const transaction = transactionStore(root)

  t.deepEqual(get(root),1)
  t.deepEqual(get(transaction.hasChanges),false)

  transaction.set(2)

  t.deepEqual(get(root),1)
  t.deepEqual(get(transaction),2)
  t.deepEqual(get(transaction.hasChanges),true)

  transaction.set(3)

  t.deepEqual(get(root),1)
  t.deepEqual(get(transaction),3)
  t.deepEqual(get(transaction.hasChanges),true)

  transaction.cancel()

  t.deepEqual(get(root),1)
  t.deepEqual(get(transaction),1)
  t.deepEqual(get(transaction.hasChanges),false)

  transaction.set(3)

  t.deepEqual(get(root),1)
  t.deepEqual(get(transaction),3)
  t.deepEqual(get(transaction.hasChanges),true)

  transaction.commit()

  t.deepEqual(get(root),3)
  t.deepEqual(get(transaction),3)
  t.deepEqual(get(transaction.hasChanges),false)
})


function get<T>(store:Readable<T>){
  return getFromStore(store) as T
}

test('transaction validation',(t)=>{
  const rootStore = writable(0)

  const validator = (v:number)=>{
    if(v<5)
      return "number should be less than 5"
    return undefined
  }

  const tStore:TransactionStore<number> = transactionStore(rootStore,validator)

  t.deepEqual( get(tStore.validationError),"number should be less than 5")
  tStore.set(10)
  t.deepEqual( get(tStore.validationError), undefined)



})