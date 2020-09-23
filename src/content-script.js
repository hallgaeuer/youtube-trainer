import youTubeTrainer from "./modules/youTubeTrainer"
import logger from "./modules/logger"

youTubeTrainer.create();

window.addEventListener("yt-navigate-finish", function() {
    logger.log('Event yt-navigate-finish fired');

    youTubeTrainer.onYouTubePageChange();
});