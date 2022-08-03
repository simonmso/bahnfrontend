import { Temporal } from "@js-temporal/polyfill";
import { getPlanForTime, getChanges } from "./consumer";
import knownStations from "./knownStations.json";
import knownHbfs from "./knownHbfs.json";

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
  const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  if (s.departureTime && s.departureTime.epochSeconds - now.epochSeconds > 60 * 40) {
    return false;
  }
  const cats = ["RE", "IC", "ICE", "EC"];
  // for 3rd party trains, the category is in the line,
  // ex: { category: 'ME', line: 'RE3' }
  return cats.includes(s.category) || cats.includes(s.line?.replace(/\d+/g, ""));
};

const findSoonestDepartureFromStation = async (evaNo) => {
  const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  const plans = [getPlanForTime(evaNo)];
  if (now.minute > 20) {
    plans.push(getPlanForTime(evaNo, now.add({ hours: 1 })));
  }
  const relevant = await Promise.all(plans)
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

const lessThanXApart = (t1, t2, x) => (
  Temporal.Duration.compare(
    { hours: x },
    t1.since(t2, { smallestUnit: "hour" }).abs(),
  ) === 1
);

const findStopInStation = async (tripId, stationName, earliestStopTime, future = true) => {
  let testingTime = earliestStopTime;
  const evaNo = knownStations[stationName];

  while (lessThanXApart(testingTime, earliestStopTime, 10)) {
    // disabling because the loop should only try one plan at a time
    let foundInPlan;
    if (!evaNo) {
      console.log(`could not find eva for ${stationName}`);
      break;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      foundInPlan = await getPlanForTime(evaNo, testingTime)
        .then((stops) => stops.find((s) => s.tripId === tripId));

      if (foundInPlan) {
        // eslint-disable-next-line no-await-in-loop
        const stop = (await updateWithDelays([foundInPlan], evaNo))[0];
        stop.name = stationName;
        stop.show = true;
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
  };
};

const buildJourneyFromStop = async (stop) => {
  let earliestStopTime = stop.departureTime;
  const journey = [stop];

  if (stop.previousStops?.length) {
    const foundStop = await findStopInStation(
      stop.tripId,
      stop.previousStops[0],
      earliestStopTime,
      false, // search the past for the stop
    );
    if (foundStop) { journey.splice(0, 0, foundStop); }
  }

  // WORKING ON: only building the next hour of the journey out

  // not using Promise.all or .forEach because I want each request to depend on
  // the departure time of the one before it
  for (let i = 0; i < stop.futureStops.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const newStop = await findStopInStation(stop.tripId, stop.futureStops[i], earliestStopTime);
    if (newStop) {
      earliestStopTime = newStop.plannedDepartureTime;
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
  // let evaNo = 8000193;
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

  return buildJourneyFromStop(nearest);
};

export default getJourney;
