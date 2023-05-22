import Stop from './Stop';
import { removeStop } from './dom/stopFns';
import config from './config.json';

const getJourney = () => fetch(config.apiUrl)
    .then((resp) => resp.json())
    .then((stops) => stops.map((s) => new Stop(s)));

export const updateStops = async (stops) => {
    const oldStops = stops || [];
    const journey = await getJourney();
    const newStops = journey.map((newStop) => {
        const oldIdx = oldStops.findIndex((o) => o.id === newStop.id);
        if (oldIdx >= 0) {
            const oldStop = oldStops.splice(oldIdx, 1)[0];
            return oldStop.with(newStop);
        }
        return newStop;
    });

    // delete the dots and curves for any stops that
    // are no longer included
    oldStops.forEach(removeStop);

    return newStops;
};

export default getJourney;
