// eslint-disable-next-line no-unused-vars
import { Temporal } from '@js-temporal/polyfill';
import initializeState from './init';
import d from './dom';
import { updateStops } from './consumer';
import config from './config.json';

const main = async () => {
    const state = initializeState();

    const refreshTime = () => {
        state.now = Temporal.Now.zonedDateTimeISO();

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
            d.cycleInfo(state);
        }
        catch (e) {
            console.log('failed building', e);
            state.problems.push(e);
        }
    };

    draw();
    manageJourney();

    setInterval(draw, config.tickPeriod_ms);
    setInterval(manageJourney, config.journeyUpdatePeriod_s * 1000);
    setInterval(() => {
        console.clear();
        console.log('state.problems', state.problems);
    }, 1000 * 60 * 15);
};

main();
