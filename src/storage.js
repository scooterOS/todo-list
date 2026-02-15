/* 
 * Use localStorage to save projects.
 * The key, value pair for all items are { "project:" project.id : project }
 */
const PREFIX = "project:";

const storage = {
    newProject: function (project, override=false) {
        if (!override && localStorage.getItem(project.id)) {
            console.warn("Error: Cannot create project. A project already has that id.");
            return;
        }
        localStorage.setItem(PREFIX + project.id, JSON.stringify(project));
    },
    saveProject: function (project) {
        localStorage.setItem(PREFIX + project.id, JSON.stringify(project));
    },
    loadProject: function (projectID) {
        return JSON.parse(localStorage.getItem(PREFIX + projectID));
    },
    deleteProject: function (projectID) {
        localStorage.removeItem(PREFIX + projectID);
    },
    loadFirstProject: function () {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith(PREFIX)) continue;

            return JSON.parse(localStorage.getItem(key));
        }
        return null;
    },
    loadProjectRefs: function () {
        const refs = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith(PREFIX)) continue;

            const project = JSON.parse(localStorage.getItem(key));
            refs.push(project.getRef());
        }
        return refs;
    },
    loadTodos: function (filterFn) {
        const todos = [];
        for (let i = 0; i <  localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith(PREFIX)) continue;

            const project = JSON.parse(localStorage.getItem(key));
            if (filterFn) {
                todos.push(...project.todos.filter(filterFn));
            } else {
                todos.push(...project.todos);
            }
        }
        return todos;
    }
};

export default storage;

