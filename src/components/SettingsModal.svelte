<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let isLightMode = false;
    export let timerEnabled = false;
    export let fanEditionEnabled = false;
    export let findAllSolutionsEnabled = false;
    export let randomPieceCount = 2;
    export let countdownActive = false;

    let isOpen = false;
    let selectedMinutes = 2;
    let isCustomMinutes = false;
    let customMinutesInput = "";
    let customInputEl;

    const minuteOptions = [1, 2, 3, 4, 5];

    function open() {
        isOpen = true;
    }

    function close() {
        isOpen = false;
        isCustomMinutes = false;
        customMinutesInput = "";
    }

    function toggleTheme() {
        isLightMode = !isLightMode;
    }

    function toggleTimer() {
        timerEnabled = !timerEnabled;
    }

    function toggleFanEdition() {
        fanEditionEnabled = !fanEditionEnabled;
    }

    function toggleFindAll() {
        findAllSolutionsEnabled = !findAllSolutionsEnabled;
    }

    function selectMinutes(min) {
        selectedMinutes = min;
        isCustomMinutes = false;
        customMinutesInput = "";
    }

    function enterCustomMinutes() {
        isCustomMinutes = true;
        customMinutesInput = "";
        setTimeout(() => customInputEl?.focus(), 0);
    }

    function handleCustomInput(event) {
        customMinutesInput = event.target.value.replace(/[^0-9]/g, "");
        const value = parseInt(customMinutesInput, 10);
        if (value && value > 0 && value <= 60) {
            selectedMinutes = value;
        }
    }

    function startChallenge() {
        dispatch("startChallenge", { minutes: selectedMinutes });
        close();
    }

    function stopChallenge() {
        dispatch("stopChallenge");
    }

    function handleKeydown(event) {
        if (event.key === "Escape" && isOpen) {
            close();
        }
    }

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            close();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<button
    class="gear-btn"
    on:click={open}
    aria-label="Open settings"
    title="Settings"
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <circle cx="12" cy="12" r="3"></circle>
        <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        ></path>
    </svg>
