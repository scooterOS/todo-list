import renderer from './render.js';
import pubsub from './pubsub.js';
import storage from './storage.js';
import { TodoItem, Project } from './project.js';


(function() {
    var resolveFn = null;

    function launch($form, fn) {
        if (typeof fn !== 'function') return;

        // Set resolution function
        resolveFn = fn;

        // Add class to form
        $form.classList.add('dialog');

        // Add form to popup element
        const $body = document.querySelector('body');
        const $popup = renderer.addElement($body, 'div', '', [], { id: 'popup' });
        $popup.append($form);
        
        // Add submit and cancel buttons
        const $btnRow = renderer.addElement($form, 'div', '', ['popup-btns', 'row']);
        renderer.addElement($btnRow, 'button', 'Cancel', ['cancel-btn'], { type: 'button' });
        renderer.addElement($btnRow, 'button', 'Submit', ['submit-btn'], { type: 'submit'} );

        // Focus on first field
        setTimeout(() => {
            const firstInput = $form.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        });
        // Add event listeners
        $popup.addEventListener('submit', handleFormSubmit);
        $popup.addEventListener('click', handlePopupClick);
    }

    function resolve() {
        // Call the resolution function
        if (typeof resolveFn === 'function') {
            resolveFn();
        } 
        resolveFn = null;

        // Remove popup
        const $popup = document.getElementById('popup');
        $popup.removeEventListener('submit', handleFormSubmit);
        $popup.removeEventListener('click', handlePopupClick);
        $popup.remove();
    }

    function handleFormSubmit(ev) {
        ev.preventDefault();

        const $form = ev.target;

        // Trigger browser validation UI
        if (!$form.checkValidity()) {
            $form.reportValidity();
            return;
        }
        resolve();
    }

    function handlePopupClick(ev) {
        if (ev.target.closest('.cancel-btn') || ev.target === document.getElementById('popup')) {
            resolveFn = null;
            resolve();
        }
    }

    const popup = {

        newTodo: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'edit-todo';

            renderer.addElement($form, 'legend', 'New Task');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { placeholder: 'Enter name', required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { placeholder: 'Describe...' });
            renderer.addElement($form, 'h5', 'Due Date', ['label']);
            const $deadline = renderer.addElement($form, 'input', '', ['deadline-field'], { type: 'date', required: true });
            renderer.addElement($form, 'h5', 'Priority', ['label']);
            const $priority = renderer.addElement($form, 'select', '', ['priority-field']);
            renderer.recursiveAdd($priority, [
                { 'type': 'option', 'text': 'Some Day', 'attr': { 'value': 0 }},
                { 'type': 'option', 'text': 'Low', 'attr': { 'value': 1 }},
                { 'type': 'option', 'text': 'Medium', 'attr': { 'value': 2 }},
                { 'type': 'option', 'text': 'High', 'attr': { 'value': 3 }},
                { 'type': 'option', 'text': 'Urgent', 'attr': { 'value': 4 }},
            ]);

            // Launch popup form
            launch($form, () => {
                // Parse date string (YYYY-MM-DD) to Date object in local timezone
                const dateStr = $deadline.value;
                let deadline = null;
                if (dateStr) {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    deadline = new Date(year, month - 1, day); // month is 0-indexed
                }
                
                const newTodo = new TodoItem(
                    $title.value,
                    $desc.value,
                    deadline,
                    parseInt($priority.value, 10),
                );
                pubsub.publish('add-todo', newTodo);
            });
        },

        editTodo: function (todo) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'edit-todo'

            renderer.addElement($form, 'legend', 'Edit Task');
            renderer.addElement($form, 'h6', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { value: todo.title, placeholder: 'Enter name', required: true });
            renderer.addElement($form, 'h6', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { placeholder: 'Describe...' });
            $desc.value = todo.desc || '';
            renderer.addElement($form, 'h6', 'Due Date', ['label']);

            // Format date for HTML date input (YYYY-MM-DD)
            const deadlineStr = todo.deadline instanceof Date 
                ? todo.deadline.toISOString().split('T')[0] 
                : todo.deadline;
            const $deadline = renderer.addElement($form, 'input', '', ['deadline-field'], { type: 'date', value: deadlineStr, required: true });
            renderer.addElement($form, 'h6', 'Priority', ['label']);

            const $priority = renderer.addElement($form, 'select', '', ['priority-field'], { value: todo.priority });
            renderer.recursiveAdd($priority, [
                { 'type': 'option', 'text': 'Some Day', 'attr': { 'value': 0 }},
                { 'type': 'option', 'text': 'Low', 'attr': { 'value': 1 }},
                { 'type': 'option', 'text': 'Medium', 'attr': { 'value': 2 }},
                { 'type': 'option', 'text': 'High', 'attr': { 'value': 3 }},
                { 'type': 'option', 'text': 'Urgent', 'attr': { 'value': 4 }},
            ]);

            // Launch popup form
            launch($form, () => {
                // Parse date string (YYYY-MM-DD) to Date object in local timezone
                const dateStr = $deadline.value;
                let deadline = null;
                if (dateStr) {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    deadline = new Date(year, month - 1, day); // month is 0-indexed
                }
                
                const newTodo = new TodoItem(
                    $title.value,
                    $desc.value,
                    deadline,
                    parseInt($priority.value, 10),
                    todo.complete,
                    todo.id
                );
                pubsub.publish('edit-todo', todo, newTodo);
            });
        },

    createTagEditor: function ($container, initialTags = []) {

            const tagBtn = renderer.addElement(
                $container,
                'button',
                '+',
                ['add-tag-btn'],
                { type: 'button' }
            );

            function normalize(value) {
                return value.trim().toLowerCase();
            }

            function createTag(value = '') {
                const input = renderer.addElement(
                    $container,
                    'input',
                    '',
                    ['tag'],
                    { value }
                );
                input.placeholder = 'Enter tag';
                input.select();
                return input;
            }

            function getTags() {
                const map = new Map();

                $container.querySelectorAll('.tag').forEach(tag => {
                    const v = tag.value.trim();
                    if (!v) return;

                    const key = normalize(v);
                    if (!map.has(key)) map.set(key, v);
                });

                return Array.from(map.values());
            }

            function handleClick(e) {
                if (e.target.closest('.add-tag-btn')) {
                    e.preventDefault();
                    createTag();
                    return;
                }
            }

            function handleBlur(e) {
                if (!e.target.classList.contains('tag')) return;

                const value = e.target.value.trim();

                if (!value) {
                    e.target.remove();
                    return;
                }

                const allTags = Array.from($container.querySelectorAll('.tag'))
                    .filter(el => el !== e.target)
                    .map(el => normalize(el.value));

                if (allTags.includes(normalize(value))) {
                    e.target.remove();
                }
            }

            function handleKeydown(e) {
                if (!e.target.classList.contains('tag')) return;

                if (e.key === 'Enter') {
                    e.preventDefault();
                    createTag();
                }
            }

            function handleContextMenu(e) {
                if (!e.target.classList.contains('tag')) return;

                e.preventDefault();
                e.target.remove();
            }

            // Add event listeners
            $container.addEventListener('click', handleClick);
            $container.addEventListener('blur', handleBlur, true); // use capture for blur
            $container.addEventListener('keydown', handleKeydown);
            $container.addEventListener('contextmenu', handleContextMenu);

            // Preload tags
            initialTags.forEach(tag => createTag(tag));

            return { getTags };
        },

        newProject: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            // Populate form
            renderer.addElement($form, 'legend', 'New Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { placeholder: 'Enter name', required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { placeholder: 'Describe...' });
            renderer.addElement($form, 'h5', 'Tags', ['label']);
            const $tagContainer = renderer.addElement($form, 'div', '', ['tag-container']);
            const tagEditor = popup.createTagEditor($tagContainer);

            // Launch popup form
            launch($form, () => {
                const newProject = new Project(
                    $title.value,
                    $desc.value,
                    tagEditor.getTags()
                );
                // Open and save new project
                storage.saveProject(newProject);
                pubsub.publish('add-project', newProject);
            });
        },

        editProject: function (project) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            // Populate form
            renderer.addElement($form, 'legend', 'Edit Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { value: project.title, placeholder: 'Enter name', required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { placeholder: 'Describe...' });
            $desc.value = project.desc || '';
            renderer.addElement($form, 'h5', 'Tags', ['label']);
            const $tagContainer = renderer.addElement($form, 'div', '', ['tag-container']);
            const tagEditor = popup.createTagEditor($tagContainer, project.tags);

            // Launch popup form
            launch($form, () => {
                const newProject = new Project(
                    $title.value,
                    $desc.value,
                    tagEditor.getTags(),
                    project.todos,
                    project.id
                );
                // Open updated project
                pubsub.publish('edit-project', project, newProject);
            });
        },

        removeProject: function (project) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'remove-project';

            // Populate form
            renderer.addElement($form, 'h5', `Are you sure you want to delete ${project.title}?`);

            // Launch popup form
            launch($form, () => {
                pubsub.publish('remove-project', project);
            });
        },
    };

    // Subscribe to events
    pubsub.subscribe('edit-todo-popup', popup.editTodo);
    pubsub.subscribe('new-todo-popup', popup.newTodo);
    pubsub.subscribe('new-project-popup', popup.newProject);
    pubsub.subscribe('edit-project-popup', popup.editProject);
    pubsub.subscribe('remove-project-popup', popup.removeProject);

})();
