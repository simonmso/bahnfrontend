import { Temporal } from "@js-temporal/polyfill";
import { getPlanForTime, getChanges } from "./consumer";

const confirmActualTime = (stop) => {
  const s = { ...stop };
  s.departureTime = s.departureTime || s.plannedDepartureTime;
  s.arrivalTime = s.arrivalTime || s.plannedArrivalTime;
  return s;
};

const applyChangesToStops = (stops, changes) => (
  stops.map((s) => {
    const newStop = { ...s };
    const change = changes.find((c) => c.id === s.id);
    if (change) {
      Object.keys(s).forEach((k) => { newStop[k] = change[k] || s[k]; });
    }
    return newStop;
  })
);

const updateWithDelays = (stops, evaNo) => (
  getChanges(evaNo)
    .then((changes) => applyChangesToStops(stops, changes))
    .then((updated) => updated.map((s) => confirmActualTime(s)))
);

const stopIsRelevant = (s) => {
  if (s.cancelled || !s.departureTime) { return false; }
  const cats = ["RE", "IC", "ICE", "EC"];
  // for 3rd party trains, the category is in the line,
  // ex: { category: 'ME', line: 'RE3' }
  return cats.includes(s.category) || cats.includes(s.line?.replace(/\d+/g, ""));
};

const findSoonestDepartureFromStation = async (evaNo) => {
  const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  const plan1 = getPlanForTime(evaNo);
  const plan2 = getPlanForTime(evaNo, now.add({ hours: 1 }));
  const relevant = await Promise.all([plan1, plan2])
    .then((r) => updateWithDelays([...r[0], ...r[1]], evaNo))
    .then((updated) => updated.filter((s) => stopIsRelevant(s)));

  if (!relevant.length) { return undefined; }

  const nearestStop = relevant.reduce((best, cur) => {
    const bDiff = Math.abs(best.departureTime.epochSeconds - now.epochSeconds);
    const cDiff = Math.abs(cur.departureTime.epochSeconds - now.epochSeconds);
    return bDiff < cDiff ? best : cur;
  });
  return nearestStop;
};

const getJourney = async () => {
  const evaNo = 8011160; // berlin hbf
  const name = "Berlin Hbf";
  const nearest = await findSoonestDepartureFromStation(evaNo);

  nearest.name = name;
};

export default getJourney;
