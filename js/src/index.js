// import { Temporal } from '@js-temporal/polyfill';
import { getJourney, completeNextHour, rehydrateStops } from './journey';
// import cvs from './canvas';
import { journeyNotOver, printStops } from './helpers';
import cfg from './config.json';
import initializeState from './init';
import d from './domHandler';

const main = async () => {
    const state = initializeState();

    // downtime code for when this was running on the pi
    // state.downtime = {
    //   start: { hour: 21, minute: 25, second: 0 },
    //   duration: Temporal.Duration.from({ hours: 9 }),
    // };

    // const inDowntime = () => {
    //   const { downtime, now } = state;
    //   const { start, duration } = downtime;
    //   const todayStart = now.with(start);
    //   const yesterdayStart = now.with(start).subtract({ days: 1 });
    //   return [todayStart, yesterdayStart].some((t) => (
    //     (Temporal.Duration.compare(duration, now.since(t)) === 1)
    //     && (Temporal.Duration.compare(now.since(t), { seconds: 0 }) === 1)
    //   ));
    // };

    const refreshTime = () => {
        // state.now = Temporal.Now.zonedDateTimeISO();
        state.now = state.now.add({ seconds: 30 }); // make the clock run 30 times faster
        d.updateHands(state);
        d.updateStops(state);
        d.updateDots(state);
    // state.now = Temporal.Now.zonedDateTimeISO().add({ minutes: 53 });
    // state.now = Temporal.Now.zonedDateTimeISO().with({ minute: 10 });
    };

    // const cycleInfo = () => {
    //   refreshTime();
    //   const oldInfo = state.info;
    //   state.info = cvs.info.getNextInfo(state);

    //   cvs.info.transitionInfo(oldInfo?.text, state.info?.text, state, refreshTime)
    //     .catch((e) => console.log("failed transitioning", e))
    //     .finally(() => { state.animating = false; });
    // };

    const manageJourney = async () => {
        try {
            refreshTime();
            const notOver = journeyNotOver(state);
            const action = notOver ? completeNextHour(state.stops) : getJourney();

            console.log('old stops', state.stops);

            state.stops = await action.then(({ stops, problems }) => {
                if (problems?.length) state.problems = state.problems.concat(problems);
                return rehydrateStops(stops);
            });
            // if (!notOver) cycleInfo();

            printStops(state.stops);
        }
        catch (e) {
            console.log('failed building', e);
            state.problems.push(e);
        }
    };

    if (!cfg.useDummy) manageJourney();
    // cycleInfo();
    refreshTime();

    // if (!cfg.useDummy) setInterval(() => {
    //   if (!inDowntime()) manageJourney(); }, 1000 * 60 * 1.5)
    // };
    setInterval(refreshTime, 400);
    // setInterval(cycleInfo, 30 * 1000);
    setInterval(() => {
        console.clear();
        console.log('state.problems', state.problems);
    }, 1000 * 60 * 15);
};

main();
