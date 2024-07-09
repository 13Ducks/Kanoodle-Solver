<script>
    export let timerEnabled = true;

    function toggleTimer() {
        timerEnabled = !timerEnabled;
    }
</script>

<button on:click={toggleTimer}>
    {#if timerEnabled}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    {:else}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="3" y1="3" x2="21" y2="21"></line>
            <path d="M12 7v5"></path>
        </svg>
    {/if}
</button>

<style>
    button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }
</style>
