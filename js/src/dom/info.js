import { Temporal } from '@js-temporal/polyfill';
import { earlierOf, journeyNotOver, stopInFuture } from '../helpers';

// sleep() taken from https://github.com/neatnik/typo/blob/main/typo.js
// I really appreciate that guy's work
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getNextStop = ({ stops, now }) => {
    const inFuture = stops?.filter?.((s) => stopInFuture(s, now, true));
    return inFuture?.length
        ? inFuture.reduce((a, b) => {
            const aT = earlierOf(a.arrivalTime, a.departureTime);
            const bT = earlierOf(b.arrivalTime, b.departureTime);
            return Temporal.ZonedDateTime.compare(aT, bT) <= 0 ? a : b;
        })
        : undefined;
};

const getTrainInfo = (state) => {
    const last = state.stops.at(-1);
    const destination = last.futureStops?.at?.(-1) || last.name;
    return destination ? { type: 'train', text: `${last.routeId} towards ${destination}` } : false;
};

const getNextStopInfo = (state) => {
    const next = getNextStop(state);
    const stopInProgress = next.arrivalTime
        && Temporal.ZonedDateTime.compare(next.arrivalTime, state.now) <= 0;
    const text = stopInProgress ? `Current Stop: ${next.name}` : `Next Stop: ${next.name}`;
    return next && { type: 'nextStop', text };
};

export const getNextInfo = (state) => {
    let next = {};
    if (journeyNotOver(state)) {
        next = state.info?.type === 'train' ? getNextStopInfo(state) : getTrainInfo(state);
    }
    if (state.problems.length) next.text = `${next.text || ''} !`;
    return next;
};

const shrink = async (elem) => {
    let buffer = elem.innerText;
    while (buffer.length > 0) {
        buffer = buffer.slice(0, -2);
        elem.innerText = buffer;
        // eslint-disable-next-line no-await-in-loop
        await sleep(60);
    }
};

const grow = async (elem, text = '') => {
    for (let i = 0; i <= text.length; i++) {
        elem.innerText = text.slice(0, i);
        // eslint-disable-next-line no-await-in-loop
        await sleep(60);
    }
};

export const cycleInfo = async (state) => {
    if (!state.animating) {
        state.animating = true;
        await shrink(state.elements.info);

        state.info = getNextInfo(state);
        if (state.info?.text) {
            await grow(state.elements.info, state.info.text);
        }
        state.animating = false;
    }
};
