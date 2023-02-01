import { stopInNext } from '../helpers';
import refreshStop, { removeStop } from './stopFns';

const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        const futureDepth = 59;
        const stopIsSoon = stopInNext(stop, now, { minutes: futureDepth }, true);

        if (stopIsSoon) refreshStop(stop, futureDepth, state);
        else removeStop(stop);
    });
};

export default updateStops;
