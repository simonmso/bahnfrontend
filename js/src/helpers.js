import { Temporal } from '@js-temporal/polyfill';
import cfg from './config.json';

// TODO: find out which of these are being used

const pad = (n) => n.toString().padStart(2, '0');

export const toS = (s) => {
    const a = s.arrivalTime;
    const pa = s.plannedArrivalTime;
    const d = s.departureTime;
    const pd = s.plannedDepartureTime;
    const aas = a ? `${pad(a.hour)}:${pad(a.minute)}` : '--:--';
    const pas = pa ? `${pad(pa.hour)}:${pad(pa.minute)}` : '--:--';
    const ads = d ? `${pad(d.hour)}:${pad(d.minute)}` : '--:--';
    const pds = pd ? `${pad(pd.hour)}:${pad(pd.minute)}` : '--:--';

    const as = `${pas}->${aas}`;
    const ds = `${pds}->${ads}`;
    return `${s.category} ${s.line || s.number} ${as} ${ds} ${s.name}`;
};

export const printStops = (ss) => {
    ss.forEach((s) => console.log(toS(s)));
};

export const earlierOf = (t1, t2) => {
    if (!(t1 && t2)) return t1 || t2;
    return Temporal.ZonedDateTime.compare(t1, t2) >= 0 ? t2 : t1;
};

export const laterOf = (t1, t2) => {
    if (!(t1 && t2)) return t1 || t2;
    return Temporal.ZonedDateTime.compare(t1, t2) >= 0 ? t1 : t2;
};

export const shorterOf = (d1, d2) => (
    Temporal.Duration.compare(d1, d2) <= 0 ? d1 : d2
);

export const lessThanXApart = (t1, t2, duration) => (
    Temporal.Duration.compare(
        duration,
        // for performance reasons, not using t1.since(t2).abs()
        { seconds: Math.abs(t1.epochSeconds - t2.epochSeconds) },
    ) === 1
);

export const timeInNext = (time, duration, now) => (
    Temporal.ZonedDateTime.compare(time, now) >= 0
    && Temporal.ZonedDateTime.compare(time, now.add(duration)) <= 0
);

export const stopInFuture = (stop, now, partiallyCounts = false) => {
    const t = partiallyCounts
        ? laterOf(stop.departureTime, stop.arrivalTime)
        : earlierOf(stop.departureTime, stop.arrivalTime);
    return Temporal.ZonedDateTime.compare(t, now) >= 0;
};

export const stopInPast = (stop, now) => {
    const t = laterOf(stop.departureTime, stop.arrivalTime);
    return Temporal.ZonedDateTime.compare(t, now) <= 0;
};

export const stopInNext = (stop, now, duration, partiallyCounts = false) => {
    const t = partiallyCounts
        ? earlierOf(stop.departureTime, stop.arrivalTime)
        : laterOf(stop.departureTime, stop.arrivalTime);
    return lessThanXApart(t, now, duration) && stopInFuture(stop, now, partiallyCounts);
};

export const getRandomKey = (obj) => {
    const keys = Object.keys(obj);
    const randIdx = Math.floor(Math.random() * keys.length);
    return keys[randIdx];
};

// TODO: this should just be part of state
export const journeyNotOver = (state) => (
    state.stops?.some?.((s) => stopInFuture(s, state.now, true))
);

export const angleForMinute = (m) => ((m / 60) - 0.25) * 2 * Math.PI;

export const angleForHour = (h) => ((h / 12) - 0.25) * 2 * Math.PI;

// xIntercept is the distance (in minutes) the first black dot should be
const getLightnessFunc = (steepness, xIntercept) => {
    const yInt = xIntercept * steepness;
    return (minute) => Math.max(9, Math.min(100, ((minute * -steepness) + yInt)));
};

// mimics a conic gradient
export const hslForMinute = (minute, now) => {
    const n = now.minute + (now.second / 60) + (now.millisecond / (60 * 1000));
    const m = minute + 0.1;
    const u = m < n ? 60 : 0;
    const minInFuture = m - n + u;

    const lightForMin = getLightnessFunc(
        cfg.dots.gradientSteepness,
        cfg.dots.gradientIntercept,
    );

    return `hsl(0 0% ${lightForMin(minInFuture)}%)`;
};
