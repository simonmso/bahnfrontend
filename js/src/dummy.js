import { Temporal } from '@js-temporal/polyfill';

const now = Temporal.Now.zonedDateTimeISO('Europe/Berlin');
const withs = [
    [undefined, 5], [18, 20], [38, 41], [44, 45], [55, 57], [10, 12], [22, 24], [33, undefined],
];
const add = [0, 0, 0, 0, 0, 1, 1, 1];
const names = [
    'Dresden-Neustadt', 'Ruhland', 'Ortrand', 'Lampertswalde',
    'Großenhain Cottb Bf', 'Priestewitz', 'Weinböhla Hp', 'Coswig(b Dresden)',
];

const stops = names.map((n, i) => ({
    id: `${i}`,
    name: n,
    show: true,
    real: true,
    category: 'RE',
    line: '85',
    futureStops: names.slice(i + 1),
    arrivalTime: withs[i][0] ? now.add({ hours: add[i] }).with({ minute: withs[i][0] }) : undefined,
    departureTime: withs[i][1]
        ? now.add({ hours: add[i] }).with({ minute: withs[i][1] })
        : undefined,
    elements: {},
}));

export default stops;
