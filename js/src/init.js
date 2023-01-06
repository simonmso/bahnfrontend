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

    return {
        dots,
        clock,
        stopsContainer,
    };
};

const initializeState = () => {
    const elements = createClock();
    const state = {
        elements,
        problems: [],
        now: Temporal.Now.zonedDateTimeISO(),
    };
    if (cfg.useDummy) state.stops = dummy;

    return state;
};

export default initializeState;
