<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let isActive = false;

    let selectedMinutes = 2;
    let isDropdownOpen = false;
    let isCustomMode = false;
    let customInput = "";
    let customInputEl;

    const minuteOptions = [1, 2, 3, 4, 5];

    function startCountdown() {
        dispatch("start", { minutes: selectedMinutes });
    }

    function stopCountdown() {
        dispatch("stop");
    }

    function toggleDropdown(event) {
        event.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        if (!isDropdownOpen) {
            isCustomMode = false;
            customInput = "";
        }
    }

    function selectMinutes(min, event) {
        event.stopPropagation();
        selectedMinutes = min;
        isDropdownOpen = false;
        isCustomMode = false;
    }

    function enterCustomMode(event) {
        event.stopPropagation();
        isCustomMode = true;
        customInput = "";
        setTimeout(() => customInputEl?.focus(), 0);
    }

    function handleCustomInput(event) {
        // Only allow numbers
        customInput = event.target.value.replace(/[^0-9]/g, "");
        const value = parseInt(customInput, 10);
        if (value && value > 0 && value <= 60) {
            selectedMinutes = value;
        }
    }

    function handleCustomKeydown(event) {
        if (event.key === "Enter") {
            event.stopPropagation();
            isDropdownOpen = false;
            isCustomMode = false;
            customInput = "";
        } else if (event.key === "Escape") {
            isCustomMode = false;
            customInput = "";
        }
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event) {
        if (isDropdownOpen && !event.target.closest(".countdown-container")) {
            isDropdownOpen = false;
            isCustomMode = false;
            customInput = "";
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="countdown-container">
    {#if isActive}
        <button
            class="cancel-btn"
            on:click={stopCountdown}
            title="Cancel Challenge"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
            Cancel
        </button>
    {:else}
        <div class="countdown-setup">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="time-selector" on:click={toggleDropdown}>
                <span class="time-label">{selectedMinutes} min</span>
                <span class="dropdown-arrow" class:open={isDropdownOpen}>▼</span
                >

                {#if isDropdownOpen}
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="time-dropdown" on:click|stopPropagation>
                        {#each minuteOptions as min}
                            <button
                                class="time-option"
                                class:selected={selectedMinutes === min &&
                                    !isCustomMode}
                                on:click={(e) => selectMinutes(min, e)}
                            >
                                {min} min
                            </button>
                        {/each}
                        <div class="dropdown-divider"></div>
                        {#if isCustomMode}
                            <div class="custom-input-row">
                                <input
                                    bind:this={customInputEl}
                                    type="text"
                                    class="custom-time-input"
                                    placeholder="1-60"
                                    value={customInput}
                                    on:input={handleCustomInput}
                                    on:keydown={handleCustomKeydown}
                                    on:click|stopPropagation
                                    maxlength="2"
                                />
                            </div>
                        {:else}
                            <button
                                class="time-option custom-option"
                                class:selected={!minuteOptions.includes(
                                    selectedMinutes,
                                )}
                                on:click={enterCustomMode}
                            >
                                Custom...
                            </button>
                        {/if}
                    </div>
                {/if}
            </div>
            <button
                class="start-btn"
                on:click={startCountdown}
                title="Start Timed Challenge"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Challenge
            </button>
        </div>
    {/if}
</div>

<style>
    .countdown-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .countdown-setup {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .time-selector {
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 6px;
        background: var(--button-bg-color, #1a1a1a);
        color: var(--button-text-color, white);
        font-size: 13px;
        font-weight: 500;
        min-width: 70px;
        border: 1px solid transparent;
    }

    .time-selector:hover {
        opacity: 0.9;
    }

    .time-label {
        color: var(--button-text-color, white);
    }

    .dropdown-arrow {
        font-size: 10px;
        transition: transform 0.2s ease;
        color: var(--button-text-color, white);
        margin-left: auto;
    }

    .dropdown-arrow.open {
        transform: rotate(180deg);
    }

    .time-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: var(--bg-color, white);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100;
        min-width: 90px;
    }

    .time-option {
        display: block;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 13px;
        color: var(--text-color, #333);
        transition: background 0.15s ease;
        touch-action: manipulation; /* Prevents double-tap zoom on mobile */
    }

    .time-option:hover {
        background: var(--hover-color, #f5f5f5);
    }

    .time-option.selected {
        background: var(--accent-color, #4a90d9);
        color: white;
    }

    .dropdown-divider {
        height: 1px;
        background: var(--border-color, #ddd);
        margin: 4px 0;
    }

    .custom-option {
        font-style: italic;
        opacity: 0.85;
    }

    .custom-input-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
    }

    .custom-time-input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 4px;
        font-size: 16px; /* Prevents iOS auto-zoom on focus */
        background: var(--bg-color, white);
        color: var(--text-color, #333);
        text-align: center;
        width: 50px;
    }

    .custom-time-input:focus {
        outline: none;
        border-color: var(--accent-color, #4a90d9);
        box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
    }

    .custom-time-input::placeholder {
        color: var(--text-muted, #999);
        font-size: 11px;
    }

    .start-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        background: linear-gradient(135deg, #e85d04, #dc2f02);
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        touch-action: manipulation; /* Prevents double-tap zoom on mobile */
    }

    .start-btn:hover {
        background: linear-gradient(135deg, #dc2f02, #9d0208);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(232, 93, 4, 0.4);
    }

    .start-btn:active {
        transform: translateY(0);
    }

    .cancel-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        background: var(--button-bg-color, #e0e0e0);
        color: var(--text-color, #333);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        touch-action: manipulation; /* Prevents double-tap zoom on mobile */
    }

    .cancel-btn:hover {
        background: var(--hover-color, #d0d0d0);
    }

    @media (max-width: 480px) {
        .countdown-setup {
            flex-direction: column;
            padding: 6px;
        }

        .start-btn,
        .time-selector {
            width: 100%;
            justify-content: center;
        }

        .time-dropdown {
            left: 0;
            right: 0;
            min-width: 120px;
            transform: none;
        }

        .custom-input-row {
            padding: 8px 10px;
        }

        .custom-time-input {
            width: 100%;
            min-width: 60px;
            padding: 8px 10px;
            font-size: 16px; /* Prevents iOS auto-zoom on focus */
        }
    }
</style>
