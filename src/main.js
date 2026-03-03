import pubsub from "./pubsub.js";
import "./storage.js";
import "./popup.js";
import "./toolbar.js";
import "./sidebar.js";
import "./content.js";

(function() {
    document.addEventListener('beforeunload', () => pubsub.publish('exit'));

    pubsub.publish('init');
    pubsub.remove('init');
})();