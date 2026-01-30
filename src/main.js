import pubsubModule from "./pubsub.js";
import renderModule from "./render.js";
import toolbarModule from "./toolbar.js";
import sidebarModule from "./sidebar.js";
import contentMondule from "./content.js";

(function() {
    // main content here
    pubsubModule.publish('view-mode');
})();