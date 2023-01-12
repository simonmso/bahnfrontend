import { angleForMinute, journeyNotOver, timeInNext } from '../helpers';
import cfg from '../config.json';

export const createDot = (minute) => {
    const newDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const theta = angleForMinute(minute);
    newDot.setAttribute('cx', Math.cos(theta));
    newDot.setAttribute('cy', Math.sin(theta));
    newDot.setAttribute('r', 0.01);
    newDot.setAttribute('hide', true);
    newDot.classList.add('dot');
    const gs = cfg.dots.gradientSteepness;
    const gi = cfg.dots.gradientIntercept;
    newDot.style = `--i:${minute}; --gradSteepness:${gs}; --gradIntercept:${gi};`;
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
    if (!journeyNotOver(state)) {
        elements.dots.forEach((d) => d.setAttribute('hide', true));
    }
    // hide dots that are past the last stop
    else if (endStop && timeInNext(endStop.arrivalTime, { minutes: 59 }, now)) {
        elements.dots.forEach((d, i) => {
            const dotDiff = i + 0.1 < pNow.minute ? i - pNow.minute + 60 : i - pNow.minute;
            // using epoch seconds instead of .since() for performance reasons
            const stopDiff = (endStop.arrivalTime.epochSeconds - now.epochSeconds) / 60;
            d.setAttribute('hide', dotDiff > stopDiff);
        });
    }
    // show dots
    else {
        elements.dots.forEach((d) => d.setAttribute('hide', false));
    }
};
