import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';


(function() {
    const $sidebar = document.getElementById('sidebar');
    var projectRefs = [];

    // Date values
    var today = new Date();
    var nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    var nextMonth = new Date(today);
    nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    function init() {
        projectRefs = storage.loadProjectRefs();

        render();
    }

    function addProject(project) {
        projectRefs.push(project.getRef());

        render();
    }

    function editProject(oldProject, newProject) {
        const index = projectRefs.findIndex(r => r.equals(oldProject));
        if (index === -1 || !newProject) {
            console.warn("Error: Cannot update project.");
            return;
        }
        projectRefs[index].title = newProject.title;

        render();
    }

    function removeProject(project) {
        const index = projectRefs.findIndex(r => r.equals(project));
        if (index === -1) {
            console.warn("Error: Cannot remove project.");
            return;
        }
        storage.deleteProject(project.id);
        projectRefs.splice(index, 1);

        render();
    }

    function render() {

        renderer.clearContents($sidebar);

        const $projectCol = renderer.addElement($sidebar, 'div', '', ['column']);
        renderer.addElement($projectCol, 'h1', 'Projects', ['title']);

        // Add project elements and event listeners
        for (let ref of projectRefs) {
            const $project = renderer.addElement($projectCol, 'h2', ref.title, ['project-label']);
            $project.addEventListener('click', () => {
                const project = storage.loadProject(ref.id);
                if (project) {
                    pubsub.publish('open-project', project);
                }
            });
        }

        // Add view options
        const $viewCol = renderer.addElement($sidebar, 'div', '', ['column']);
        renderer.addElement($viewCol, 'h1', 'View', ['title']);

        const $dailyView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($dailyView, 'div', '', ['daily-view', 'icon']);
        renderer.addElement($dailyView, 'h2', 'Today');

        const $weeklyView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($weeklyView, 'div', '', ['weekly-view', 'icon']);
        renderer.addElement($weeklyView, 'h2', 'This Week');

        const $monthlyView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($monthlyView, 'div', '', ['monthly-view', 'icon']);
        renderer.addElement($monthlyView, 'h2', 'This Month');

        const $pastView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($pastView, 'div', '', ['past-view', 'icon']);
        renderer.addElement($pastView, 'h2', 'Past');

        const $allView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($allView, 'div', '', ['all-view', 'icon']);
        renderer.addElement($allView, 'h2', 'All');

        // Add event listeners
        $dailyView.addEventListener('click', () => {
            pubsub.publish('view-todos', storage.loadTodos((todo) => todo.deadline === today));
        });
        $weeklyView.addEventListener('click', () => {
            pubsub.publish('view-todos', storage.loadTodos((todo) => todo.deadline >= today && todo.deadline <= nextWeek));
        });
        $monthlyView.addEventListener('click', () => {
            pubsub.publish('view-todos', storage.loadTodos((todo) => todo.deadline >= today && todo.deadline <= nextMonth));
        });
        $pastView.addEventListener('click', () => {
            pubsub.publish('view-todos', storage.loadTodos((todo) => todo.deadline < today));
        });
        $allView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadTodos()));
    }

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('add-project', addProject);
    pubsub.subscribe('edit-project', editProject);
    pubsub.subscribe('remove-project', removeProject);
    
})();