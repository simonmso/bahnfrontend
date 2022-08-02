import { Temporal } from "@js-temporal/polyfill";

const now = Temporal.Now.zonedDateTimeISO("Europe/Berlin");

export default [
  {
    departureTime: now.with({ minute: 5 }),
  },
  {
    arrivalTime: now.with({ minute: 18 }),
    departureTime: now.with({ minute: 20 }),
  },
  {
    arrivalTime: now.with({ minute: 38 }),
    departureTime: now.with({ minute: 41 }),
  },
  {
    arrivalTime: now.with({ minute: 44 }),
    departureTime: now.with({ minute: 45 }),
  },
  {
    arrivalTime: now.with({ minute: 55 }),
    departureTime: now.with({ minute: 57 }),
  },
  {
    arrivalTime: now.add({ hours: 1 }).with({ minute: 10 }),
    departureTime: now.add({ hours: 1 }).with({ minute: 12 }),
  },
  {
    arrivalTime: now.add({ hours: 1 }).with({ minute: 22 }),
    departureTime: now.add({ hours: 1 }).with({ minute: 24 }),
  },
  {
    arrivalTime: now.add({ hours: 1 }).with({ minute: 33 }),
  },
];
