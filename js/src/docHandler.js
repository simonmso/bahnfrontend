import { timeInNext } from './helpers';

const createStopDot = (stop, eventType, state) => {
    const newDot = document.createElement('div');
    newDot.className = 'dot stop';
    newDot.style = `--i:${stop[eventType].minute}`;
    newDot.setAttribute('stopId', stop.id);
    newDot.setAttribute('eventType', eventType);
    state.elements.stopsContainer.append(newDot);
    return newDot;
};
const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        if (stop.show) {
            // show stop if in next hour
            if (stop.arrivalTime && timeInNext(stop.arrivalTime, { minutes: 53 }, now)) {
                if (stop.elements?.arrivalTime) stop.elements.arrivalTime.style = `--i:${stop.arrivalTime.minute}`;
                else stop.elements.arrivalTime = createStopDot(stop, 'arrivalTime', state);
            }
            // otherwise remove the stop dot
            else if (stop.elements?.arrivalTime) stop.elements.arrivalTime.remove();

            // do the same for the departure time
            if (stop.departureTime && timeInNext(stop.departureTime, { minutes: 53 }, now)) {
                if (stop.elements?.departureTime) stop.elements.departureTime.style = `--i:${stop.departureTime.minute}`;
                else stop.elements.departureTime = createStopDot(stop, 'departureTime', state);
            }
            else if (stop.elements?.departureTime) stop.elements.departureTime.remove();
        }
    });

    // TODO: double check that remove actually removes the reference as well

    // TODO: deal with dots after final stop
};
const updateHands = (state) => {
    state.elements.clock.style = `--hour: ${state.now.hour};
                                --minute: ${state.now.minute};
                                --second: ${state.now.second};
                                --millisecond: ${state.now.millisecond};`;
};

export default {
    updateHands,
    updateStops,
};
