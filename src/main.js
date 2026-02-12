import pubsub from "./pubsub.js";
import "./storage.js";
import "./popup.js";
import "./toolbar.js";
import "./sidebar.js";
import "./content.js";

(function() {
    pubsub.publish('init');
})();