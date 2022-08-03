import { Temporal } from "@js-temporal/polyfill";
// import getJourney from "./journey";
import { prepCanvasConfig, draw } from "./canvas";
import dummy from "./dummy";

const main = async () => {
  const journey = dummy;
  // const journey = await getJourney();

  if (!journey) {
    console.log("TODO: handle no journey found");
  } else {
    console.log("journey");
    journey.forEach((s) => {
      // console.log(s.arrivalTime?.toString(), s.departureTime?.toString());
      console.log(s.category, s.line || s.number, s.departureTime?.toString(), s.name);
    });

    const config = prepCanvasConfig();
    config.stops = journey;

    setInterval(() => {
      config.now = Temporal.Now.zonedDateTimeISO();
      // config.now = Temporal.Now.zonedDateTimeISO().with({ minute: 20 });
      draw(config);
    }, 500);
  }
};

main();
