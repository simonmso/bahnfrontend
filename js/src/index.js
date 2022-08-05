import { Temporal } from "@js-temporal/polyfill";
import { rebuildNextHour, rehydrateStops } from "./journey";
import { prepCanvasConfig, draw } from "./canvas";
import printStop from "./helpers";
// import dummy from "./dummy";

const main = async () => {
  const config = prepCanvasConfig();

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

  setInterval(() => {
    config.now = Temporal.Now.zonedDateTimeISO();
    // config.now = Temporal.Now.zonedDateTimeISO().with({ minute: 50 });
    draw(config);
  }, 500);

  manageJourney();

  setInterval(manageJourney, 1000 * 60 * 1.5);
};

main();
