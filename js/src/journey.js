import { Temporal } from '@js-temporal/polyfill';
import API from './consumer';
import journey from './journeyFns';
import knownStations from './knownStations.json';
import knownHbfs from './knownHbfs.json';
import {
    getRandomKey,
    lessThanXApart,
    stopInFuture,
    stopInNext,
    toS,
} from './helpers';

// Used when all stops are from the same station
const updateWithDelays = (stops, evaNo) => (
    API.getAllChanges(evaNo)
        .then((changes) => stops.map((s) => journey.applyChangesToStop(s, changes)))
        .then((updated) => updated.map((s) => journey.confirmActualTime(s)))
);

const updateStopWithDelays = (s) => {
    if (s.eva && s.real) {
        if (!s.departureTime && !s.arrivalTime) { // if delays have never been applied
            return API.getAllChanges(s.eva)
                .then((changes) => journey.applyChangesToStop(s, changes))
                .then((changed) => journey.confirmActualTime(changed));
        }
        return API.getRecentChanges(s.eva)
            .then((changes) => journey.applyChangesToStop(s, changes));
    }
    return new Promise((resolve) => {
        resolve(s);
    });
};

const findSoonestDepartureFromStation = async (evaNo) => {
    const now = Temporal.Now.zonedDateTimeISO();
    const plans = [API.getPlanForTime(evaNo)];
    if (now.minute < 15) plans.push(API.getPlanForTime(evaNo, now.subtract({ hours: 1 })));
    if (now.minute > 30) plans.push(API.getPlanForTime(evaNo, now.add({ hours: 1 })));

    const relevant = await Promise.all(plans)
        .then((r) => updateWithDelays(r.flat(), evaNo))
        .then((updated) => updated.filter((s) => journey.stopIsRelevant(s)));

    if (!relevant?.length) return undefined;

    return relevant.reduce((best, cur) => {
        const bDiff = best.departureTime.since(now).abs();
        const cDiff = cur.departureTime.since(now).abs();
        return Temporal.Duration.compare(bDiff, cDiff) <= 0 ? best : cur;
    });
};

const findStopInStation = async (tripId, stationName, latestStopTime, future = true) => {
    let testingTime = latestStopTime;
    const evaNo = knownStations[stationName];
    let problem;

    while (lessThanXApart(testingTime, latestStopTime, { hours: 10 })) {
        if (!evaNo) {
            console.log(`could not find eva for ${stationName}`);
            problem = 'unknown eva';
            break;
        }
        try {
            // disabling because the loop should only try one plan at a time
            // eslint-disable-next-line no-await-in-loop
            const stop = await API.getPlanForTime(evaNo, testingTime)
                .then((stops) => stops.find((s) => s.tripId === tripId));

            if (stop) {
                stop.name = stationName;
                stop.show = false;
                stop.eva = evaNo;
                return stop;
            }
        }
        catch (e) {
            problem = e;
            break;
        }

        testingTime = future
            ? testingTime.add({ hours: 1 })
            : testingTime.subtract({ hours: 1 });
    }
    console.log('could not find stop in station', stationName);
    return {
        show: false,
        tripId,
        name: stationName,
        eva: evaNo,
        problem,
    };
};

const buildJourneyForNextHour = async (stop) => {
    let latestStopTime = stop.departureTime;
    const nextHour = [stop];
    const problems = [];

    // not using Promise.all or .forEach because I want each request to depend on
    // the departure time of the one before it
    for (let i = 0; i < stop.futureStops.length; i++) {
        const now = Temporal.Now.zonedDateTimeISO();
        if (!lessThanXApart(latestStopTime, now, { hours: 1 })) break;
        // eslint-disable-next-line no-await-in-loop
        const newStop = await findStopInStation(stop.tripId, stop.futureStops[i], latestStopTime);
        if (newStop.real) {
            latestStopTime = newStop.plannedDepartureTime;
            nextHour.push(newStop);
        }
        else problems.push(newStop);
    }

    return {
        stops: nextHour,
        problems: problems.length ? problems : undefined,
    };
};

const findSoonestFromRandom = async (hbf = false) => {
    const stationName = getRandomKey(hbf ? knownHbfs : knownStations);
    const evaNo = knownStations[stationName];
    const nearest = await findSoonestDepartureFromStation(evaNo);
    if (nearest) {
        nearest.eva = evaNo;
        nearest.name = stationName;
    }
    return nearest;
};

export const getJourney = async () => {
    let nearest = await findSoonestFromRandom();
    for (let i = 0; i < 4; i++) {
        if (nearest) break;
        // eslint-disable-next-line no-await-in-loop
        nearest = await findSoonestFromRandom(true);
    }

    if (!nearest) {
        console.log('No journey found at this time');
        return undefined;
    }
    console.log('found nearest:\n', toS(nearest));

    return buildJourneyForNextHour(nearest);
};

export const completeNextHour = async (stops) => {
    const now = Temporal.Now.zonedDateTimeISO();

    let nextStops = stops?.filter((s) => s.real && stopInFuture(s, now, true));

    // if the furthest stop is less than an hour away,
    // get some stops after it
    const lastStop = nextStops[nextStops.length - 1];
    if (lastStop.futureStops?.length && stopInNext(lastStop, now, { hours: 1 }, true)) {
        const stopsToAdd = await buildJourneyForNextHour(lastStop);
        nextStops = nextStops.concat(stopsToAdd.slice(1));
    }

    return { stops: nextStops };
};

export const rehydrateStops = (stops) => (
    Promise.all(stops.map((s) => (
        updateStopWithDelays(s)
    )))
);
