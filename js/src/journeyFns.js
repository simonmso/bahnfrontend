import { Temporal } from '@js-temporal/polyfill';
import { lessThanXApart } from './helpers';

const confirmActualTime = (stop) => {
    const s = { ...stop };
    s.departureTime = s.departureTime || s.plannedDepartureTime;
    s.arrivalTime = s.arrivalTime || s.plannedArrivalTime;
    s.show = s.real;
    return s;
};

// repeated get calls to ZonedDateTime.second etc. add up quickly
// therefore, we just do it once here
const setPerformativeTimes = (stop) => {
    const s = { ...stop };
    s.p = {
        arrivalTime: s.arrivalTime
            ? {
                hour: s.arrivalTime.hour,
                minute: s.arrivalTime.minute,
                second: s.arrivalTime.second,
            } : undefined,
        departureTime: s.departureTime
            ? {
                hour: s.departureTime.hour,
                minute: s.departureTime.minute,
                second: s.departureTime.second,
            } : undefined,
    };
    return s;
};

const applyChangesToStop = (s, changes) => {
    const newStop = { ...s };
    const change = changes.find((c) => c.id === s.id);
    if (change) {
        Object.keys(s).forEach((k) => {
            newStop[k] = change[k] || s[k];
        });
    }
    return newStop;
};

const stopIsRelevant = (s) => {
    if (s.cancelled || !s.departureTime) return false;
    const now = Temporal.Now.zonedDateTimeISO();
    if (s.departureTime && !lessThanXApart(s.departureTime, now, { minutes: 30 })) {
        return false;
    }

    const cats = ['RE', 'IC', 'ICE', 'EC'];
    // for 3rd party trains, the category is in the line,
    // ex: { category: 'ME', line: 'RE3' }
    return cats.includes(s.category) || cats.includes(s.line?.replace(/\d+/g, ''));
};

export default {
    confirmActualTime,
    applyChangesToStop,
    stopIsRelevant,
    setPerformativeTimes,
};
