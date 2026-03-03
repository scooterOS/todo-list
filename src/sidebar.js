import pubsub from './pubsub.js';
import renderer from './render.js';
import storage from './storage.js';


(function() {
    const $projectList = document.getElementById('project-list');
    const $viewModes = document.getElementById('view-list');

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

        renderAll();
    }

    function addProject(project) {
        projectRefs.push(project.getRef());

        addProjectElement(project);
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

        replaceProjectElement(oldProject, newProject);
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

        removeProjectElement(project);
    }

    function handleProjectClick(ev) {
        const ref = findProjectRefFromElement(ev.target);
        if (!ref) return;

        const project = storage.loadProject(ref.id);
        if (project)
            pubsub.publish('open-project', project);
    }

    function handleViewClick(ev) {
        if (ev.target.closest('.daily-view')) {
            const { today } = getDateRanges();

            pubsub.publish('view-todos', 'Daily', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline.getTime() === today.getTime();
            }));
            return;
        }
        if (ev.target.closest('.weekly-view')) {
            const { today, endOfWeek } = getDateRanges();
            pubsub.publish('view-todos', 'This Week', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline >= today && todoDeadline <= endOfWeek;
            }));
            return;
        }
        if (ev.target.closest('.monthly-view')) {
            const { today, nextMonth } = getDateRanges();
            pubsub.publish('view-todos', 'This Month', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline >= today && todoDeadline <= nextMonth;
            }));
            return;
        }
        if (ev.target.closest('.past-view')) {
            const { today } = getDateRanges();
            pubsub.publish('view-todos', 'Past', storage.loadTodos((todo) => {
                const todoDeadline = startOfDay(todo.deadline);
                return todoDeadline < today;
            }));
            return;
        }
        if (ev.target.closest('.all-view')) {
            pubsub.publish('view-todos', 'All', storage.loadTodos(null));
        }
    }

    function findProjectRefFromElement(elem) {
        const $ref = elem.closest('.project-label');
        if (!$ref) return null;

        const id = $ref.dataset.id;
        return projectRefs.find(r => String(r.id) === id);
    }

    function addProjectElement(project, replaceElem=null) {
        if (replaceElem) renderer.clearContents(replaceElem);
        console.log(project);
        // Create project element
        const $project = replaceElem || renderer.addElement($projectList, 'button', '', ['project-label'], { 'data-id': project.id });
        
        renderer.addElement($project, 'h3', project.title);
    }

    function removeProjectElement(project) {
        $projectList.querySelector(`[data-id="${project.id}"]`).remove();
    }

    function replaceProjectElement(oldProject, newProject) {
        const replaceElem = $projectList.querySelector(`[data-id=${oldProject.id}]`)
        if (!replaceElem) return;

        addProjectElement(newProject, replaceElem);
    }

    function renderAll() {
        renderProjectList();
        renderViewModes();
    }

    function renderProjectList() {
        renderer.clearContents($projectList);

        renderer.addElement($projectList, 'h2', 'Projects', ['title']);

        for (let ref of projectRefs) {
            addProjectElement(ref);
        }
    }

    function renderViewModes() {
        renderer.clearContents($viewModes);

        // Add view options]
        renderer.addElement($viewModes, 'h2', 'View', ['title']);

        const $dailyView = renderer.addElement($viewModes, 'button', '', ['daily-view', 'option']);
        renderer.addElement($dailyView, 'div', '', ['daily', 'icon']);
        renderer.addElement($dailyView, 'h3', 'Today');

        const $weeklyView = renderer.addElement($viewModes, 'button', '', ['weekly-view', 'option']);
        renderer.addElement($weeklyView, 'div', '', ['weekly', 'icon']);
        renderer.addElement($weeklyView, 'h3', 'This Week');

        const $monthlyView = renderer.addElement($viewModes, 'button', '', ['monthly-view', 'option']);
        renderer.addElement($monthlyView, 'div', '', ['monthly', 'icon']);
        renderer.addElement($monthlyView, 'h3', 'This Month');

        const $pastView = renderer.addElement($viewModes, 'button', '', ['past-view', 'option']);
        renderer.addElement($pastView, 'div', '', ['past', 'icon']);
        renderer.addElement($pastView, 'h3', 'Past');

        const $allView = renderer.addElement($viewModes, 'button', '', ['all-view', 'option']);
        renderer.addElement($allView, 'div', '', ['all', 'icon']);
        renderer.addElement($allView, 'h3', 'All');
    }

    // Add event listener
    $projectList.addEventListener('click', handleProjectClick);
    $viewModes.addEventListener('click', handleViewClick);

    // Subscribe to events
    pubsub.subscribe('init', init);
    pubsub.subscribe('add-project', addProject);
    pubsub.subscribe('edit-project', editProject);
    pubsub.subscribe('remove-project', removeProject);

})();