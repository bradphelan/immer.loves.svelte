/* eslint-disable functional/no-return-void */
import {derived, get,Readable, Writable,writable} from "svelte/store"


type ValidationError = string|readonly string[]|undefined
type Validator<T> = (v:T)=>string|readonly string[]|undefined

export type TransactionStore<T> = Writable<T> & {
  // Commit the transaction. Will only work if the the store is valid
  readonly commit: ()=>void
  // Cancel the transaction. The 
  readonly cancel: ()=>void
  readonly hasChanges: Readable<boolean>
  readonly validationError: Readable<ValidationError>
};


const alwaysValid = () => undefined

export function transactionStore<T>(
  store: Writable<T>,
  validator:Validator<T> = alwaysValid
): TransactionStore<T> 
{
  const tempStore = writable(get(store))
  const hasChanges = writable(false)
  const validation = derived(tempStore,v=>validator(v))

  type Updater<T> = (arg0: T) => T;

  function subSet(newValue: T): void {
    tempStore.set(newValue)
    hasChanges.set(true)
  }

  function subUpdate(updater: Updater<T>): void {
    tempStore.update(updater)
    hasChanges.set(true)
  }

  function subSubscribe( subscriber: (arg0: T) => void ){
    return tempStore.subscribe(subscriber)
  }

  function cancel(){
    tempStore.set(get(store))
    hasChanges.set(false)
  }

  function commit():boolean{
    const v = get(tempStore)
    if(validator(v)===undefined){
      store.set(get(tempStore))
      hasChanges.set(false)
      return true
    }else
      return false
  }

  return {
    subscribe: subSubscribe,
    update: subUpdate,
    set: subSet,
    cancel,
    commit,
    hasChanges,
    validationError: validation
  }

}