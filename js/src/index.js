import { Temporal } from '@js-temporal/polyfill';
import { printStops } from './helpers';
import initializeState from './init';
import d from './dom';
import { updateStops } from './newConsumer';

const main = async () => {
    const state = initializeState();

    const refreshTime = () => {
        state.now = Temporal.Now.zonedDateTimeISO();
        // state.now = state.now.add({ seconds: 50 }); // make the clock run 30 times faster

        // for performance reasons, we don't want to always be using the ZonedDateTime.minute method
        // this way, we can call it once and use it anywhere we would now.minute, now.second, etc.
        state.pNow = {
            hour: state.now.hour,
            minute: state.now.minute,
            second: state.now.second,
            millisecond: state.now.millisecond,
        };
    };

    const draw = () => {
        refreshTime();
        d.updateHands(state);
        if (state.stops) {
            d.updateStops(state);
            d.updateDots(state);
            d.updateTrain(state);
        }
    };

    const manageJourney = async () => {
        try {
            refreshTime();
            state.stops = await updateStops(state.stops);
            console.log();
            printStops(state.stops);
        }
        catch (e) {
            console.log('failed building', e);
            state.problems.push(e);
        }
    };

    draw();
    manageJourney()
        .then(() => d.cycleInfo(state));

    setInterval(() => {
        manageJourney();
    }, 1000 * 60 * 0.5);

    setInterval(draw, 300);
    setInterval(() => d.cycleInfo(state), 30 * 1000);
    setInterval(() => {
        console.clear();
        console.log('state.problems', state.problems);
    }, 1000 * 60 * 15);
};

main();
