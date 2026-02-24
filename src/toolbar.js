import pubsub from './pubsub.js';
import renderer from './render.js';


(function() {
    const $toolbar = document.getElementById('toolbar');
    var sortMenuOpen = false;

    function clickSortMenu() {
        sortMenuOpen = !sortMenuOpen;
        
        render();
    }

    function clickSortButton(sortName, reverse) {
        sortMenuOpen = false;
        pubsub.publish('sort-' + sortName, reverse);

        render();
    }

    function render() {
        renderer.clearContents($toolbar);

        renderToolbar();

        if (sortMenuOpen) {
            renderSortMenu();
        }
    }

    function renderToolbar() {
        // Add buttons
        const $newProject = renderer.addElement($toolbar, 'button', '', ['option']);
        renderer.addElement($newProject, 'div', '', ['new-project', 'icon']);
        renderer.addElement($newProject, 'h3', 'New Project');
        const $sortTodos = renderer.addElement($toolbar, 'button', '', ['option']);
        renderer.addElement($sortTodos, 'div', '', ['sort-todos', 'icon']);
        renderer.addElement($sortTodos, 'h3', 'Sort');
        const $search = renderer.addElement($toolbar, 'button', '', ['search', 'icon']);
        const $searchbar = renderer.addElement($toolbar, 'input', '', ['searchbar']);

        // Add event listeners
        $newProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
        $sortTodos.addEventListener('click', () => clickSortMenu());
        $search.addEventListener('click', () => pubsub.publish('search-todos', $searchbar.value.trim()));
        $searchbar.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                const userStr = $searchbar.value.trim();
                if (userStr)
                    pubsub.publish('search-todos', userStr);
            }
        });
        $searchbar.addEventListener('click', () => $searchbar.select());
    }

    function renderSortMenu() {
        // Create and position sort menu
        const rect = $toolbar.querySelector('.sort').getBoundingClientRect();
        const $sortMenu = renderer.addElement($toolbar, 'div', '', ['submenu']);
        $sortMenu.style.top = `${rect.bottom}px`;
        $sortMenu.style.left = `${rect.left}px`;
        $sortMenu.style.transform = 'translateX(-50%)';

        // Add buttons
        const $alpha = renderer.addElement($sortMenu, 'button', '', ['sort-alpha', 'icon']);
        const $date = renderer.addElement($sortMenu, 'button', '', ['sort-date', 'icon']);
        const $priority = renderer.addElement($sortMenu, 'button', '', ['sort-priority', 'icon']);
        const $completed = renderer.addElement($sortMenu, 'button', '', ['sort-completed', 'icon']);
        const $reverse = renderer.addElement($sortMenu, 'input', 'Reverse?', ['reverse'], { 'type': 'checkbox' });

        // Add event listeners
        $alpha.addEventListener('click', () => clickSortButton('alpha', $reverse.checked));
        $date.addEventListener('click', () => clickSortButton('date', $reverse.checked));
        $priority.addEventListener('click', () => clickSortButton('priority', $reverse.checked));
        $completed.addEventListener('click', () => clickSortButton('completed', $reverse.checked));
    }

    // Subscribe to events
    pubsub.subscribe('init', render);

})();