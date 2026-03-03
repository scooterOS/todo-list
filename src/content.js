import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';
import { Project } from './project.js';


(function() {
    const $projectHeader = document.getElementById('project-header');
    const $todoContainer = document.getElementById('todo-container');

    var currentProject = null;
    var currentTodos = [];
    var header = '';

    function init() {
        var project = storage.loadFirstProject();
        if (!project) {
            project = Project.getDefault();
            pubsub.publish('add-project', project);
        }
        setCurrentProject(project);
        renderAll();
    }

    function setCurrentProject(project) {
        currentProject = project;
        currentTodos = project.todos;
        header = project.title;
    }

    function setTodosViewed(todos, viewMode) {
        currentProject = null;
        currentTodos = todos;
        header = viewMode;
    }

    function openProject(project) {
        if (!project) return;

        // Load new project
        setCurrentProject(project);
        renderAll();
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
        renderProjectShell();
    }

    function addProject(project) {
        if (!project) return;
        
        // Save and open the new project
        storage.saveProject(project);
        setCurrentProject(project);
        renderAll();
    }

    function removeProject(project) {
        // Load first project, if any
        const newProject = storage.loadFirstProject();
        if (newProject) {
            setCurrentProject(newProject);
            renderAll();
        } else {
            renderEmpty();
        }
    }

    function onExit() {
        if (!currentProject) return;

        storage.saveProject(currentProject);
    }

    function viewTodos(viewMode, todos) {
        if (todos === null) return;

        // View todos
        setTodosViewed(todos, viewMode);
        renderProjectShell(false);
        renderTodoContainer(false);
    }

    function searchTodos(inputStr) {
        // Load todos
        const todos = storage.loadTodos((todo) => {
            return todo.title.toLowerCase().includes(inputStr) || todo.desc.toLowerCase().includes(inputStr);
        });
        // View todos
        setTodosViewed(todos, `Search result for "${inputStr}"`);
        renderProjectShell(false);
        renderTodoContainer(false);
    }

    function addTodo(todo) {
        if (!todo) return;

        // Add todo item and save project
        currentTodos.push(todo);
        storage.saveProject(currentProject);
        addTodoElement(todo);
    }

    function removeTodo(todo) {
        const index = currentTodos.findIndex(t => t.equals(todo));
        if (index === -1) {
            console.warn(`Error: Cannot remove missing todo item.`);
            return;
        }
        // Remove todo item and save project
        currentTodos.splice(index, 1);
        storage.saveProject(currentProject);
        removeTodoElement(todo);
    }

    function editTodo(oldTodo, newTodo) {
        if (!newTodo) return;
        const index = currentTodos.findIndex(t => t.equals(oldTodo));
        if (index === -1) {
            console.warn(`Error: Cannot replace missing todo item.`);
            return;
        }
        // Replace with new todo item and save project
        currentTodos.splice(index, 1, newTodo);
        storage.saveProject(currentProject);
        replaceTodoElement(oldTodo, newTodo);
    }

    function toggleTodo(todo) {
        todo.toggleComplete();
        storage.saveProject(currentProject);
    }

    function sortAlpha(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()) * mult);
    
        renderTodoContainer();
    }

    function sortDate(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.deadline - b.deadline) * mult);

        renderTodoContainer();
    }

    function sortPriority(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.priority - b.priority) * mult);

        renderTodoContainer();
    }

    function sortCompleted(reverse=false) {
        const mult = reverse? -1 : 1;
        currentTodos.sort((a, b) => (a.complete && b.complete)? 0 : a.complete? mult : b.complete? -mult : 0);
    
        renderTodoContainer();
    }

    function findTodoFromElement(elem) {
        const $todo = elem.closest('.todo-item');
        if (!$todo) return null;

        const id = $todo.dataset.id;
        return currentTodos.find(t => String(t.id) === id);
    }

    function handleHeaderClick(ev) {
        
        if (ev.target.closest('.new-todo')) {
            pubsub.publish('new-todo-popup');
            return;
        }

        if (ev.target.closest('.edit-project')) {
            pubsub.publish('edit-project-popup', currentProject);
            return;
        }

        if (ev.target.closest('.delete-project')) {
            pubsub.publish('remove-project-popup', currentProject);
            return;
        }
    }

    function handleTodoClick(ev) {
        const $todoItem = ev.target.closest('.todo-item');
        if (!$todoItem) return;

        const todo = findTodoFromElement(ev.target);
        if (!todo) return;

        if (ev.target.closest('.edit-todo')) {
            pubsub.publish('edit-todo-popup', todo);
            return;
        }
        if (ev.target.closest('.copy-todo')) {
            addTodo(todo.copy());
            return;
        }
        if (ev.target.closest('.delete-todo')) {
            removeTodo(todo);
            return;
        }
        if (ev.target.closest('.check-todo')) {
            toggleTodo(todo);
            return;
        }
        // Only expand if click wasn't on a control button
        expandTodoElement($todoItem);
    }

    function addTodoElement(todo, replaceElem=null, editable=true) {
        if (replaceElem) renderer.clearContents(replaceElem);

        // Create todo element
        const $todoItem = replaceElem || renderer.addElement($todoContainer, 'div', '', ['todo-item'], { 'data-id': todo.id });

        // Add header
        const $header = renderer.addElement($todoItem, 'div', '', ['spaced', 'title', 'row']);
        const $title = renderer.addElement($header, 'span', '', ['option']);
        const $checkbox = renderer.addElement($title, 'input', '', ['check-todo'], { type: 'checkbox' });
        $checkbox.checked = todo.complete;
        renderer.addElement($title, 'h2', todo.title);

        if (editable) {
            // Add buttons
            const $btnList = renderer.addElement($header, 'span', '', ['button-list']);
            renderer.addElement($btnList, 'button', '', ['edit-todo', 'icon'], { alt: 'Edit Task', title: 'edit task' });
            renderer.addElement($btnList, 'button', '', ['copy-todo', 'icon'], { alt: 'Copy Task', title: 'copy task' });
            renderer.addElement($btnList, 'button', '', ['delete-todo', 'icon'], { alt: 'Delete Task', title: 'delete task' });
        }

        // Add info
        const $todoInfo = renderer.addElement($todoItem, 'div', '', ['evenly', 'row']);
        renderer.addElement($todoInfo, 'h5', todo.getDeadlineText(), ['todo-deadline']);
        renderer.addElement($todoInfo, 'h5', todo.getPriorityText(), ['todo-priority']);
        renderer.addElement($todoItem, 'hr', '', ['uncover']);
        const $todoDesc = renderer.addElement($todoItem, 'div', '');
        renderer.addElement($todoDesc, 'h6', todo.desc, ['todo-desc', 'uncover']);
    }

    function removeTodoElement(todo) {
        $todoContainer.querySelector(`[data-id="${todo.id}"]`).remove();
    }

    function replaceTodoElement(oldTodo, newTodo) {
        const replaceElem = $todoContainer.querySelector(`[data-id="${oldTodo.id}"]`);
        if (!replaceElem) return;

        addTodoElement(newTodo, replaceElem);
    }

    function expandTodoElement(element) {
        const todoElements = $todoContainer.querySelectorAll('.todo-item');
        const $todoItem = element.closest('.todo-item')

        for (let $todo of todoElements) {
            if ($todo !== $todoItem && $todo.classList.contains('expanded')) {
                $todo.classList.remove('expanded');
            }
        }
        if ($todoItem.classList.contains('expanded')) {
            $todoItem.classList.remove('expanded');
        } else {
            $todoItem.classList.add('expanded');
        }
    }

    function renderAll() {
        renderProjectShell();
        renderTodoContainer();
    }

    function renderProjectShell(projectMode=true) {
        renderer.clearContents($projectHeader);

        // Add title
        const $title = renderer.addElement($projectHeader, 'div', '', ['spaced', 'title', 'row']);
        renderer.addElement($title, 'h1', header);

        if (!projectMode) return;
        
        // Add buttons
        const $buttonList = renderer.addElement($title, 'span', '', ['button-list']);
        renderer.addElement($buttonList, 'button', '', ['new-todo', 'icon'], { alt: 'New Task', title: 'new task' });
        renderer.addElement($buttonList, 'button', '', ['edit-project', 'icon'], { alt: 'Edit Project', title: 'edit project' });
        renderer.addElement($buttonList, 'button', '', ['delete-project', 'icon'], { alt: 'Delete Project', title: 'delete project' });

        // Add description
        const $projectDesc = renderer.addElement($projectHeader, 'div', '', ['project-desc']);
        renderer.addElement($projectDesc, 'h4', currentProject.desc);

        // Add tags
        const $tagRow = renderer.addElement($projectHeader, 'div', '', ['row']);
        for (let tag of currentProject.tags) {
            renderer.addElement($tagRow, 'p', tag, ['project-tag']);
        }
    }

    function renderTodoContainer(editable=true) {
        renderer.clearContents($todoContainer);

        for (let todo of currentTodos) {
            addTodoElement(todo, null, editable);
        }
    }

    function renderEmpty() {
        renderer.clearContents($projectHeader);
        renderer.clearContents($todoContainer);

        const $noProject = renderer.addElement($projectHeader, 'div', '', ['no-project']);
        renderer.addElement($noProject, 'h2', 'You currently have no projects! 😧 Click here to add a project.');
        $noProject.addEventListener('click', () => pubsub.publish('new-project-popup'));
    }

    // Add event listener
    $projectHeader.addEventListener('click', handleHeaderClick);
    $todoContainer.addEventListener('click', handleTodoClick);

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