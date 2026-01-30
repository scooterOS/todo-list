import pubsub from './pubsub.js';
import renderer from './render.js';

class Sidebar {
    #sidebar

    constructor() {
        this.#sidebar = document.getElementById('sidebar');

        pubsub.subscribe('view-mode', () => this.viewMode());
        pubsub.subscribe('edit-mode', () => this.projectMode());
        pubsub.subscribe('calendar-mode', () => this.calendarMode());
        pubsub.subscribe('daily-mode', () => this.dailyMode());
    }

    viewMode() {
        renderer.clearContents(this.#sidebar);

        const $inboxMode = renderer.addElement(this.#sidebar, 'div', '', ['option']);
        renderer.addElement($inboxMode, 'div', '', ['inbox-mode', 'icon']);
        renderer.addElement($inboxMode, 'h2', 'Inbox');

        const $dailyMode = renderer.addElement(this.#sidebar, 'div', '', ['option']);
        renderer.addElement($dailyMode, 'div', '', ['daily-mode', 'icon']);
        renderer.addElement($dailyMode, 'h2', 'Today');

        const $calendarMode = renderer.addElement(this.#sidebar, 'div', '', ['option']);
        renderer.addElement($calendarMode, 'div', '', ['calendar-mode', 'icon']);
        renderer.addElement($calendarMode, 'h2', 'Calendar');

        const $viewMode = renderer.addElement(this.#sidebar, 'div', '', ['option']);
        renderer.addElement($viewMode, 'div', '', ['view-mode', 'icon']);
        renderer.addElement($viewMode, 'h2', 'Projects');
        
        const $archiveMode = renderer.addElement(this.#sidebar, 'div', '', ['option']);
        renderer.addElement($archiveMode, 'div', '', ['archive-mode', 'icon']);
        renderer.addElement($archiveMode, 'h2', 'Archive');
    }
}

export default new Sidebar();