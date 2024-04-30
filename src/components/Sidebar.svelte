<script>
    let isOpen = true;

    function toggleSidebar() {
        isOpen = !isOpen;
    }
</script>

<div class="sidebar-container">
    <button
        class="toggle-btn"
        class:open={isOpen}
        on:click={toggleSidebar}
        style="right:-40px"
    >
        {isOpen ? "<" : ">"}
    </button>
    <div class="sidebar" class:open={isOpen}>
        {#if isOpen}
            <div class="sidebar-content">
                <h2>Kanoodle</h2>
                <p>
                    1. Drag and drop the pieces onto the board. You can also
                    drag pieces already on the board.
                </p>
                <p>
                    2. Rotate and flip the pieces using the buttons or keyboard
                    shortcuts (R to rotate, F to flip).
                </p>
                <p>3. Try to fill the entire board with the pieces.</p>
                <p>
                    4. Check if a board is solvable with the "Solvable?" button,
                    click the "Hint" button to place one piece, or click the
                    "Solve" button to fully solve.
                </p>

                <br />
                <p>
                    Inspired by <a
                        href="https://andywarduk.github.io/KanoodleJs"
                        >https://andywarduk.github.io/KanoodleJs</a
                    >
                </p>
            </div>
        {/if}
    </div>
</div>

<style>
    .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
    }

    .sidebar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 350px;
        background-color: #4c4a4a;
        transition: transform 0.3s ease-in-out;
        transform: translateX(-100%);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .toggle-btn {
        position: absolute;
        top: 10px;
        padding: 5px 10px;
        font-size: 12px;
        z-index: 1;
        transition: transform 0.3s ease-in-out;
        transform: translateX(0);
    }

    .toggle-btn.open {
        transform: translateX(300px);
    }

    .sidebar-content {
        padding: 20px;
    }
</style>