</button>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="backdrop" on:click={handleBackdropClick}>
        <div class="modal" role="dialog" aria-modal="true" aria-label="Settings">
            <div class="modal-header">
                <h2>Settings</h2>
                <button
                    class="close-btn"
                    on:click={close}
                    aria-label="Close settings"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div class="modal-body">
                <section class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-row">
                        <span class="setting-label">Theme</span>
                        <button class="toggle-btn" on:click={toggleTheme}>
                            {isLightMode ? "Light" : "Dark"}
                        </button>
                    </div>
                </section>

                <section class="settings-section">
                    <h3>Game</h3>
                    <div class="setting-row">
                        <span class="setting-label">Show timer</span>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="switch"
                            class:on={timerEnabled}
                            on:click={toggleTimer}
                            role="switch"
                            aria-checked={timerEnabled}
                            tabindex="0"
                        >
                            <div class="switch-thumb"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">
                            Bonus pieces
                            <small>Adds 2 black Fan Edition pieces</small>
                        </span>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="switch"
                            class:on={fanEditionEnabled}
                            on:click={toggleFanEdition}
                            role="switch"
                            aria-checked={fanEditionEnabled}
                            tabindex="0"
                        >
                            <div class="switch-thumb"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">
                            Find all solutions
                            <small>
                                Counts/lists every solution instead of stopping
                                at the first
                            </small>
                        </span>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="switch"
                            class:on={findAllSolutionsEnabled}
                            on:click={toggleFindAll}
                            role="switch"
                            aria-checked={findAllSolutionsEnabled}
                            tabindex="0"
                        >
                            <div class="switch-thumb"></div>
                        </div>
                    </div>
                    <div class="setting-row column">
                        <div class="setting-row-inline">
                            <span class="setting-label"
                                >Random pieces: {randomPieceCount}</span
                            >
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            bind:value={randomPieceCount}
                            class="slider"
                        />
                    </div>
                </section>

                <section class="settings-section">
                    <h3>Challenge</h3>
                    {#if countdownActive}
                        <p class="active-note">
                            A challenge is in progress. Use the Cancel button
                            next to the timer to end it.
                        </p>
                    {:else}
                        <div class="setting-row column">
                            <span class="setting-label">Duration</span>
                            <div class="minute-chips">
                                {#each minuteOptions as min}
                                    <button
                                        class="chip"
                                        class:selected={selectedMinutes === min &&
                                            !isCustomMinutes}
                                        on:click={() => selectMinutes(min)}
                                    >
                                        {min} min
                                    </button>
                                {/each}
                                {#if isCustomMinutes}
                                    <input
                                        bind:this={customInputEl}
                                        type="text"
                                        class="chip custom-input"
                                        placeholder="1-60"
                                        value={customMinutesInput}
                                        on:input={handleCustomInput}
                                        maxlength="2"
                                    />
                                {:else}
                                    <button
                                        class="chip"
                                        class:selected={!minuteOptions.includes(
                                            selectedMinutes,
                                        )}
                                        on:click={enterCustomMinutes}
                                    >
                                        Custom
                                    </button>
                                {/if}
                            </div>
                        </div>
                        <button
                            class="primary-btn"
                            on:click={startChallenge}
                        >
                            Start {selectedMinutes}-min challenge
                        </button>
                    {/if}
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    .gear-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: var(--text-color);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .gear-btn:hover {
        opacity: 0.8;
    }

    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fade-in 0.15s ease-out;
    }

    .modal {
        background: var(--bg-color);
        color: var(--text-color);
        border-radius: 12px;
        width: min(440px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        border: 1px solid var(--piece-color);
        animation: scale-in 0.15s ease-out;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--piece-color);
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-color);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        opacity: 0.8;
    }

    .modal-body {
        padding: 16px 20px 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .settings-section h3 {
        margin: 0 0 10px 0;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.7;
    }

    .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
    }

    .setting-row.column {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .setting-row-inline {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .setting-label {
        font-size: 0.95rem;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .setting-label small {
        font-size: 0.75rem;
        opacity: 0.65;
    }

    .toggle-btn {
        padding: 6px 14px;
        font-size: 0.85rem;
        border-radius: 6px;
    }

    .switch {
        width: 42px;
        height: 24px;
        background: var(--piece-color);
        border-radius: 999px;
        position: relative;
        cursor: pointer;
        transition: background 0.2s ease;
        flex-shrink: 0;
    }

    .switch.on {
        background: #4a90d9;
    }

    .switch-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        transition: transform 0.2s ease;
    }

    .switch.on .switch-thumb {
        transform: translateX(18px);
    }

    .slider {
        width: 100%;
        accent-color: #4a90d9;
    }

    .minute-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .chip {
        padding: 6px 12px;
        font-size: 0.85rem;
        border-radius: 6px;
        background: var(--button-bg-color);
        color: var(--button-text-color);
        border: 1px solid transparent;
        cursor: pointer;
    }

    .chip.selected {
        background: #4a90d9;
        color: white;
    }

    .custom-input {
        width: 70px;
        text-align: center;
        font-size: 16px;
    }

    .primary-btn {
        margin-top: 4px;
        background: linear-gradient(135deg, #e85d04, #dc2f02);
        color: white;
        border: none;
        padding: 10px 16px;
        font-size: 0.95rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
    }

    .primary-btn:hover {
        background: linear-gradient(135deg, #dc2f02, #9d0208);
    }

    .active-note {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.8;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scale-in {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (max-width: 480px) {
        .modal {
            width: calc(100vw - 16px);
        }

        .modal-header {
            padding: 14px 16px;
        }

        .modal-body {
            padding: 12px 16px 16px;
            gap: 16px;
        }
    }
</style>
