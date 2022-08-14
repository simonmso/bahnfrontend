import { prepCanvasGetState } from "./canvasFns";
import drawJourney from "./journeyCircle";
import drawHands from "./hands";
import info from "./info";

// WORKING ON: three layers of canvas

const clearClock = (state) => {
  state.ctxs.clock.clearRect(0, 0, state.width, state.height);
};

export default {
  prepCanvasGetState,
  clearClock,
  drawJourney,
  drawHands,
  info,
};
