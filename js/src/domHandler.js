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
            else if (stop.elements?.arrivalTime) {
                stop.elements.arrivalTime.remove();
                stop.elements.arrivalTime = undefined;
            }

            // do the same for the departure time
            if (stop.departureTime && timeInNext(stop.departureTime, { minutes: 53 }, now)) {
                if (stop.elements?.departureTime) stop.elements.departureTime.style = `--i:${stop.departureTime.minute}`;
                else stop.elements.departureTime = createStopDot(stop, 'departureTime', state);
            }
            else if (stop.elements?.departureTime) {
                stop.elements.departureTime.remove();
                stop.elements.departureTime = undefined;
            }
        }
    });
};
// blacks out dots if they're after the final stop
const updateDots = (state) => {
    const { stops, now, elements } = state;
    const endStop = stops.find((s) => s.arrivalTime && !s.departureTime);

    if (!endStop) elements.dots.forEach((d) => d.setAttribute('hide', true));

    else if (timeInNext(endStop.arrivalTime, { minutes: 59 }, now)) {
        elements.dots.forEach((d, i) => {
            const dotDiff = i < now.minute ? i - now.minute + 60 : i - now.minute;
            const stopDiff = endStop.arrivalTime.since(now).minutes;
            d.setAttribute('hide', dotDiff > stopDiff);
        });
    }
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
    updateDots,
};
