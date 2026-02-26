import pubsub from './pubsub.js';


(function() {
    const $toolbar = document.getElementById('toolbar');
    const $searchbar = document.getElementById('searchbar');
    const $sortMenu = document.getElementById('sort-menu');
    const $sortReverse = document.getElementById('sort-reverse');

    function toggleSortMenu() {
        if ($sortMenu.classList.contains('hidden')) {
            $sortMenu.classList.remove('hidden');
        } else {
            $sortMenu.classList.add('hidden');
        }
    }

    function handleToolbarClick(ev) {
        if (ev.target.closest('.new-project')) {
            pubsub.publish('new-project-popup');
            return;
        }
        if (ev.target.closest('.sort-todos')) {
            toggleSortMenu();
            return;
        }
        if (ev.target.closest('.search')) {
            pubsub.publish('search-todos', $searchbar.value.trim());
            return;
        }
        if (ev.target.closest('#searchbar')) {
            $searchbar.select();
            return;
        }
    }

    function handleSortMenuClick(ev) {
        if (ev.target.closest('.sort-alpha')) {
            pubsub.publish('sort-alpha', $sortReverse.checked);
            return;
        }
        if (ev.target.closest('.sort-date')) {
            pubsub.publish('sort-date', $sortReverse.checked);
            return;
        }
        if (ev.target.closest('.sort-priority')) {
            pubsub.publish('sort-priority', $sortReverse.checked);
            return;
        }
        if (ev.target.closest('.sort-completed')) {
            pubsub.publish('sort-completed', $sortReverse.checked);
            return;
        }
        if (ev.target.closest('.close')) {
            $sortMenu.classList.add('hidden');
        }
    }

    function handleSearchEvent(ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            const inputStr = $searchbar.value.trim();
            if (inputStr)
                pubsub.publish('search-todos', inputStr);
        }
    }

    // Add event listeners
    $toolbar.addEventListener('click', handleToolbarClick);
    $sortMenu.addEventListener('click', handleSortMenuClick);
    $searchbar.addEventListener('keydown', handleSearchEvent);

})();