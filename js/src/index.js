import { Temporal } from '@js-temporal/polyfill';
// import { getJourney, completeNextHour, rehydrateStops } from './journey';
import { journeyNotOver, printStops } from './helpers';
import cfg from './config.json';
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

    const cycleInfo = () => {
        if (!state.animating) {
            refreshTime();
            const oldInfo = state.info;
            state.info = d.getNextInfo(state);

            state.animating = true;
            d.transitionInfo(oldInfo?.text, state.info?.text, state).finally(() => {
                state.animating = false;
            });
        }
    };

    const manageJourney = async () => {
        try {
            refreshTime();
            state.stops = await updateStops(state.stops);
            const notOver = journeyNotOver(state);

            // const action = notOver ? completeNextHour(state.stops) : getJourney();

            // console.log('old stops', state.stops);

            // state.stops = await action.then(({ stops, problems }) => {
            //     if (problems?.length) state.problems = state.problems.concat(problems);
            //     return rehydrateStops(stops);
            // });
            if (!notOver) cycleInfo();

            printStops(state.stops);
        }
        catch (e) {
            console.log('failed building', e);
            state.problems.push(e);
        }
    };

    draw();
    if (!cfg.useDummy) {
        manageJourney().then(cycleInfo);
    }

    if (!cfg.useDummy) {
        setInterval(() => {
            manageJourney();
        }, 1000 * 60 * 1.5);
    }

    setInterval(draw, 300);
    setInterval(cycleInfo, 30 * 1000);
    setInterval(() => {
        console.clear();
        console.log('state.problems', state.problems);
    }, 1000 * 60 * 15);
};

main();
