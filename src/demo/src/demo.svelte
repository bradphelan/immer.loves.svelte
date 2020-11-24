<script>
  // small hack to get immerjs working.
  window.process = {
    env: {
      NODE_ENV: 'production',
    },
  };

  import { flip } from 'svelte/animate';
  import { writable, get, derived } from 'svelte/store';
  import { people, newPerson } from './data';
  import { subStore, sortStore } from 'immer-loves-svelte@2.1.2';
  import Widget from './Widget.svelte';
  import _ from 'underscore';
  import { produce } from 'immer';

  // Create a root store for the whole application
  let rootStore = writable(people);

  const sortedStore = sortStore(rootStore, (s) => s.age);

  let add = (ev) => {
    rootStore.update((v) =>
      produce(v, (draft) => {
        let p = newPerson();
        draft[p.id] = p;
      })
    );
  };

  let remove = (id) => {
    rootStore.update((v) =>
      produce(v, (draft) => {
        delete draft[id];
      })
    );
  };
</script>

<style>
  .main {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    flex-direction: row;
  }
</style>

<h1>Sortable subStores</h1>

<div class="main">
  {#each $sortedStore as viewModel (get(viewModel).id)}
    <div class="row" animate:flip>
      <Widget {viewModel} /><button
        on:click={(ev) => remove(get(viewModel).id)}>-</button>
    </div>
  {/each}
</div>

<button on:click={add}>+</button>
