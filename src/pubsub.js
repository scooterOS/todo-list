const events = {
    events: {},

    subscribe: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },

    unsubscribe: function (eventName, fn) {
        const listeners = this.events[eventName];
        if (!listeners) return;

        this.events[eventName] = listeners.filter(f => f !== fn);
    },
    
    publish: function (eventName, ...args) {
        const listeners = this.events[eventName];
        if (!listeners) return;

        [...listeners].forEach(fn => fn(...args));
    }
};

export default events;