<script lang="ts">
  import Folder from "./lib/Folder.svelte";
  import {
    generateDebugMessage,
    type FolderType,
    type MessageType,
  } from "./script/type";
  let trees: FolderType[] = [];
  let list: { [key: string]: number } = {};

  window.addEventListener("message", (event: MessageEvent<MessageType>) => {
    trees = event.data.trees;
    list = event.data.list;
  });

  if (process.env.NODE_ENV === "development") {
    let debug = generateDebugMessage();
    trees = debug.trees;
    list = debug.list;
  }
</script>

<main>
  {#if trees.length === 0}
    <h1>Loading...</h1>
  {:else}
    <div class="container">
      {#each trees as tree}
        <Folder folder={tree} wordCount={list} isTop={true} />
        <div style="margin-bottom: 2rem;" />
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    margin-top: 1rem;
  }
  .container {
    position: relative;
  }
</style>
