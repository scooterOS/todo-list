import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';
import { TodoItem, Project } from './project.js';


const State = {
    WAIT: 0,    // Wait for external events to resolve
    PROJECT: 1, // Edit project
    VIEW: 2,    // View todos from any project
};


(function() {
    const $content = document.getElementById('content');
    var currentProject = null;
    var currentTodos = [];
    var header = '';
    var state = State.WAIT;
    var lastState = State.WAIT;
    var saved = true;

    function init() {
        setCurrentProject(storage.loadFirstProject() || Project.getDefault());
        state = State.PROJECT;

        render();
    }
    
    function freeze() {
        if (state === State.WAIT) return;

        lastState = state;
        state = State.WAIT;
    }

    function thaw() {
        state = lastState;
    }

    function setCurrentProject(project) {
        if (!(project instanceof Project)) return;

        currentProject = project;
        currentTodos = project.todos;
        header = project.title;
    }

    function openProject(project) {
        if (project.equals(currentProject)) return;
        if (!(project instanceof Project) || state === State.WAIT) {
            console.warn("Error: Cannot open project.");
            return;
        }
        state = State.PROJECT;

        if (currentProject && !saved) {
            storage.saveProject(currentProject);
        }
        setCurrentProject(project);
        render();
    }

    function editProject(projectData) {
        //...
    }

    function removeProject(project) {
        if (project.equals(currentProject)) {
            setCurrentProject(storage.loadFirstProject());
        }
    }

    function onExit() {
        if (!currentProject) {
            console.warn("Error: Cannot save project.");
            return;
        }
        storage.saveProject(currentProject);
    }

    function viewTodos(todoData) {
        // param: { todos: TodoList, title: TodoName }
        if (!(todoData.todos instanceof Array) || state === State.WAIT) {
            console.warn("Error: Cannot view todos.");
            return;
        }
        state = State.VIEW;

        if (currentProject && !saved) {
            storage.saveProject(currentProject);
        }
        currentProject = null;
        currentTodos = todoData.todos;
        header = todoData.title;

        render();
    }

    function addTodo(todo) {
        if (!(todo instanceof TodoItem) || state !== State.PROJECT) {
            console.warn("Error: Cannot add todo item.");
            return;
        }
        currentTodos.push(todo);
        saved = false;
    }

    function removeTodo(todo) {
        const index = currentTodos.findIndex(t => t.equals(todo));
        if (index === -1 || state !== State.PROJECT) {
            console.warn("Error: Cannot remove todo item.");
            return;
        }
        currentTodos.splice(index, 1);
        saved = false;
    }

    function editTodo(todoData) {
        // param: { old: OldTodo, new: NewTodo }
        const index = currentTodos.findIndex(t => t.equals(todoData.old));
        if (index === -1 || !(todoData.new instanceof TodoItem) || state !== State.PROJECT) {
            console.warn("Error: Cannot edit todo item.");
            return;
        }
        currentTodos.splice(index, 1, todoData.new);
        saved = false;
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
        currentTodos.sort((a, b) => (a.complete && b.complete)? 0 : a.copmlete? mult : b.complete? -mult : 0);
    
        render();
    }

    function render() {
        if (state === State.WAIT) return;

        renderer.clearContents($content);

        const $header = renderer.addElement($content, 'div', '', ['title']);
        renderer.addElement($header, 'h1', header);

        for (let todo of currentTodos) {
            // Add todo elements
            const $todoElem = renderer.addElement($content, 'div', '', ['todo-item']);
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
            $checkbox.addEventListener('click', () => todo.markComplete());
            $editBtn.addEventListener('click', () => pubsub.publish('edit-todo-popup', todo));
            $copyBtn.addEventListener('click', () => addTodo(todo.copy()));
            $deleteBtn.addEventListener('click', () => removeTodo(todo));
        }
    }

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('freeze', freeze);
    pubsub.subscribe('thaw', thaw);
    pubsub.subscribe('open-project', openProject);
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