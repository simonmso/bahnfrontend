import { Temporal } from '@js-temporal/polyfill';
import { toS } from './helpers';

const getDateFromString = (dateStr) => {
    if (!dateStr) return undefined;
    const [Y, M, d, H, m] = dateStr.match(/(\d\d)/g);
    return Temporal.ZonedDateTime.from(`20${Y}-${M}-${d}T${H}:${m}[Europe/Berlin]`);
};

// this is so gross
const nodeToStop = (node) => {
    const newStop = { id: node.id };
    newStop.tripId = node.id[0] === '-'
        ? `-${node.id.split('-')[1]}`
        : node.id.split('-')[0];

    const val = (n, k) => n.getNamedItem(k)?.value;

    node.childNodes.forEach((child) => {
        const c = child.attributes;

        if (child.nodeName === 'tl') {
            newStop.category = val(c, 'c') || newStop.category;
            newStop.number = val(c, 'n') || newStop.number;
        }
        else if (child.nodeName === 'dp') {
            newStop.plannedDepartureTime = getDateFromString(val(c, 'pt')) || newStop.plannedDepartureTime;
            newStop.departureTime = getDateFromString(val(c, 'ct')) || newStop.departureTime;
            newStop.futureStops = val(c, 'ppth')?.split('|') || newStop.futureStops;
            newStop.futureStops = val(c, 'cpth')?.split('|') || newStop.futureStops;
            newStop.line = val(c, 'l') || newStop.line;
            newStop.cancelled = val(c, 'cs') || newStop.cancelled;
        }
        else if (child.nodeName === 'ar') {
            newStop.plannedArrivalTime = getDateFromString(val(c, 'pt')) || newStop.plannedArrivalTime;
            newStop.arrivalTime = getDateFromString(val(c, 'ct')) || newStop.arrivalTime;
            newStop.previousStops = val(c, 'ppth')?.split('|') || newStop.previousStops;
            newStop.previousStops = val(c, 'cpth')?.split('|') || newStop.previousStops;
            newStop.line = val(c, 'l') || newStop.line;
            newStop.cancelled = val(c, 'cs') || newStop.cancelled;
        }
    });

    newStop.real = true;
    newStop.elements = {
        curve: [],
    };
    newStop.asString = toS(newStop);
    return newStop;
};

export const formatStopsFromTimetable = (childNodes) => {
    const stops = childNodes instanceof NodeList
        ? Array.from(childNodes)
        : childNodes;
    return stops.map((n) => nodeToStop(n));
};

export const getStringFromDate = (date) => {
    const dt = date.withTimeZone('Europe/Berlin');
    const yy = dt.year.toString().slice(-2);
    const mm = dt.month.toString().padStart(2, '0');
    const dd = dt.day.toString().padStart(2, '0');

    return `${yy}${mm}${dd}`;
};

// only include nodes with arrival/departure information
export const filterNodesByArDp = (nodes) => (
    Array.from(nodes).filter((n) => (
        Array.from(n.childNodes).some((c) => (
            ['ar', 'dp'].includes(c.nodeName)
        ))
    ))
);
