import { laterOf, stopInNext, timeInNext } from './helpers';

const createStopDot = (stop, eventType, state) => {
    const newDot = document.createElement('div');
    newDot.className = 'dot stop';
    newDot.style = `--i:${stop[eventType].minute}`;
    newDot.setAttribute('stopId', stop.id);
    newDot.setAttribute('eventType', eventType);
    state.elements.stopsContainer.append(newDot);
    return newDot;
};
const newCurveSegment = (min) => {
    const newSeg = document.createElement('div');
    newSeg.className = 'dot stopSegment';
    newSeg.style = `--i:${min}`;
    newSeg.id = min;

    return newSeg;
};
const refreshStopCurve = (stop, now, state) => {
    const later = laterOf(stop.arrivalTime, now);

    const minute = later.minute + (later.second / 60);
    let max = stop.departureTime.minute;
    max = max > minute ? max : max + 60;
    let curMinute = max - 0.5;

    // add any new segments
    while (curMinute > minute) {
        const cur = curMinute; // makes eslint happy
        const seg = stop.elements.curve.find((s) => s.id === `${cur}`);
        if (!seg) {
            const newSeg = newCurveSegment(curMinute);
            state.elements.stopCurveContainer.append(newSeg);
            stop.elements.curve.push(newSeg);
        }
        curMinute -= 0.5;
    }

    // remove any unused segments
    const toRemove = [];
    stop.elements.curve.forEach((seg, i) => {
        const idm = Number(seg.id);
        const segMin = idm < minute ? idm + 60 : idm;
        if (segMin > max) toRemove.push(i);
    });
    // using a for loop instead of forEach to count down instead of up
    for (let i = toRemove.length - 1; i >= 0; i--) {
        stop.elements.curve[toRemove[i]].remove();
        stop.elements.curve.splice(toRemove[i], 1);
    }
};
const removeStopCurve = (stop) => {
    stop.elements.curve.forEach((segment) => segment.remove());
    stop.elements.curve = [];
};
const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        if (stop.show) {
            // show stop curve
            const stopIsSoon = stopInNext(stop, now, { minutes: 53 }, true);
            if (stop.arrivalTime && stop.departureTime && stopIsSoon) {
                refreshStopCurve(stop, now, state);
            }
            else removeStopCurve(stop);

            // show arrival dot if in next hour
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
            const dotDiff = i + 0.1 < now.minute ? i - now.minute + 60 : i - now.minute;
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
