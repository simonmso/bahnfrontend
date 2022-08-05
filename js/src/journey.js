import { Temporal } from "@js-temporal/polyfill";
import { getPlanForTime, getAllChanges, getRecentChanges } from "./consumer";
import knownStations from "./knownStations.json";
import knownHbfs from "./knownHbfs.json";
import printStop from "./helpers";

const confirmActualTime = (stop) => {
  const s = { ...stop };
  s.departureTime = s.departureTime || s.plannedDepartureTime;
  s.arrivalTime = s.arrivalTime || s.plannedArrivalTime;
  s.show = s.real;
  return s;
};

const applyChangesToStop = (s, changes) => {
  const newStop = { ...s };
  const change = changes.find((c) => c.id === s.id);
  if (change) {
    Object.keys(s).forEach((k) => { newStop[k] = change[k] || s[k]; });
  }
  return newStop;
};

// Used when all stops are from the same station
const updateWithDelays = (stops, evaNo) => (
  getAllChanges(evaNo)
    .then((changes) => stops.map((s) => applyChangesToStop(s, changes)))
    .then((updated) => updated.map((s) => confirmActualTime(s)))
);

const updateStopWithDelays = (s) => {
  if (s.eva && s.real) {
    if (!s.departureTime && !s.arrivalTime) { // if delays have never been applied
      return getAllChanges(s.eva)
        .then((changes) => applyChangesToStop(s, changes))
        .then((changed) => confirmActualTime(changed));
    }
    return getRecentChanges(s.eva)
      .then((changes) => applyChangesToStop(s, changes));
  }
  return new Promise((resolve) => { resolve(s); });
};

const stopIsRelevant = (s) => {
  if (s.cancelled || !s.departureTime) return false;
  const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  if (s.departureTime) {
    const diff = s.departureTime.epochSeconds - now.epochSeconds;
    const tooDistant = (diff > 60 * 30) || (diff < -60 * 15);
    if (tooDistant) return false;
  }
  const cats = ["RE", "IC", "ICE", "EC"];
  // for 3rd party trains, the category is in the line,
  // ex: { category: 'ME', line: 'RE3' }
  return cats.includes(s.category) || cats.includes(s.line?.replace(/\d+/g, ""));
};

const findSoonestDepartureFromStation = async (evaNo) => {
  const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  const plans = [getPlanForTime(evaNo)];
  if (now.minute < 15) plans.push(getPlanForTime(evaNo, now.subtract({ hours: 1 })));
  if (now.minute > 30) plans.push(getPlanForTime(evaNo, now.add({ hours: 1 })));

  const relevant = await Promise.all(plans)
    .then((r) => updateWithDelays(r.flat(), evaNo))
    .then((updated) => updated.filter((s) => stopIsRelevant(s)));

  if (!relevant.length) return undefined;

  const nearestStop = relevant.reduce((best, cur) => {
    const bDiff = Math.abs(best.departureTime.epochSeconds - now.epochSeconds);
    const cDiff = Math.abs(cur.departureTime.epochSeconds - now.epochSeconds);
    return bDiff < cDiff ? best : cur;
  });
  return nearestStop;
};

const lessThanXApart = (t1, t2, x) => (
  Temporal.Duration.compare(
    { hours: x },
    t1.since(t2, { smallestUnit: "hour" }).abs(),
  ) === 1
);

const findStopInStation = async (tripId, stationName, latestStopTime, future = true) => {
  let testingTime = latestStopTime;
  const evaNo = knownStations[stationName];

  while (lessThanXApart(testingTime, latestStopTime, 10)) {
    if (!evaNo) {
      console.log(`could not find eva for ${stationName}`);
      break;
    }
    try {
      // disabling because the loop should only try one plan at a time
      // eslint-disable-next-line no-await-in-loop
      const stop = await getPlanForTime(evaNo, testingTime)
        .then((stops) => stops.find((s) => s.tripId === tripId));

      if (stop) {
        stop.name = stationName;
        stop.show = false;
        stop.eva = evaNo;
        return stop;
      }
    } catch { break; }

    testingTime = future
      ? testingTime.add({ hours: 1 })
      : testingTime.subtract({ hours: 1 });
  }
  console.log("could not find stop in station", stationName);
  return {
    show: false,
    tripId,
    name: stationName,
    eva: evaNo,
  };
};

const buildJourneyForNextHour = async (stop) => {
  let latestStopTime = stop.departureTime;
  const journey = [stop];

  // not using Promise.all or .forEach because I want each request to depend on
  // the departure time of the one before it
  for (let i = 0; i < stop.futureStops.length; i++) {
    const now = Temporal.Now.zonedDateTimeISO();
    if (latestStopTime.epochSeconds - now.epochSeconds > 3600) break;
    // eslint-disable-next-line no-await-in-loop
    const newStop = await findStopInStation(stop.tripId, stop.futureStops[i], latestStopTime);
    if (newStop.real) {
      latestStopTime = newStop.plannedDepartureTime;
      journey.push(newStop);
    }
  }

  return journey;
};

const getRandomKey = (obj) => {
  const keys = Object.keys(obj);
  const randIdx = Math.floor(Math.random() * keys.length);
  return keys[randIdx];
};

const getJourney = async () => {
  let stationName = getRandomKey(knownStations);
  let evaNo = knownStations[stationName];
  // let evaNo = 8002041;
  // let stationName = "Mainz Hbf";
  let nearest = await findSoonestDepartureFromStation(evaNo);

  let i = 0;
  while (!nearest && i < 4) {
    i++;
    stationName = getRandomKey(knownHbfs);
    evaNo = knownHbfs[stationName];
    // eslint-disable-next-line no-await-in-loop
    nearest = await findSoonestDepartureFromStation(evaNo);
  }

  if (!nearest) {
    console.log("No journey found at this time");
    return undefined;
  }

  nearest.name = stationName;
  nearest.eva = evaNo;

  console.log("Found nearest:");
  printStop(nearest);

  return buildJourneyForNextHour(nearest);
};

export const rebuildNextHour = async (stops) => {
  // filter out stops in the past
  const now = Temporal.Now.instant().epochSeconds;
  let newStops = stops?.filter((s) => {
    if (!s.real) return false;
    const t = s.arrivalTime || s.departureTime;
    const diff = t.epochSeconds - now;
    return diff > 0;
  });

  if (!newStops?.length) {
    console.log("journey finished");
    const newJourney = await getJourney();
    return newJourney;
  }

  // if the furthest stop is less than an hour away,
  // get all stops in the next hour
  const lastStop = newStops[newStops.length - 1];
  const t = lastStop.arrivalTime || lastStop.departureTime;
  const lastDiff = t.epochSeconds - now;
  if (lastStop.futureStops?.length && lastDiff < 3600) {
    const stopsToAdd = await buildJourneyForNextHour(lastStop);
    newStops = newStops.concat(stopsToAdd.slice(1));
  }

  return newStops;
};

export const rehydrateStops = (stops) => (
  Promise.all(stops.map((s) => (
    updateStopWithDelays(s)
  )))
);
