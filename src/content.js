import pubsub from './pubsub.js';
import renderer from './render.js';

class Content {
    #content

    constructor() {
        this.#content = document.getElementById('content');

        pubsub.subscribe('view-mode', () => this.viewMode());
        pubsub.subscribe('edit-mode', () => this.editMode());
        pubsub.subscribe('calendar-mode', () => this.calendarMode());
        pubsub.subscribe('daily-mode', () => this.dailyMode());

        $newProject.addEventListener('click', () => pubsub.publish('new-project'));
        $copy.addEventListener('click', () => pubsub.publish('copy-mode'));
        $sort.addEventListener('click', this.openCloseSort);
    }

    viewMode() {
    renderer.clearContents(this.#content);

        /*
        Display all projects in the order of the applied filter (default=prioirty).
        Projects are formated in a single column for mobile, and 1-3 columns for desktop.
        Users may expand/contract (view details), edit, delete, save (download), rename projects.
        */
    }

    editMode() {
        renderer.clearContents(this.#content);

        /*
        Display a title, description, due date, todo items, tags.
        Todo items have a title, description, due date, tags, checklist, priority.
        */
    }

    calendarMode() { 
        renderer.clearContents(this.#content);

        // add calendar code here
    }

    dailyMode() {
        renderer.clearContents(this.#content);

        // add daily code here
    }
}