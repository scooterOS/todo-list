import { Project } from './project.js';

const PREFIX = 'project:';

function readProject(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
        return Project.fromJSON(JSON.parse(raw));
    } catch (e) {
        console.warn('Corrupted project in storage:', key);
        return null;
    }
}

function writeProject(project) {
    localStorage.setItem(PREFIX + project.id, JSON.stringify(project));
}

const storage = {

    /* ---------- CREATE / UPDATE ---------- */

    saveProject(project) {
        if (!(project instanceof Project)) {
            console.warn('Attempted to save non-Project:', project);
            return;
        }
        writeProject(project);
    },

    newProject(project, override=false) {
        const key = PREFIX + project.id;

        if (!override && localStorage.getItem(key)) {
            console.warn('Project id already exists:', project.id);
            return;
        }
        writeProject(project);
    },

    deleteProject(projectID) {
        localStorage.removeItem(PREFIX + projectID);
    },


    /* ---------- LOAD SINGLE ---------- */

    loadProject(projectID) {
        return readProject(PREFIX + projectID);
    },

    loadFirstProject() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith(PREFIX)) continue;

            const project = readProject(key);
            if (project) return project;
        }
        return null;
    },


    /* ---------- LOAD MANY ---------- */

    loadAllProjects() {
        const projects = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith(PREFIX)) continue;

            const project = readProject(key);
            if (project) projects.push(project);
        }

        return projects;
    },

    loadProjectRefs() {
        return this.loadAllProjects().map(p => p.getRef());
    },

    loadTodos(filterFn=null) {
        const todos = [];

        for (const project of this.loadAllProjects()) {
            if (filterFn)
                todos.push(...project.todos.filter(filterFn));
            else
                todos.push(...project.todos);
        }

        return todos;
    }
};

export default storage;