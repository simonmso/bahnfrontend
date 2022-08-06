import { Temporal } from "@js-temporal/polyfill";
import { rebuildNextHour, rehydrateStops } from "./journey";
import {
  prepCanvasConfig, drawJourney, clear,
} from "./canvas";
import printStop from "./helpers";
import {
  drawInfo, getNextInfo, getTrainInfo, transitionInfo,
} from "./info";
import drawHands from "./hands";
// import dummy from "./dummy";

const main = async () => {
  const config = prepCanvasConfig();
  // config.stops = dummy;

  const manageJourney = () => {
    rebuildNextHour(config.stops)
      .then((stops) => rehydrateStops(stops))
      .then((upToDate) => { config.stops = upToDate; })
      .then(() => {
        console.log("config.stops", config.stops);
        config.stops.forEach((s) => printStop(s));
      })
      .catch((e) => console.log("failed building", e));
  };

  const refreshTime = () => {
    config.now = Temporal.Now.zonedDateTimeISO();
    // config.now = Temporal.Now.zonedDateTimeISO().add({ hours: 2 });
    // config.now = Temporal.Now.zonedDateTimeISO().with({ minute: 27 });
  };

  const journeyIsOver = () => {
    const noStops = !config.stops?.length;
    if (noStops) return true;
    const lastStop = config.stops[config.stops.length - 1];
    const futureStops = config.futureStops?.length;
    if (futureStops) return false;
    const lastStopInPast = lastStop.arrivalTime.epochSeconds - config.now.epochSeconds < 0;
    return lastStopInPast;
  };

  const draw = () => {
    refreshTime();
    if (!config.animating) {
      clear(config);
      if (!journeyIsOver()) {
        drawJourney(config);
        drawInfo(config);
      }
      drawHands(config);
    }
  };

  const cycleInfo = () => {
    refreshTime();
    const oldInfo = config.info;
    if (oldInfo?.type === "next") config.info = getTrainInfo(config);
    else config.info = getNextInfo(config);
    config.animating = true;
    const drawCallback = () => {
      refreshTime();
      drawJourney(config);
      drawHands(config);
    };
    transitionInfo(oldInfo?.text, config.info?.text, config, drawCallback)
      .catch((e) => {
        console.log("failed transitioning", e);
      })
      .finally(() => { config.animating = false; });
  };

  manageJourney();
  cycleInfo();
  draw();

  setInterval(manageJourney, 1000 * 60 * 1.5);
  setInterval(draw, 400);
  setInterval(cycleInfo, 30 * 1000);
};

main();
