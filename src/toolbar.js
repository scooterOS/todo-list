import pubsub from './pubsub.js';
import renderer from './render.js';

class Toolbar {
    #toolbar

    constructor() {
        this.#toolbar = document.getElementById('toolbar');

        pubsub.subscribe('view-mode', () => this.viewMode());
        pubsub.subscribe('edit-mode', () => this.editMode());
        pubsub.subscribe('calendar-mode', () => this.calendarMode());
        pubsub.subscribe('daily-mode', () => this.dailyMode());
        pubsub.subscribe('search', () => this.search());
    }

    viewMode() {
        renderer.clearContents(this.#toolbar);

        const $newProject = renderer.addElement(this.#toolbar, 'button', '', ['new-project', 'icon'], { 'title': 'new project' });
        const $copy = renderer.addElement(this.#toolbar, 'button', '', ['copy', 'icon'], { 'title': 'copy' });
        const $sort = renderer.addElement(this.#toolbar, 'button', '', ['sort', 'icon'], { 'title': 'sort' });
        const $search = renderer.addElement(this.#toolbar, 'button', '', ['search', 'icon'], { 'title': 'search' });
        const $searchbar = renderer.addElement(this.#toolbar, 'input', '', ['searchbar']);

        $newProject.addEventListener('click', () => pubsub.publish('new-project'));
        $copy.addEventListener('click', () => pubsub.publish('copy-mode'));
        $sort.addEventListener('click', this.openCloseSort);
        $search.addEventListener('click', () => pubsub.publish('search', $searchbar.value));
    }

    editMode() {
        renderer.clearContents(this.#toolbar);

        // add project code here
    }

    calendarMode() { 
        renderer.clearContents(this.#toolbar);

        // add calendar code here
    }

    dailyMode() {
        renderer.clearContents(this.#toolbar);

        // add daily code here
    }

    search() {
        this.#toolbar.querySelector('.searchbar').textContent = '';
    }

    openCloseSort() {
        const $sortMenu = this.#toolbar.getElementById('sort-menu');
        if ($sortMenu.classList.contains('hidden'))
            $sortMenu.classList.remove('hidden');
        else
            $sortMenu.classList.add('hidden');
    }

    applySort(ev) {
        const isAscending = this.#toolbar.getElementsById('ascending').checked;
        if (ev.target.nodeName === 'button')
            pubsub.publish('sort', { 'type': ev.target.id, 'ascending': isAscending });

    }
}

export default new Toolbar();