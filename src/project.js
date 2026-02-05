export class TodoItem {

    constructor(title='My Todo', desc='', deadline=null, priority=2, complete=false, id=null) {
        this.title = title;
        this.desc = desc;
        this.deadline = deadline || new Date();
        this.priority = priority;
        this.complete = complete;
        this.id = id || crypto.randomUUID();
    }

    equals(other) {
        return this.id === other.id;
    }

    markComplete() {
        this.complete = !this.complete;
    }

    getDeadlineText() {
        return 'Due Date:\n' + this.deadline.toDateString();
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
}


export class Project {

    constructor(title='My Project', desc='', tags=null, todos=null, id=null) {
        this.title = title;
        this.desc = desc;
        this.tags = tags || [];
        this.todos = todos || [];
        this.id = id || cryptos.randomUUID();
    }

    equals(other) {
        return this.id === other.id;
    }

    copy() {
        return new Project(
            this.title,
            this.desc,
            this.tags,
            this.todos,
            false,
        );
    }

    getDefault() {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate - 1);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate + 1);
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
        )
    }
}