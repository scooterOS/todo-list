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
    var targetTodo = null;
    var header = '';
    var state = State.EMPTY;

    function init() {
        var project = storage.loadFirstProject();
        if (!project) {
            project = Project.getDefault();
            pubsub.publish('add-project', project);
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

    function viewTodos(viewMode, todos) {
        if (todos === null) return;

        // View todos
        console.log()
        setTodosViewed(todos, viewMode);
        render();
    }

    function searchTodos(inputStr) {
        // Load todos
        const todos = storage.loadTodos((todo) => {
            return todo.title.includes(inputStr) || todo.desc.includes(inputStr);
        });
        // View todos
        setTodosViewed(todos, `Search result for "${inputStr}"`);
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
            renderEmpty();
            return;
        }
        if (state === State.PROJECT) {
            renderProject();
            return;
        }
        if (state === State.VIEW) {
            renderView();
            return;
        }
    }

    function renderEmpty() {
        const $noProject = renderer.addElement($content, 'div', '', ['no-project']);
        renderer.addElement($noProject, 'h2', 'You currently have no projects! 😧 Click here to add a project.');
        $noProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
    }

    function renderProject() {
        // Add content header
        const $projectHeader = renderer.addElement($content, 'div', '', ['spaced', 'title', 'row']);
        renderer.addElement($projectHeader, 'h1', header);
        const $buttonList = renderer.addElement($projectHeader, 'span', '', ['button-list']);
        const $newTodo = renderer.addElement($buttonList, 'button', '', ['new-todo', 'icon'], { alt: 'New Task', title: 'new task' });
        const $editProject = renderer.addElement($buttonList, 'button', '', ['edit-project', 'icon'], { alt: 'Edit Project', title: 'edit project' });
        const $deleteProject = renderer.addElement($buttonList, 'button', '', ['delete-project', 'icon'], { alt: 'Delete Project', title: 'delete project' });

        // Add project description
        const $projectDesc = renderer.addElement($content, 'div', '', ['project-desc']);
        renderer.addElement($projectDesc, 'h4', currentProject.desc);

        // Add tags
        const $tagRow = renderer.addElement($content, 'div', '', ['row']);
        for (let tag of currentProject.tags) {
            renderer.addElement($tagRow, 'p', tag, ['project-tag']);
        }
        // Add container for todo items
        const $todoContainer = renderer.addElement($content, 'div', '', ['todo-container']);

        // Add event listeners
        $newTodo.addEventListener('click', () => pubsub.publish('new-todo-popup'));
        $editProject.addEventListener('click', () => pubsub.publish('edit-project-popup', currentProject));
        $deleteProject.addEventListener('click', () => pubsub.publish('remove-project-popup', currentProject));


        for (let todo of currentTodos) {
            // Create todo element
            const $todoItem = renderer.addElement($todoContainer, 'div', '', ['todo-item']);

            // Add todo header
            const $todoHeader = renderer.addElement($todoItem, 'div', '', ['spaced', 'title', 'row']);
            const $todoBullet = renderer.addElement($todoHeader, 'span', '', ['option']);
            const $checkbox = renderer.addElement($todoBullet, 'input', '', ['todo-check'], { type: 'checkbox' });
            $checkbox.checked = todo.complete;
            renderer.addElement($todoBullet, 'h2', todo.title);
            const $btnList = renderer.addElement($todoHeader, 'span', '', ['button-list']);
            const $editTodo = renderer.addElement($btnList, 'button', '', ['edit-todo', 'icon'], { alt: 'Edit Task', title: 'edit task' });
            const $copyTodo = renderer.addElement($btnList, 'button', '', ['copy-todo', 'icon'], { alt: 'Copy Task', title: 'copy task' });
            const $deleteTodo = renderer.addElement($btnList, 'button', '', ['delete-todo', 'icon'], { alt: 'Delete Task', title: 'delete task' });

            // Add todo info
            const $todoInfo = renderer.addElement($todoItem, 'div', '', ['evenly', 'row']);
            renderer.addElement($todoInfo, 'h5', todo.getDeadlineText(), ['todo-deadline']);
            renderer.addElement($todoInfo, 'h5', todo.getPriorityText(), ['todo-priority']);

            // Add todo description
            if (todo.equals(targetTodo)) {
                const $todoDesc = renderer.addElement($todoItem, 'div', '');
                renderer.addElement($todoDesc, 'h4', todo.desc, ['todo-desc']);
            }

            // Add event listeners
            $checkbox.addEventListener('click', () => {
                todo.markComplete();
                storage.saveProject(currentProject);
                render();
            });
            $editTodo.addEventListener('click', () => pubsub.publish('edit-todo-popup', todo));
            $copyTodo.addEventListener('click', () => addTodo(todo.copy()));
            $deleteTodo.addEventListener('click', () => removeTodo(todo));
        }
    }

    function renderView() {

        const $header = renderer.addElement($content, 'div', '', ['title']);
        renderer.addElement($header, 'h1', header);
        const $todoContainer = renderer.addElement($content, 'div', '', ['todo-container']);

        for (let todo of currentTodos) {
            // Create todo element
            const $todoItem = renderer.addElement($todoContainer, 'div', '', ['todo-item']);

            // Add todo header
            const $todoHeader = renderer.addElement($todoItem, 'div', '', ['title', 'row']);
            const $todoBullet = renderer.addElement($todoHeader, 'span', '', ['option']);
            const $checkbox = renderer.addElement($todoBullet, 'input', '', ['todo-check'], { type: 'checkbox', disabled: true });
            $checkbox.checked = todo.complete;
            renderer.addElement($todoBullet, 'h2', todo.title);

            // Add todo info
            const $todoInfo = renderer.addElement($todoItem, 'div', '', ['evenly', 'row']);
            renderer.addElement($todoInfo, 'h5', todo.getDeadlineText(), ['todo-deadline']);
            renderer.addElement($todoInfo, 'h5', todo.getPriorityText(), ['todo-priority']);

            // Add todo description
            if (todo.equals(targetTodo)) {
                const $todoDesc = renderer.addElement($todoItem, 'div', '');
                renderer.addElement($todoDesc, 'h4', todo.desc, ['todo-desc']);
            }
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
    pubsub.subscribe('search-todos', searchTodos);
    pubsub.subscribe('add-todo', addTodo);
    pubsub.subscribe('edit-todo', editTodo);
    pubsub.subscribe('sort-alpha', sortAlpha);
    pubsub.subscribe('sort-date', sortDate);
    pubsub.subscribe('sort-priority', sortPriority);
    pubsub.subscribe('sort-completed', sortCompleted);

})();