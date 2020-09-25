import youTubePracticeTool from "./modules/youTubePracticeTool"
import logger from "./modules/logger"

// Attempt to create the YouTubePracticeTool on page load
// This will only be the initial page load. YouTube is a SPA, so subsequent page loads will not really "reload" the page but just trigger the "yt-navigate-finish" event
// youTubePracticeTool.create() may silently fail if there is no video on the page (e.g. on the home page)
youTubePracticeTool.create();

window.addEventListener("yt-navigate-finish", function() {
    logger.log('Event yt-navigate-finish fired');

    // Attempt to create YouTubePracticeTool if it couldn't be created yet (see comment above)
    if (!youTubePracticeTool.created) {
        youTubePracticeTool.create();
    }
    else {
        youTubePracticeTool.onYouTubePageChange();
    }
});