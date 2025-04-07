(function () {
    // --- Configuration & State ---

    const COLLAPSED_HEIGHT = 400; // Default height for collapsed code blocks in pixels
    const EDIT_PAGE_IDENTIFIER = '/functions'; // URL path identifier for the page where the script should be disabled

    let isCurrentlyEditPage = checkIsEditPage();
    let mutationObserverActive = false;
    const observedCodeBlocks = new WeakSet(); // Keep track of editors we've already initialized

    // --- Core Logic Functions ---

    /**
     * Checks if the current browser URL indicates the user is on the specified "edit page".
     * @returns {boolean} True if on the edit page, false otherwise.
     */
    function checkIsEditPage() {
        return window.location.href.includes(EDIT_PAGE_IDENTIFIER);
    }

    /**
     * Handles actions needed when the URL route changes (e.g., SPA navigation).
     * Disables observation on the edit page, enables it elsewhere.
     */
    function onRouteChange() {
        isCurrentlyEditPage = checkIsEditPage();
        if (isCurrentlyEditPage) {
            // If we navigated TO the edit page, stop observing DOM changes
            if (mutationObserverActive) {
                mutationObserver.disconnect();
                mutationObserverActive = false;
                // console.log('MutationObserver disconnected on edit page.');
            }
        } else {
            // If we navigated AWAY from the edit page (or are initially not on it),
            // ensure all current code blocks are initialized and start observing.
            initializeAllCodeBlocks();
            if (!mutationObserverActive) {
                mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                mutationObserverActive = true;
                // console.log('MutationObserver connected.');
            }
        }
    }

    /**
     * Checks a specific CodeMirror editor instance and adds the expand/collapse button if needed.
     * @param {HTMLElement} editorRoot - The root element of the CodeMirror editor instance (.cm-editor).
     */
    function updateCodeBlock(editorRoot) {
        // Don't add a button if one already exists
        if (editorRoot.querySelector('.code-expand-btn')) {
            return;
        }

        // Check if the actual content height exceeds the threshold
        const scrollHeight = editorRoot.scrollHeight;
        if (scrollHeight > COLLAPSED_HEIGHT) {
            editorRoot.id = 'collapsed'; // Mark as initially collapsed
            editorRoot.style.height = `${COLLAPSED_HEIGHT}px`; // Set initial collapsed height

            // Create and append the expand/collapse button
            const expandBtn = document.createElement('button');
            expandBtn.className = 'code-expand-btn';
            expandBtn.id = 'collapsed'; // Sync button state with editor state
            // expandBtn.textContent is handled by CSS ::before and ::after pseudo-elements
            editorRoot.appendChild(expandBtn);
        }
        // else {
        // If height is within limits, ensure no collapse state is applied (optional cleanup)
        // if (editorRoot.id === 'collapsed') {
        //     editorRoot.removeAttribute('id');
        //     editorRoot.style.removeProperty('height');
        // }
        // }
    }

    /**
     * Initializes a single CodeMirror editor instance: adds it to the observed set,
     * sets up ResizeObserver, and calls updateCodeBlock.
     * @param {HTMLElement} editorRoot - The root element of the CodeMirror editor instance.
     */
    function initializeCodeBlock(editorRoot) {
        if (observedCodeBlocks.has(editorRoot) || !editorRoot.classList.contains('cm-editor')) {
            return; // Already processed or not a valid editor root
        }
        observedCodeBlocks.add(editorRoot);
        resizeObserver.observe(editorRoot); // Start observing for size changes
        updateCodeBlock(editorRoot); // Perform initial check and potential button addition
    }

    /**
     * Finds and initializes all CodeMirror editor instances currently in the DOM.
     * Skips initialization if on the edit page.
     */
    function initializeAllCodeBlocks() {
        if (isCurrentlyEditPage) return;
        document.querySelectorAll('.cm-editor').forEach(initializeCodeBlock);
    }

    // --- Observers ---

    /**
     * Observes changes in the size of code editor elements.
     * Needed if content loads asynchronously causing height changes after initial load.
     */
    const resizeObserver = new ResizeObserver((entries) => {
        if (isCurrentlyEditPage) return; // Don't run on edit page
        for (const entry of entries) {
            const editorRoot = entry.target;
            // Double check it's the element we expect
            if (!editorRoot.classList.contains('cm-editor')) continue;
            // Re-evaluate if the button is needed (e.g., content loaded making it taller)
            // Note: This simple version doesn't handle shrinking well (button remains).
            // A more robust version might remove the button if it shrinks below threshold.
            updateCodeBlock(editorRoot);
        }
    });

    /**
     * Observes changes in the DOM structure (nodes added/removed).
     * Crucial for handling dynamically added content, like new chat messages with code blocks.
     */
    const mutationObserver = new MutationObserver((mutations) => {
        if (isCurrentlyEditPage) return; // Don't run on edit page

        let hasNewCodeBlocks = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // Only process element nodes
                if (node.nodeType !== 1) return;

                // Check if the added node itself is a code editor
                if (node.classList?.contains('cm-editor')) {
                    initializeCodeBlock(node);
                    hasNewCodeBlocks = true;
                } else {
                    // Check if the added node *contains* any code editors
                    const newEditors = node.querySelectorAll?.('.cm-editor') || [];
                    newEditors.forEach((el) => {
                        initializeCodeBlock(el);
                        hasNewCodeBlocks = true;
                    });
                }
            });
        });

        // If new blocks were added, potentially run initialization again slightly delayed
        // This can catch edge cases, though often initializeCodeBlock handles it directly.
        // if (hasNewCodeBlocks) {
        //     requestAnimationFrame(initializeAllCodeBlocks);
        // }
    });

    // --- Event Listeners ---

    /**
     * Handles clicks on the dynamically added expand/collapse buttons.
     */
    document.addEventListener('click', function (evt) {
        // Ignore clicks on anything other than our specific button
        if (!evt.target.classList.contains('code-expand-btn')) return;

        const button = evt.target;
        const editorRoot = button.closest('.cm-editor'); // Find the parent editor
        if (!editorRoot) return; // Should not happen if structure is correct

        const isCollapsed = editorRoot.id === 'collapsed';

        // Use requestAnimationFrame to ensure smooth transition and accurate height calculation
        requestAnimationFrame(() => {
            if (isCollapsed) {
                // Expand: Set height to full scroll height
                const scroller = editorRoot.querySelector('.cm-scroller');
                if (scroller) {
                    editorRoot.style.height = `${scroller.scrollHeight}px`;
                } else {
                    // Fallback if scroller isn't found (less accurate)
                    editorRoot.style.height = 'auto';
                }
                editorRoot.id = 'expanded';
                button.id = 'expanded';
            } else {
                // Collapse: Set height back to the fixed collapsed height
                editorRoot.style.height = `${COLLAPSED_HEIGHT}px`;
                editorRoot.id = 'collapsed';
                button.id = 'collapsed';

                // Smoothly scroll the container so the top of the collapsed block is visible
                const scrollTarget = editorRoot.closest('.relative.my-2')?.parentElement; // Heuristic selector for chat message container
                scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 'start' or 'nearest' might be preferred
            }
        });
    });

    /**
     * Intercepts SPA navigation to trigger route change logic.
     */
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
        originalPushState.apply(history, arguments);
        onRouteChange(); // Call our handler after the state changes
    };
    window.addEventListener('popstate', onRouteChange); // Handle browser back/forward buttons

    // --- Initialization ---

    /**
     * Main initialization function.
     */
    function init() {
        isCurrentlyEditPage = checkIsEditPage(); // Check initial page state
        if (!isCurrentlyEditPage) {
            initializeAllCodeBlocks(); // Process existing code blocks on load
            // Start observing the DOM for changes only if not on the edit page initially
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            mutationObserverActive = true;
            // console.log('Initial MutationObserver connected.');
        } else {
            // console.log('Initial load on edit page, MutationObserver not started.');
        }
    }

    // Wait for the DOM to be ready or run immediately if already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // --- Basic Error Logging ---
    window.addEventListener('error', (error) => {
        console.error('Code block enhancement script error:', error);
    });
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection in code block script:', event.reason);
    });

})(); // End of IIFE