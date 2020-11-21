/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-return-void */
import {derived, Readable,writable, Writable} from "svelte/store"

export type UndoRedoStore<T> = Writable<T> & {
  readonly undo: ()=>void
  readonly redo: ()=>void
  readonly clear: ()=>void
  readonly canUndo: Readable<boolean>
  readonly canRedo: Readable<boolean>
};

export function undoStore<T>(
  store: Writable<T>,
): UndoRedoStore<T> 
{
  type Updater<T> = (arg0: T) => T;

  const undoStack: T[] = []
  const redoStack: T[] = []

  const { subscribe } = store;

  function subSet(newValue: T): void {
    redoStack.length=0
    store.update(oldValue=>{
      undoStack.push(oldValue)
      return newValue
    })
  }

  function subUpdate(updater: Updater<T>): void {
    redoStack.length=0
    store.update(oldValue=>{
      undoStack.push(oldValue)
      return updater(oldValue)
    })
  }

  function subSubscribe( subscriber: (arg0: T) => void ){
     return subscribe(v=>subscriber(v))
  }

  function undo(){
    const p = undoStack.pop()
    if(p){
      store.update(o=>
        {
          redoStack.push(o)
          return p
        }
      )
    }
  }

  function redo(){
    const p = redoStack.pop()
    if(p){
      store.update(o=>
        {
          undoStack.push(o)
          return p
        }
      )
    }
  }

  const bump = writable(1)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canUndo = derived([store,bump],([_,__])=>undoStack.length>0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canRedo = derived([store,bump],([_,__])=>redoStack.length>0)

  function clear(){
    redoStack.length=0
    undoStack.length=0
    bump.update(v=>v+1)
  }

  return {
    subscribe: subSubscribe,
    update: subUpdate,
    set: subSet,
    undo,
    redo,
    clear,
    canUndo,
    canRedo
  }

}