import { Temporal } from '@js-temporal/polyfill';
import dummy from './dummy';
import cfg from './config.json';
import d from './domHandler';

const createClock = () => {
    const svg = document.getElementById('svg');

    return {
        svg,
        dots: d.createDots(svg),
        clock: document.getElementById('clock'),
        stopCurveContainer: document.getElementById('stopCurveContainer'),
        hands: {
            minute: document.getElementById('minuteHand'),
            hour: document.getElementById('hourHand'),
        },
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

    d.updateHands(state);

    return state;
};

export default initializeState;
