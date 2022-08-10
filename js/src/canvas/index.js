import { prepCanvasGetConfig } from "./canvasFns";
import drawJourney from "./journeyCircle";
import drawHands from "./hands";
import info from "./info";

// WORKING ON: three layers of canvas

const clearClock = (config) => {
  config.ctxs.clock.clearRect(0, 0, config.width, config.height);
};

export default {
  prepCanvasGetConfig,
  clearClock,
  drawJourney,
  drawHands,
  info,
};
