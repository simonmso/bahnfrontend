// import getJourney from "./journey";
import { prepCanvasConfig, draw } from "./canvas";
import dummy from "./dummy";

// getJourney()
//   .then((journey) => {
//     console.log("journey");
//     journey.forEach((s) => {
//       console.log(s.arrivalTime?.toString(), s.departureTime?.toString());
//       // console.log(s.category, s.line || s.number, s.departureTime?.toString(), s.name);
//     });
//   });
const config = prepCanvasConfig();
config.stops = dummy;
dummy.forEach((s) => console.log(s.arrivalTime?.toLocaleString("en-GB"), s.departureTime?.toLocaleString("en-GB")));

setInterval(() => draw(config), 500);