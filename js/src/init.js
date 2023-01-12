import { Temporal } from '@js-temporal/polyfill';
import dummy from './dummy';
import cfg from './config.json';
import d from './dom';

const createClock = () => {
    const dotsContainer = document.getElementById('dotsContainer');
    const trainContainer = document.getElementById('trainContainer');

    return {
        dots: d.createDots(dotsContainer),
        train: d.createTrain(trainContainer),
        defs: document.getElementById('defs'),
        stopsContainer: document.getElementById('stopsContainer'),
        clock: document.getElementById('clock'),
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
        // now: Temporal.Now.zonedDateTimeISO(),
        // now: Temporal.Now.zonedDateTimeISO().with({ minute: 53, second: 32 }),
        now: Temporal.Now.zonedDateTimeISO().with({ minute: 2, second: 32 }),
        // now: Temporal.Now.zonedDateTimeISO(),
    };
    state.pNow = {
        hour: state.now.hour,
        minute: state.now.minute,
        second: state.now.second,
        millisecond: state.now.millisecond,
    };
    if (cfg.useDummy) state.stops = dummy;

    d.updateHands(state);

    return state;
};

export default initializeState;
