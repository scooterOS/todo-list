import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';


(function() {
    const $sidebar = document.getElementById('sidebar');
    var projectRefs = [];
    
    function init() {
        projectRefs = storage.loadProjectRefs();

        render();
    }

    function addProject(project) {
        projectRefs.push(project.getRef());

        render();
    }

    function editProject(projectData) {
        //...
    }

    function removeProject(project) {
        const index = projectRefs.findIndex(r => r.equals(project));
        if (index === -1) {
            console.warn("Error: Cannot remove project.");
            return;
        }
        storage.deleteProject(project);
        projectRefs.splice(index, 1);

        render();
    }

    function updateProject(projectData) {
        const index = projectRefs.findIndex(r => r.equals(project.old));
        if (index === -1 || !projectData.new) {
            console.warn("Error: Cannot update project.");
            return;
        }
        projectRefs[index].title = projectData.new.title;

        render();
    }

    function render() {

        renderer.clearContents($sidebar);

        const $projectCol = renderer.addElement($sidebar, 'div', '', ['column']);
        renderer.addElement($projectCol, 'h1', 'Projects', ['title']);

        // Add project elements and event listeners
        for (let ref in projectRefs) {
            const $project = renderer.addElement($projectCol, 'h2', ref.title, ['project-label']);
            $project.addEventListener('click', () => storage.loadProject(ref));
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

        const $archiveView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($archiveView, 'div', '', ['archive-view', 'icon']);
        renderer.addElement($archiveView, 'h2', 'Archive');

        const $allView = renderer.addElement($viewCol, 'div', '', ['option']);
        renderer.addElement($allView, 'div', '', ['all-view', 'icon']);
        renderer.addElement($allView, 'h2', 'All');

        // Add event listeners
        $dailyView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadDailyTodos()));
        $weeklyView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadWeeklyTodos()));
        $monthlyView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadMonthlyTodos()));
        $archiveView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadArchivedTodos()));
        $allView.addEventListener('click', () => pubsub.publish('view-todos', storage.loadAllTodos()));
    }

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('add-project', addProject);
    pubsub.subscribe('edit-project', editProject);
    pubsub.subscribe('remove-project', removeProject);
    pubsub.subscribe('update-project', updateProject);
    
})();