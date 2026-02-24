import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';


(function() {
    const $sidebar = document.getElementById('sidebar');
    var projectRefs = [];

    // Helper function to normalize a date to start of day (midnight) for date-only comparisons
    function startOfDay(date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    // Helper function to get date-only comparison values
    function getDateRanges() {
        const now = new Date();
        const today = startOfDay(now);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 6); // Today + 6 more days = 7 days total
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        
        return { today, yesterday, tomorrow, endOfWeek, nextMonth };
    }
    
    function init() {
        projectRefs = storage.loadProjectRefs();

        render();
    }

    function addProject(project) {
        projectRefs.push(project.getRef());

        render();
    }

    function editProject(oldProject, newProject) {
        if (!oldProject || !newProject) {
            console.warn(`Error: Cannot replace project with missing data.`);
            return;
        }
        const index = projectRefs.findIndex(r => r.id === oldProject.id);
        if (index === -1) {
            console.warn(`Error: Cannot replace missing project.`);
            return;
        }
        projectRefs[index].title = newProject.title;

        render();
    }

    function removeProject(project) {
        if (!project) {
            console.warn("Error: Cannot remove missing project.");
            return;
        }
        const index = projectRefs.findIndex(r => r.id === project.id);
        if (index === -1) {
            console.warn("Error: Cannot remove missing project.");
            return;
        }
        storage.deleteProject(project.id);
        projectRefs.splice(index, 1);

        render();
    }

    function render() {

        renderer.clearContents($sidebar);

        const $projectCol = renderer.addElement($sidebar, 'div', '', ['column']);
        renderer.addElement($projectCol, 'h2', 'Projects', ['title']);

        // Add project elements and event listeners
        for (let ref of projectRefs) {
            const $project = renderer.addElement($projectCol, 'button', '', ['project-label']);
            renderer.addElement($project, 'h3', ref.title);
            $project.addEventListener('click', () => {
                const project = storage.loadProject(ref.id);
                if (project) {
                    pubsub.publish('open-project', project);
                }
            });
        }
        renderer.addElement($sidebar, 'hr');

        // Add view options
        const $viewCol = renderer.addElement($sidebar, 'div', '', ['column']);
        renderer.addElement($viewCol, 'h2', 'View', ['title']);

        const $dailyView = renderer.addElement($viewCol, 'button', '', ['option']);
        renderer.addElement($dailyView, 'div', '', ['daily-view', 'icon']);
        renderer.addElement($dailyView, 'h3', 'Today');

        const $weeklyView = renderer.addElement($viewCol, 'button', '', ['option']);
        renderer.addElement($weeklyView, 'div', '', ['weekly-view', 'icon']);
        renderer.addElement($weeklyView, 'h3', 'This Week');

        const $monthlyView = renderer.addElement($viewCol, 'button', '', ['option']);
        renderer.addElement($monthlyView, 'div', '', ['monthly-view', 'icon']);
        renderer.addElement($monthlyView, 'h3', 'This Month');

        const $pastView = renderer.addElement($viewCol, 'button', '', ['option']);
        renderer.addElement($pastView, 'div', '', ['past-view', 'icon']);
        renderer.addElement($pastView, 'h3', 'Past');

        const $allView = renderer.addElement($viewCol, 'button', '', ['option']);
        renderer.addElement($allView, 'div', '', ['all-view', 'icon']);
        renderer.addElement($allView, 'h3', 'All');

        // Add event listeners
        $dailyView.addEventListener('click', () => {
            const { today } = getDateRanges();

            pubsub.publish('view-todos', 'Daily', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline.getTime() === today.getTime();
            }));
        });
        $weeklyView.addEventListener('click', () => {
            const { today, endOfWeek } = getDateRanges();
            pubsub.publish('view-todos', 'This Week', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline >= today && todoDeadline <= endOfWeek;
            }));
        });
        $monthlyView.addEventListener('click', () => {
            const { today, nextMonth } = getDateRanges();
            pubsub.publish('view-todos', 'This Month', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline >= today && todoDeadline <= nextMonth;
            }));
        });
        $pastView.addEventListener('click', () => {
            const { today } = getDateRanges();
            pubsub.publish('view-todos', 'Past', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline < today;
            }));
        });
        $allView.addEventListener('click', () => pubsub.publish('view-todos', 'All', storage.loadTodos()));
    }

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('add-project', addProject);
    pubsub.subscribe('edit-project', editProject);
    pubsub.subscribe('remove-project', removeProject);

})();