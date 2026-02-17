export class TodoItem {

    constructor(title='My Todo', desc='', deadline=null, priority=2, complete=false, id=null) {
        this.title = title;
        this.desc = desc;
        this.deadline = deadline? new Date(deadline) : new Date();
        this.priority = priority;
        this.complete = complete;
        this.id = id || crypto.randomUUID();
    }

    equals(other) {
        return other && this.id === other.id;
    }

    markComplete() {
        this.complete = !this.complete;
    }

    getDeadlineText() {
        return 'Due Date:\n' + this.deadline.toLocaleDateString();
    }

    getPriorityText() {
        switch (this.priority) {
            case 0: return 'Some Day';
            case 1: return 'Low';
            case 2: return 'Medium';
            case 3: return 'High';
            case 4: return 'Urgent';
            default: return 'Unknown';
        } 
    }

    copy() {
        return new TodoItem(
            this.title,
            this.desc,
            this.deadline,
            this.priority,
            this.complete
        );
    }

    static fromJSON(obj) {
        return new TodoItem(
            obj.title,
            obj.desc,
            obj.deadline,
            obj.priority,
            obj.complete,
            obj.id
        );
    }
}


class ProjectRef {

    constructor(title, id) {
        this.title = title;
        this.id = id;
    }

    equals(other) {
        return other && this.id === other.id;
    }
}


export class Project {

    constructor(title='My Project', desc='', tags=null, todos=null, id=null) {
        this.title = title;
        this.desc = desc;
        this.tags = tags || [];
        this.todos = todos || [];
        this.id = id || crypto.randomUUID();
    }

    equals(other) {
        return other && this.id === other.id;
    }

    getRef() {
        return new ProjectRef(this.title, this.id);
    }

    copy() {
        return new Project(
            this.title,
            this.desc,
            this.tags,
            this.todos
        );
    }

    static fromJSON(obj) {
        return new Project(
            obj.title,
            obj.desc,
            obj.tags,
            obj.todos? obj.todos.map(todo => TodoItem.fromJSON(todo)) : [],
            obj.id
        );
    }
    
    static getDefault() {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return new Project(
            'Finish Todo List',
            'Stop procrastinating!!!',
            ['cool', 'beans'],
            [
                new TodoItem('Write Code', 
                    "You can't have a coding project without the code. Duh!", 
                    yesterday,
                    4,
                ),
                new TodoItem('Test Code',
                    "One does not simply test code in production.",
                    today,
                    3,
                ),
                new TodoItem('Eat Code',
                    "Get all the essential nutrients to start your day.",
                    tomorrow,
                    2,
                ),
                new TodoItem('Repeat',
                    "Just when you thought you finished...",
                    nextWeek,
                    1,
                ),
            ]
        );
    }
}