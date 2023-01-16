import { Temporal } from '@js-temporal/polyfill';

const getJourney = () => {
    const url = '/api/journey';
    return fetch(url)
        .then((resp) => resp.json())
        .catch((e) => console.error(e));
};

const deserializeTimes = (stop) => ({
    ...stop,
    departureTime: stop.departureTime
        ? Temporal.ZonedDateTime.from(stop.departureTime)
        : undefined,
    arrivalTime: stop.arrivalTime
        ? Temporal.ZonedDateTime.from(stop.arrivalTime)
        : undefined,
});

const setPerformativeTimes = (stop) => {
    const s = { ...stop };
    s.p = {
        arrivalTime: s.arrivalTime
            ? {
                hour: s.arrivalTime.hour,
                minute: s.arrivalTime.minute,
                second: s.arrivalTime.second,
            } : undefined,
        departureTime: s.departureTime
            ? {
                hour: s.departureTime.hour,
                minute: s.departureTime.minute,
                second: s.departureTime.second,
            } : undefined,
    };
    return s;
};

export const updateStops = async (oldStops) => {
    const newStops = await getJourney();
    return newStops.map((newStop) => {
        const defaultStop = {
            show: true,
            real: true,
            elements: {},
        };
        const oldStop = oldStops?.find((o) => o.id === newStop.id) || defaultStop;
        let ret = {
            ...oldStop,
            ...newStop,
        };
        ret = deserializeTimes(ret);
        ret = setPerformativeTimes(ret);
        return ret;
    });
};

export default getJourney;
