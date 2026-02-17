import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';
import { Project } from './project.js';


const State = {
    EMPTY: 0,   // No projects yet
    PROJECT: 1, // Edit project
    VIEW: 2,    // View todos from any project
};


(function() {
    const $content = document.getElementById('content');
    var currentProject = null;
    var currentTodos = [];
    var header = '';
    var state = State.EMPTY;

    function init() {
        var project = storage.loadFirstProject();
        if (!project) {
            project = Project.getDefault();
            storage.saveProject(project);
        }
        setCurrentProject(project);
        render();
    }

    function setCurrentProject(project) {
        state = State.PROJECT;
        currentProject = project;
        currentTodos = project.todos;
        header = project.title;
    }

    function setTodosViewed(todos, viewMode) {
        state = State.VIEW;
        currentProject = null;
        currentTodos = todos;
        header = viewMode;
    }

    function openProject(project) {
        if (!project) return;

        // Load new project
        setCurrentProject(project);
        render();
    }

    function editProject(oldProject, newProject) {
        if (!oldProject || !newProject) return;
        if (oldProject.id !== newProject.id) {
            console.warn(`Error: Cannot replace project with a different id: ${newProject}`);
            return;
        }
        // Load and update project
        setCurrentProject(newProject);
        storage.saveProject(newProject);
        render();
    }

    function addProject(project) {
        if (!project) return;
        
        // Save and open the new project
        storage.saveProject(project);
        setCurrentProject(project);
        render();
    }

    function removeProject(project) {
        // Load first project, if any
        const newProject = storage.loadFirstProject();
        if (newProject) {
            setCurrentProject(newProject);
        } else {
            state = State.EMPTY;
        }
        render();
    }

    function onExit() {
        if (!currentProject) return;

        storage.saveProject(currentProject);
    }

    function viewTodos(todos) {
        if (todos === null) return;

        // Load todos
        setTodosViewed(todos);
        render();
    }

    function addTodo(todo) {
        if (!todo || state !== State.PROJECT) return;

        // Add todo item and save project
        currentTodos.push(todo);
        storage.saveProject(currentProject);
        render();
    }

    function removeTodo(todo) {
        if (state !== State.PROJECT) return;
        const index = currentTodos.findIndex(t => t.equals(todo));
        if (index === -1) {
            console.warn(`Error: Cannot remove missing todo item.`);
            return;
        }
        // Remove todo item and save project
        currentTodos.splice(index, 1);
        storage.saveProject(currentProject);
        render();
    }

    function editTodo(oldTodo, newTodo) {
        if (!newTodo || state !== State.PROJECT) return;
        const index = currentTodos.findIndex(t => t.equals(oldTodo));
        if (index === -1) {
            console.warn(`Error: Cannot replace missing todo item.`);
            return;
        }
        // Replace with new todo item and save project
        currentTodos.splice(index, 1, newTodo);
        storage.saveProject(currentProject);
        render();
    }

    function sortAlpha(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()) * mult);
    
        render();
    }

    function sortDate(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.deadline - b.deadline) * mult);

        render();
    }

    function sortPriority(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.priority - b.priority) * mult);

        render();
    }

    function sortCompleted(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.complete && b.complete)? 0 : a.complete? mult : b.complete? -mult : 0);
    
        render();
    }

    function render() {
        renderer.clearContents($content);

        if (state === State.EMPTY) {
            const $noProject = renderer.addElement($content, 'div', '', ['no-project']);
            renderer.addElement($noProject, 'h2', 'You currently have no projects! 😧 Click here to add a project.');
            $noProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
            return;
        }

        const $header = renderer.addElement($content, 'div', '', ['title']);
        renderer.addElement($header, 'h1', header);
        const $todoContainer = renderer.addElement($content, 'div', '', ['todo-container']);

        for (let todo of currentTodos) {
            // Add todo elements
            const $todoElem = renderer.addElement($todoContainer, 'div', '', ['todo-item']);
            const $todoRow = renderer.addElement($todoElem, 'div', '', ['row']);
            const $checkbox = renderer.addElement($todoRow, 'input', '', [], { 'type': 'checkbox' });
            renderer.addElement($todoRow, 'h2', todo.title, ['todo-title']);
            renderer.addElement($todoRow, 'span', todo.getDeadlineText(), ['todo-deadline']);
            renderer.addElement($todoRow, 'span', todo.getPriorityText(), ['todo-priority']);
            renderer.addElement($todoElem, 'span', todo.desc, ['todo-desc']);

            // Mark if complete
            $checkbox.checked = todo.complete;

            if (state !== State.PROJECT) continue;

            // Add buttons if editing project
            const $editBtn = renderer.addElement($todoRow, 'button', '', ['edit-btn']);
            const $copyBtn = renderer.addElement($todoRow, 'button', '', ['copy-btn']);
            const $deleteBtn = renderer.addElement($todoRow, 'button', '', ['delete-btn']);

            // Add event listeners
            $checkbox.addEventListener('click', () => {
                todo.markComplete();
                storage.saveProject(currentProject);
                render();
            });
            $editBtn.addEventListener('click', () => pubsub.publish('edit-todo-popup', todo));
            $copyBtn.addEventListener('click', () => addTodo(todo.copy()));
            $deleteBtn.addEventListener('click', () => removeTodo(todo));
        }
    }

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('open-project', openProject);
    pubsub.subscribe('add-project', addProject);
    pubsub.subscribe('edit-project', editProject);
    pubsub.subscribe('remove-project', removeProject);
    pubsub.subscribe('exit', onExit);
    pubsub.subscribe('view-todos', viewTodos);
    pubsub.subscribe('add-todo', addTodo);
    pubsub.subscribe('edit-todo', editTodo);
    pubsub.subscribe('sort-alpha', sortAlpha);
    pubsub.subscribe('sort-date', sortDate);
    pubsub.subscribe('sort-priority', sortPriority);
    pubsub.subscribe('sort-completed', sortCompleted);

    // Forward events
    pubsub.subscribe('edit-project-request', () => pubsub.publish('edit-project-popup', currentProject));
    pubsub.subscribe('remove-project-request', () => pubsub.publish('remove-project-popup', currentProject));
    
})();