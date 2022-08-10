import { Temporal } from "@js-temporal/polyfill";
import { getJourney, completeNextHour, rehydrateStops } from "./journey";
import cvs from "./canvas";
import { printStops, stopInFuture, stopInPast } from "./helpers";
import info from "./info";
// import dummy from "./dummy";

const main = async () => {
  const config = cvs.prepCanvasGetConfig();
  // config.stops = dummy;

  const refreshTime = () => {
    config.now = Temporal.Now.zonedDateTimeISO();
    // config.now = Temporal.Now.zonedDateTimeISO().add({ hours: 1 });
    // config.now = Temporal.Now.zonedDateTimeISO().with({ minute: 10 });
  };

  const cycleInfo = () => {
    refreshTime();
    const oldInfo = config.info;
    if (oldInfo?.type === "train") config.info = info.getNextInfo(config);
    else config.info = info.getTrainInfo(config);

    config.animating = true;
    const drawCallback = () => {
      refreshTime();
      cvs.drawJourney(config);
      cvs.drawHands(config);
    };
    info.transitionInfo(oldInfo?.text, config.info?.text, config, drawCallback)
      .catch((e) => console.log("failed transitioning", e))
      .finally(() => { config.animating = false; });
  };

  const manageJourney = async () => {
    refreshTime();
    const stopsToCome = config.stops?.some((s) => s.real && stopInFuture(s, config.now, true));
    const action = stopsToCome
      ? completeNextHour(config.stops)
      : getJourney();

    try {
      config.stops = await action.then((stops) => rehydrateStops(stops));
      if (!stopsToCome) cycleInfo();
      console.log("config.stops", config.stops);
      printStops(config.stops);
    } catch (e) { console.log("failed building", e); }
  };

  // I'm not sure we still need this
  const journeyIsOver = () => {
    const noStops = !config.stops?.length;
    if (noStops) return true;
    const lastStop = config.stops[config.stops.length - 1];
    const futureStops = config.futureStops?.length;
    if (futureStops) return false;
    return stopInPast(lastStop, config.now);
  };

  const draw = () => {
    refreshTime();
    if (!config.animating) {
      cvs.clear(config);
      if (!journeyIsOver()) {
        cvs.drawJourney(config);
        info.drawInfo(config);
      }
      cvs.drawHands(config);
    }
  };

  manageJourney();
  draw();

  setInterval(manageJourney, 1000 * 60 * 1.5);
  setInterval(draw, 400);
  setInterval(cycleInfo, 30 * 1000);
};

main();
