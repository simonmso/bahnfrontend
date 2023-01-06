import { Temporal } from '@js-temporal/polyfill';
import dummy from './dummy';
import cfg from './config.json';

const createClock = () => {
    // create 60 dots, one in each minute position
    const dotsContainer = document.getElementById('dotsContainer');
    const dots = [];

    for (let i = 0; i <= 59; i++) {
        const newDot = document.createElement('div');
        newDot.className = 'dot';
        newDot.style = `--i:${i}`;
        dotsContainer.append(newDot);
        dots.push(newDot);
    }

    // get other references
    const clock = document.getElementById('clock');
    const stopsContainer = document.getElementById('stopsContainer');
    const stopCurveContainer = document.getElementById('stopCurveContainer');

    return {
        dots,
        clock,
        stopsContainer,
        stopCurveContainer,
    };
};

const initializeState = () => {
    const state = {
        elements: createClock(),
        problems: [],
        now: Temporal.Now.zonedDateTimeISO(),
        // now: Temporal.Now.zonedDateTimeISO().with({ minute: 53, second: 32 }),
        // now: Temporal.Now.zonedDateTimeISO(),
    };
    if (cfg.useDummy) state.stops = dummy;

    return state;
};

export default initializeState;
