import {
    laterOf,
    stopInNext,
    timeInNext,
    angleForMinute,
    angleForHour,
    hslForMinute,
    shorterOf,
} from './helpers';

const createDot = (minute) => {
    const newDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const theta = angleForMinute(minute);
    newDot.setAttribute('cx', Math.cos(theta));
    newDot.setAttribute('cy', Math.sin(theta));
    newDot.setAttribute('r', 0.01);
    newDot.classList.add('dot');
    newDot.style = `--i:${minute}; --gradSteepness:${7}; --gradIntercept:${60};`;
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
const refreshStopCurve = (stop, futureDepth, state) => {
    const startTime = laterOf(stop.arrivalTime, state.now);
    const startMinute = startTime.minute + (startTime.second / 60);

    const timeTilDep = stop.departureTime.since(state.now);
    const endTime = state.now.add(shorterOf(futureDepth, timeTilDep));
    const endMinute = endTime.minute + (endTime.second / 60);

    // refresh curve
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

    // refresh gradient
    const gradient = stop.elements.gradient
        || document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    const start = stop.elements.gradientStops?.start
        || document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    const end = stop.elements.gradientStops?.end
        || document.createElementNS('http://www.w3.org/2000/svg', 'stop');

    start.setAttribute('stop-color', hslForMinute(startMinute, state.pNow));
    end.setAttribute('stop-color', hslForMinute(endMinute, state.pNow));

    // make sure the gradient is going the correct direction
    const dx = fPos.x - iPos.x;
    const dy = fPos.y - iPos.y;
    gradient.setAttribute('cx', dx < 0 ? '100%' : '0%');
    gradient.setAttribute('cy', dy < 0 ? '100%' : '0%');
    gradient.setAttribute('r', `${(Math.hypot(dx, dy) / Math.abs(dx)) * 100}%`);

    if (curveIsNew) {
        start.setAttribute('offset', '0%');
        end.setAttribute('offset', '100%');
        gradient.id = `grad-${stop.id}`;
        state.elements.defs.appendChild(gradient);
        gradient.appendChild(start);
        gradient.appendChild(end);
        stop.elements.gradient = gradient;
        stop.elements.gradientStops = {
            start,
            end,
        };

        curve.setAttribute('stroke', `url(#grad-${stop.id})`);
    }
};
const updateStops = (state) => {
    const { stops, now } = state;

    stops.forEach((stop) => {
        if (stop.show) {
            const futureDepth = { minutes: 59 };
            // show stop curve
            const stopIsSoon = stopInNext(stop, now, futureDepth, true);
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
                if (stop[eventType] && timeInNext(stop[eventType], futureDepth, now)) {
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
// blacks out dots if they're after the final stop
const updateDots = (state) => {
    const {
        stops, now, pNow, elements,
    } = state;
    const endStop = stops.find((s) => s.arrivalTime && !s.departureTime);

    // hide all dots if there isn't an active journey
    if (!endStop) elements.dots.forEach((d) => d.setAttribute('hide', true));

    else if (timeInNext(endStop.arrivalTime, { minutes: 59 }, now)) {
        elements.dots.forEach((d, i) => {
            const dotDiff = i + 0.1 < pNow.minute ? i - pNow.minute + 60 : i - pNow.minute;
            const stopDiff = endStop.arrivalTime.since(now).minutes;
            d.setAttribute('hide', dotDiff > stopDiff);
        });
    }
};
const updateHands = (state) => {
    const { elements } = state;
    const now = state.pNow;
    const min = now.minute + (now.second / 60) + (now.millisecond / (60 * 1000));
    const thetaM = angleForMinute(min);
    const thetaH = angleForHour(now.hour + (min / 60));
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
