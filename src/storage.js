import pubsub from './pubsub.js';
import { Project, ProjectRef, TodoItem } from './project.js';

/* 
 * Use localStorage to save projects.
 * The key, value pair for all items are { project.id : project }
 */

const storage = {
    newProject: function (project, override=false) {
        if (!override && localStorage.getItem(project.id)) {
            console.warn("Error: Cannot create project. A project already has that id.");
            return;
        }
        localStorage.setItem(project.id, project);
    },
    saveProject: function (project) {
        localStorage.setItem(project.id, project);
    },
    loadProject: function (projectID) {
        return JSON.parse(localStorage.getItem(projectID));
    },
    deleteProject: function (projectID) {
        localStorage.removeItem(projectID);
    },
    loadFirstProject: function () {
        return JSON.parse(localStorage.key(0)) || Project.getDefault();
    },
    loadProjectRefs: function () {
        const refs = [];
        for (let i = 0; i <  localStorage.length; i++) {
            const project = JSON.parse(localStorage.getItem(localStorage.key(i)));
            refs.push(project.getRef());
        }
        return refs;
    },
    loadTodos: function (filterFn) {
        const todos = [];
        for (let i = 0; i <  localStorage.length; i++) {
            const project = JSON.parse(localStorage.getItem(localStorage.key(i)));
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

