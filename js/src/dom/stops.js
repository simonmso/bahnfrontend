import { angleForMinute, stopInNext, timeInNext } from '../helpers';
import { createDot } from './dots';
import refreshStopCurve from './stopCurves';

const createStopDot = (stop, eventType, state) => {
    const newDot = createDot(stop.p[eventType].minute);
    newDot.classList.add('stop');
    newDot.setAttribute('r', 0.03);
    newDot.setAttribute('stopId', stop.id);
    newDot.setAttribute('eventType', eventType);
    newDot.setAttribute('hide', false);
    state.elements.stopsContainer.append(newDot);
    return newDot;
};
const refreshStopDot = (stop, eventType) => {
    const dot = stop.elements[eventType];
    const theta = angleForMinute(stop.p[eventType].minute);
    dot.setAttribute('cx', Math.cos(theta));
    dot.setAttribute('cy', Math.sin(theta));
};
const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        if (stop.show) {
            const futureDepth = 59;
            // show stop curve
            const stopIsSoon = stopInNext(stop, now, { minutes: futureDepth }, true);
            if (stop.arrivalTime && stop.departureTime && stopIsSoon) {
                refreshStopCurve(stop, futureDepth, state);
            }
            else if (stop.elements.curve) {
                stop.elements.curve.remove();
                stop.elements.curve = undefined;
                stop.elements.gradient.remove();
                stop.elements.gradient = undefined;
                stop.elements.gradientStops.start.remove();
                stop.elements.gradientStops.start = undefined;
                stop.elements.gradientStops.end.remove();
                stop.elements.gradientStops.end = undefined;
            }

            ['arrivalTime', 'departureTime'].forEach((eventType) => {
                // show the stop dot for the specific event if in the next hour
                if (stop[eventType] && timeInNext(stop[eventType], { minutes: futureDepth }, now)) {
                    if (stop.elements[eventType]) refreshStopDot(stop, eventType);
                    else stop.elements[eventType] = createStopDot(stop, eventType, state);
                }
                // otherwise remove the stop dot
                else if (stop.elements[eventType]) {
                    stop.elements[eventType].remove();
                    stop.elements[eventType] = undefined;
                }
            });
        }
    });
};

export default updateStops;
