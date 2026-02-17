import pubsub from './pubsub.js';
import renderer from './render.js';


const State = {
    EMPTY: 0,   // No projects yet
    PROJECT: 1, // Edit project
    VIEW: 2,    // View todos from any project
};


(function() {
    const $toolbar = document.getElementById('toolbar');
    var state = State.EMPTY;
    var sortMenuOpen = false;
    
    function openProject() {
        state = State.PROJECT;

        render();
    }

    function viewTodos() {
        state = State.VIEW;

        render();
    }

    function clickSortMenu() {
        sortMenuOpen = !sortMenuOpen;
        
        render();
    }

    function render() {
        renderer.clearContents($toolbar);

        if (state === State.PROJECT) {
            renderProject();
        }
        else if (state === State.VIEW) {
            renderView();
        }
        if (sortMenuOpen) {
            renderSortMenu();
        }
    }

    function renderProject() {
        // Add buttons
        const $newTodo = renderer.addElement($toolbar, 'button', 'New Task', ['new-task', 'icon']);
        const $newProject = renderer.addElement($toolbar, 'button', 'New Project', ['new-project', 'icon']);
        const $editProject = renderer.addElement($toolbar, 'button', 'Edit', ['edit-project', 'icon']);
        const $sortTodos = renderer.addElement($toolbar, 'button', 'Sort', ['sort', 'icon']);
        const $deleteProject = renderer.addElement($toolbar, 'button', 'Delete', ['delete-project', 'icon']);

        // Add event listeners
        $newTodo.addEventListener('click', () => pubsub.publish('new-todo-popup'));
        $newProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
        $editProject.addEventListener('click', () => pubsub.publish('edit-project-request'));
        $sortTodos.addEventListener('click', () => clickSortMenu());
        $deleteProject.addEventListener('click', () => pubsub.publish('remove-project-request'));
    }

    function renderView() {
        // Add buttons and input
        const $newProject = renderer.addElement($toolbar, 'button', 'New Project', ['new-project', 'icon']);
        const $sortTodos = renderer.addElement($toolbar, 'button', 'Sort', ['sort', 'icon']);
        const $search = renderer.addElement($toolbar, 'button', '', ['search', 'icon']);
        const $searchbar = renderer.addElement($toolbar, 'input', '', ['searchbar']);

        // Add event listeners
        $newProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
        $sortTodos.addEventListener('click', () => clickSortMenu());
        $search.addEventListener('click', () => pubsub.publish('search-todos', $searchbar.textContent));
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
        $alpha.addEventListener('click', () => pubsub.publish('sort-alpha', $reverse.checked));
        $date.addEventListener('click', () => pubsub.publish('sort-date', $reverse.checked));
        $priority.addEventListener('click', () => pubsub.publish('sort-priority', $reverse.checked));
        $completed.addEventListener('click', () => pubsub.publish('sort-completed', $reverse.checked));
    }

    // Subscribe to events
    pubsub.subscribe('init', openProject);
    pubsub.subscribe('open-project', openProject);
    pubsub.subscribe('view-todos', viewTodos);

})();