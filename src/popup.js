import renderer from './render.js';
import pubsub from './pubsub.js';
import { TodoItem, Project } from './project.js';


(function() {

    const blockEvents = (ev) => {
        if (!ev.target.parentElement.classList.contains('overlay')) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    const formFilled = ($form) => {
        const requiredFields = $form.querySelectorAll('[required]');
        let allFilled = true;

        requiredFields.forEach(field => {
            if (!field.value) allFilled = false;
        });

        return allFilled;
    }

    const alertFormNotFilled = ($form) => {
        // Check if alert is already present
        const $pastAlert = $form.querySelector('.alert');
        if (!$pastAlert) return;

        renderer.addElement($form, 'div', 'You must fill out required fields!', ['alert']);
        $form.classList.add('mark-incomplete');
    }

    const launch = ($form, resolveFn) => {
        // Freeze other modules
        pubsub.publish('freeze');

        // Block background click events
        document.addEventListener('click', blockEvents, true);

        // Fade background
        const $body = document.querySelector('body');
        $body.classList.add('faded');

        // Add form to popup element
        const $popup = renderer.addElement($body, 'div', '', ['overlay'], { 'id': 'popup' });
        $form.classList.add('overlay');
        $popup.append($form);
        
        // Add submit and cancel buttons
        const $btnRow = renderer.addElement($form, 'div', '', ['row', 'overlay']);
        $cancelBtn = renderer.addElement($btnRow, 'button', 'Cancel', ['cancel-btn']);
        $submitBtn = renderer.addElement($btnRow, 'button', 'Submit', ['submit-btn']);

        // Add event listeners
        $cancelBtn.addEventListener('click', () => resolve());
        $submitBtn.addEventListener('click', () => resolve(resolveFn));

        // Render popup
        document.addElement($popup);
    }

    const resolve = (resolveFn) => {
        // Remove popup and publish data
        const $form = document.querySelector('#popup form');

        if ($form) {
            if (resolveFn && !formFilled($form)) {
                alertFormNotFilled($form);
                return;
            }
            $form.remove();
        }
        // Thaw other modules
        pubsub.publish('thaw');

        // Unblock click events
        document.removeEventListener('click', blockEvents);

        // Unfade background
        document.querySelector('body').classList.remove('faded');

        // Call the resolution function
        if (resolveFn) {
            resolveFn();
        }
    }

    const popup = {
        newTodo: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'edit-todo';

            renderer.addElement($form, 'legend', 'New Task');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { 'required': true });
            renderer.addElement($form, 'h5', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field']);
            renderer.addElement($form, 'h5', 'Due Date', ['label']);
            const $deadline = renderer.addElement($form, 'input', '', ['deadline-field'], { 'type': 'date', 'required': true });
            renderer.addElement($form, 'h5', 'Priority', ['label']);
            const $priority = renderer.addElement($form, 'select', '', ['priority-field', 'overlay']);
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
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { 'value': todo.title, 'required': true });
            renderer.addElement($form, 'h6', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { 'value': todo.desc });
            renderer.addElement($form, 'h6', 'Due Date', ['label']);
            const $deadline = renderer.addElement($form, 'input', '', ['deadline-field'], { 'type': 'date', 'value': todo.deadline, 'required': true });
            renderer.addElement($form, 'h6', 'Priority', ['label']);
            const $priority = renderer.addElement($form, 'select', '', ['priority-field', 'overlay'], { 'value': todo.priority });
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
                pubsub.publish('update-todo', { 'old': todo, 'new': newTodo });
            });
        },
        newProject: function () {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            renderer.addElement($form, 'legend', 'New Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { 'required': true });
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
                pubsub.publish('add-project', newProject);
            });
        },
        editProject: function (project) {
            // Create form element
            const $form = document.createElement('form');
            $form.id = 'new-project';

            renderer.addElement($form, 'legend', 'Edit Project');
            renderer.addElement($form, 'h5', 'Name', ['label']);
            const $title = renderer.addElement($form, 'input', '', ['title-field'], { 'value': project.title, 'required': true });
            renderer.addElement($form, 'h5', 'Description', ['label']);
            const $desc = renderer.addElement($form, 'textarea', '', ['desc-field'], { 'value': project.desc, });
            renderer.addElement($form, 'h5', 'Tags', ['label']);
            const $tagContainer = renderer.addElement($form, 'div', '', ['tag-container', 'overlay']);
            const $tagBtn = renderer.addElement($tagContainer, 'button', '+', ['add-tag-btn']);

            // Add tag elements
            for (let tag in project.tags) {
                renderer.addElement($tagContainer, 'input', '', ['tag'], { 'value': tag });
            }

            // Add event listeners
            $tagBtn.addEventListener('click', () => {
                const $tag = renderer.addElement($tagContainer, 'input', '', ['tag', 'overlay']);
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
                    tags
                );
                pubsub.publish('edit-project', { 'old': project, 'new': newProject });
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
