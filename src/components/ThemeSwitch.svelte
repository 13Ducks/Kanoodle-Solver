<script>
    import { onMount } from "svelte";

    let isLightMode = false;

    function toggleTheme() {
        isLightMode = !isLightMode;
        document.documentElement.classList.toggle("light-mode", isLightMode);
    }

    onMount(() => {
        if (window?.matchMedia("(prefers-color-scheme: light)").matches) {
            isLightMode = true;
            document.documentElement.classList.toggle("light-mode", true);
        } else {
            isLightMode = false;
            document.documentElement.classList.toggle("light-mode", false);
        }
    });
</script>

<button on:click={toggleTheme}>
    {#if isLightMode}
        ☀️
    {:else}
        🌙
    {/if}
</button>

<style>
    button {
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }
</style>
