import { Temporal } from '@js-temporal/polyfill';
import { angleForMinute, timeInNext } from '../helpers';

export const createDot = (minute) => {
    const newDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const theta = angleForMinute(minute);
    newDot.setAttribute('cx', Math.cos(theta));
    newDot.setAttribute('cy', Math.sin(theta));
    newDot.setAttribute('r', 0.01);
    newDot.classList.add('dot');
    // TODO: the steepness and intercept should actually be pulled from somewhere
    newDot.style = `--i:${minute}; --gradSteepness:${7}; --gradIntercept:${50};`;
    return newDot;
};
export const createDots = (parent) => {
    const dots = [];
    for (let i = 0; i <= 59; i++) {
        const newDot = createDot(i);
        parent.appendChild(newDot);
        dots.push(newDot);
    }
    return dots;
};

// blacks out dots if they're after the final stop
export const updateDots = (state) => {
    const {
        stops, now, pNow, elements,
    } = state;
    const endStop = stops.find((s) => s.arrivalTime && !s.departureTime);

    // hide all dots if there isn't an active journey
    if (!endStop || Temporal.ZonedDateTime.compare(now, endStop.arrivalTime) >= 1) {
        elements.dots.forEach((d) => d.setAttribute('hide', true));
    }
    else if (timeInNext(endStop.arrivalTime, { minutes: 59 }, now)) {
        elements.dots.forEach((d, i) => {
            const dotDiff = i + 0.1 < pNow.minute ? i - pNow.minute + 60 : i - pNow.minute;
            const stopDiff = endStop.arrivalTime.since(now).minutes;
            d.setAttribute('hide', dotDiff > stopDiff);
        });
    }
};
