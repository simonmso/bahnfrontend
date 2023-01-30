import Stop from './Stop';

const getJourney = () => {
    const url = '/api/journey';
    return fetch(url)
        .then((resp) => resp.json())
        .then((stops) => stops.map((s) => new Stop(s)));
};

const setPerformativeTimes = (s) => {
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
};

export const updateStops = async (oldStops) => {
    const newStops = await getJourney();
    return newStops.map((newStop) => {
        const oldStop = oldStops?.find((o) => o.id === newStop.id);
        const ret = oldStop ? oldStop.with(newStop) : newStop;
        setPerformativeTimes(ret);
        return ret;
    });
};

export default getJourney;
