import renderer from './render.js';
import pubsub from './pubsub.js';
import storage from './storage.js';
import { TodoItem, Project } from './project.js';


(function() {

    const launch = ($form, resolveFn) => {
        // Add class to form
        $form.classList.add('dialog');

        // Add form to popup element
        const $body = document.querySelector('body');
        const $popup = renderer.addElement($body, 'div', '', ['overlay'], { id: 'popup' });
        $popup.append($form);
        
        // Add submit and cancel buttons
        const $btnRow = renderer.addElement($form, 'div', '', ['row']);
        const $cancelBtn = renderer.addElement($btnRow, 'button', 'Cancel', ['cancel-btn'], { type: 'button' });
        const $submitBtn = renderer.addElement($btnRow, 'button', 'Submit', ['submit-btn'], { type: 'submit'} );

        // Add event listeners
        $cancelBtn.addEventListener('click', () => resolve());
        $form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            resolve(resolveFn)});
        $popup.addEventListener('mousedown', (ev) => {
            if (ev.target === $popup) resolve();
        });
    }

    const resolve = (resolveFn) => {
        // Call the resolution function
        if (typeof resolveFn === 'function') {
            resolveFn();
        } else {
            console.warn(`Invalid resolution function.`);
        }

        // Remove popup
        document.getElementById('popup').remove();

    }

    const popup = {

        newTodo: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'edit-todo';

            renderer.addElement($form, 'legend', 'New Task');
            renderer.addElement($form, 'h5', 'Name', ['label']);

            const $title = renderer.addElement($form, 'input', '', ['title-field'], { required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);

            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field']);
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
                const newTodo = new TodoItem(
                    $title.value,
                    $desc.value,
                    $deadline.value,
                    $priority.value,
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

            const $title = renderer.addElement($form, 'input', '', ['title-field'], { value: todo.title, required: true });
            renderer.addElement($form, 'h6', 'Description', ['label']);

            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field']);
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
                const newTodo = new TodoItem(
                    $title.value,
                    $desc.value,
                    $deadline.value,
                    $priority.value,
                    todo.complete,
                    todo.id
                );
                pubsub.publish('edit-todo', todo, newTodo);
            });
        },

        newProject: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            renderer.addElement($form, 'legend', 'New Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);

            const $title = renderer.addElement($form, 'input', '', ['title-field'], { required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);

            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field']);
            renderer.addElement($form, 'h5', 'Tags', ['label']);

            const $tags = renderer.addElement($form, 'div', '', ['tag-container']);
            const $tagBtn = renderer.addElement($tags, 'button', '+', ['add-tag-btn']);

            // Add event listener
            $tagBtn.addEventListener('click', () => {
                renderer.addElement($tags, 'input', tag, ['tag']);
            });

            // Launch popup form
            launch($form, () => {
                const tagElems = $tags.querySelectorAll('.tag');
                const tags = [];
                
                for (let i = 0; i < tagElems.length; i++) {
                    tags.push(tagElems[i].value);
                }
                const newProject = new Project(
                    $title.value,
                    $desc.value,
                    tags
                );
                // Save project to storage before publishing
                storage.saveProject(newProject);
                pubsub.publish('add-project', newProject);
            });
        },

        editProject: function (project) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            renderer.addElement($form, 'legend', 'Edit Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);

            const $title = renderer.addElement($form, 'input', '', ['title-field'], { value: project.title, required: true });
            renderer.addElement($form, 'h5', 'Description', ['label']);

            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field']);
            $desc.value = project.desc || '';
            renderer.addElement($form, 'h5', 'Tags', ['label']);

            const $tagContainer = renderer.addElement($form, 'div', '', ['tag-container']);
            const $tagBtn = renderer.addElement($tagContainer, 'button', '+', ['add-tag-btn']);

            // Add tag elements
            for (let tag of project.tags) {
                renderer.addElement($tagContainer, 'input', '', ['tag'], { value: tag });
            }

            // Add event listeners
            $tagBtn.addEventListener('click', () => {
                const $tag = renderer.addElement($tagContainer, 'input', '', ['tag']);
                $tag.select();
                $tag.addEventListener('click', (ev) => {
                    if (ev.button === 2) {
                        ev.preventDefault();
                        $tag.remove();
                    }
                });
            });

            // Launch popup form
            launch($form, () => {
                const tagElems = $tagContainer.querySelectorAll('.tag');
                const tags = [];
                
                for (let i = 0; i < tagElems.length; i++) {
                    tags.push(tagElems[i].value);
                }
                const newProject = new Project(
                    $title.value,
                    $desc.value,
                    tags,
                    project.todos,
                    project.id
                );
                pubsub.publish('edit-project', project, newProject);
            });
        },

        removeProject: function (project) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'remove-project';

            // Add element
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
