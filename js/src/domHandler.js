import {
    laterOf, stopInNext, timeInNext, angleForMinute, angleForHour,
} from './helpers';

const createDot = (minute) => {
    const newDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const theta = angleForMinute(minute);
    newDot.setAttribute('cx', Math.cos(theta));
    newDot.setAttribute('cy', Math.sin(theta));
    newDot.setAttribute('r', 0.01);
    newDot.classList.add('dot');
    newDot.style = `--i:${minute}`;
    return newDot;
};
const createDots = (svg) => {
    const dots = [];
    for (let i = 0; i <= 59; i++) {
        const newDot = createDot(i);
        svg.appendChild(newDot);
        dots.push(newDot);
    }
    return dots;
};
const createStopDot = (stop, eventType, state) => {
    const newDot = createDot(stop[eventType].minute);
    newDot.classList.add('stop');
    newDot.setAttribute('r', 0.03);
    newDot.setAttribute('stopId', stop.id);
    newDot.setAttribute('eventType', eventType);
    state.elements.svg.append(newDot);
    return newDot;
};
const refreshStopDot = (stop, eventType) => {
    const dot = stop.elements[eventType];
    const theta = angleForMinute(stop[eventType].minute);
    dot.setAttribute('cx', Math.cos(theta));
    dot.setAttribute('cy', Math.sin(theta));
};
const refreshStopCurve = (stop, state) => {
    const later = laterOf(stop.arrivalTime, state.now);
    const startMinute = later.minute + (later.second / 60);
    const endMinute = stop.departureTime.minute;

    const curveIsNew = !stop.elements.curve;
    const curve = stop.elements.curve
        || document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const iTheta = angleForMinute(startMinute);
    const fTheta = angleForMinute(endMinute);
    const iPos = { x: Math.cos(iTheta), y: Math.sin(iTheta) };
    const fPos = { x: Math.cos(fTheta), y: Math.sin(fTheta) };
    curve.setAttribute('d', `
        M ${iPos.x},${iPos.y}
        A 1 1 0 0 1 ${fPos.x},${fPos.y}
    `);

    if (curveIsNew) {
        curve.classList.add('curve');
        state.elements.svg.appendChild(curve);
        stop.elements.curve = curve;
    }
};
const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        if (stop.show) {
            // show stop curve
            const stopIsSoon = stopInNext(stop, now, { minutes: 53 }, true);
            if (stop.arrivalTime && stop.departureTime && stopIsSoon) refreshStopCurve(stop, state);
            else if (stop.elements.curve) {
                stop.elements.curve.remove();
                stop.elements.curve = undefined;
            }

            // show arrival dot if in next hour
            if (stop.arrivalTime && timeInNext(stop.arrivalTime, { minutes: 53 }, now)) {
                if (stop.elements.arrivalTime) refreshStopDot(stop, 'arrivalTime');
                else stop.elements.arrivalTime = createStopDot(stop, 'arrivalTime', state);
            }
            // otherwise remove the stop dot
            else if (stop.elements.arrivalTime) {
                stop.elements.arrivalTime.remove();
                stop.elements.arrivalTime = undefined;
            }

            // do the same for the departure time
            if (stop.departureTime && timeInNext(stop.departureTime, { minutes: 53 }, now)) {
                if (stop.elements.departureTime) refreshStopDot(stop, 'arrivalTime');
                else stop.elements.departureTime = createStopDot(stop, 'departureTime', state);
            }
            else if (stop.elements.departureTime) {
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

    // hide all dots if there isn't an active journey
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
    const { now, elements } = state;
    const thetaM = angleForMinute(now.minute + (now.second / 60) + (now.millisecond / (60 * 1000)));
    const thetaH = angleForHour(now.hour) + (thetaM / 60);
    elements.hands.minute.setAttribute('x2', 0.8 * Math.cos(thetaM));
    elements.hands.minute.setAttribute('y2', 0.8 * Math.sin(thetaM));
    elements.hands.hour.setAttribute('x2', 0.5 * Math.cos(thetaH));
    elements.hands.hour.setAttribute('y2', 0.5 * Math.sin(thetaH));

    // used for gradient, might delete later
    elements.clock.style = `--hour: ${state.now.hour};
                                --minute: ${state.now.minute};
                                --second: ${state.now.second};
                                --millisecond: ${state.now.millisecond};`;
};

export default {
    createDots,
    updateHands,
    updateStops,
    updateDots,
};
