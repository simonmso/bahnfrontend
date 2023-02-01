import Stop from './Stop';

const getJourney = () => {
    const url = '/api/journey';
    return fetch(url)
        .then((resp) => resp.json())
        .then((stops) => stops.map((s) => new Stop(s)));
};

export const updateStops = async (oldStops) => {
    const newStops = await getJourney();
    return newStops.map((newStop) => {
        const oldStop = oldStops?.find((o) => o.id === newStop.id);
        const ret = oldStop ? oldStop.with(newStop) : newStop;
        return ret;
    });
};

export default getJourney;
