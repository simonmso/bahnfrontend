import { Temporal } from '@js-temporal/polyfill';
import { earlierOf, journeyNotOver, stopInFuture } from '../helpers';

const getNextStop = ({ stops, now }) => {
    const inFuture = stops?.filter?.((s) => stopInFuture(s, now));
    return inFuture?.length
        ? inFuture.reduce((a, b) => {
            const aT = earlierOf(a.arrivalTime, a.departureTime);
            const bT = earlierOf(b.arrivalTime, b.departureTime);
            return Temporal.ZonedDateTime.compare(aT, bT) <= 0 ? a : b;
        })
        : undefined;
};

const getTrainInfo = (state) => {
    const next = getNextStop(state);
    const destination = next.futureStops?.length
        ? next.futureStops[next.futureStops.length - 1]
        : next.name;
    const cat = next.category || '';
    const line = next.line || next.number || '';
    return destination && { type: 'train', text: `${cat} ${line} nach ${destination}` };
};

const getNextStopInfo = (state) => {
    const next = getNextStop(state);
    return next && { type: 'nextStop', text: `Nächste Halt: ${next.name}` };
};

export const getNextInfo = (state) => {
    let next = {};
    if (journeyNotOver(state)) {
        next = state.info?.type === 'train'
            ? getNextStopInfo(state)
            : getTrainInfo(state);
    }
    if (state.problems.length) next.text = `${next.text || ''} !`;
    return next;
};

const rShrink = (current, target, state, rslv) => {
    state.elements.info.innerText = current;
    if (current === target) rslv();
    else setTimeout(() => rShrink(current.slice(0, -2), target, state, rslv), 65);
};
const rGrow = (current, target, state, rslv) => {
    state.elements.info.innerText = current;
    if (current === target) rslv();
    else setTimeout(() => rGrow(current + target[current.length], target, state, rslv), 65);
};

const shrink = (text, state) => new Promise((r) => {
    rShrink(text, '', state, r);
});
const grow = (text, state) => new Promise((r) => {
    rGrow('', text, state, r);
});

export const transitionInfo = (oldInfo, newInfo, state) => {
    if (oldInfo && newInfo) {
        return shrink(oldInfo, state)
            .then(() => grow(newInfo, state));
    }
    if (oldInfo) return shrink(oldInfo, state);
    if (newInfo) return grow(newInfo, state);
    return new Promise((r) => { // this way .then still works
        r();
    });
};
