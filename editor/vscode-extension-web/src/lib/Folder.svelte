<script lang="ts">
    import type { FolderType } from "../script/type";

    export let folder: FolderType;
    export let wordCount: { [key: string]: number };
    export let count: number = 0;
    export let check: boolean = true;
    export let isTop: boolean = false;
    let fold = false;
    let fileCount: number = 0;
    let folderCount: number = 0;

    let folderCheck: { [key: string]: { count: number; check: boolean } } = {};
    for (let index = 0; index < folder.folders.length; index++) {
        const f = folder.folders[index];
        folderCheck[f.name] = { count: 0, check: true };
    }
    let fileCheck: { [key: string]: { count: number; check: boolean } } = {};
    for (let index = 0; index < folder.files.length; index++) {
        const f = folder.files[index];
        fileCheck[f.name] = { count: wordCount[f.path], check: true };
    }

    $: fileCount = Object.entries(fileCheck)
        .filter(([key, value]) => value.check)
        .reduce((sum, [key, value]) => sum + value.count, 0);
    $: folderCount = Object.entries(folderCheck)
        .filter(([key, value]) => value.check)
        .reduce((sum, [key, value]) => sum + value.count, 0);
    $: count = fileCount + folderCount;
</script>

<div class="folder-name">
    <button class="unfold-button" on:click={() => (fold = !fold)}>
        {fold ? "➕" : "➖"}
    </button>
    <label>
        <input type="checkbox" bind:checked={check} disabled={isTop} />
        <span>🗂️<span class="user-select">{folder.name}</span></span>
    </label>
    <div class="word-count">{count.toLocaleString()}</div>
</div>
<div class="folder" class:fold>
    {#each folder.folders as f}
        <svelte:self
            folder={f}
            {wordCount}
            bind:count={folderCheck[f.name].count}
            bind:check={folderCheck[f.name].check}
        />
    {/each}
    {#each folder.files as f}
        <div class="file-name">
            <label>
                <input type="checkbox" bind:checked={fileCheck[f.name].check} />
                <span>📄<span class="user-select">{f.name}</span></span>
            </label>
            <div class="word-count">
                {fileCheck[f.name].count.toLocaleString()}
            </div>
        </div>
    {/each}
</div>

<style>
    .folder-name {
        display: flex;
    }
    label {
        display: flex;
        user-select: none;
    }
    label input {
        margin-right: 0;
    }
    .unfold-button {
        cursor: pointer;
        padding: 0 0 0.2rem 0;
        border: none;
        background: transparent;
    }
    .fold {
        display: none;
    }
    .folder {
        border-left: 1px solid gray;
        margin-left: 2rem;
    }
    .word-count {
        position: absolute;
        left: 100%;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    .file-name {
        display: flex;
    }
    .user-select {
        user-select: text;
    }
</style>
