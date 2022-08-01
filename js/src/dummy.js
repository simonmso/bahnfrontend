import { Temporal } from "@js-temporal/polyfill";

export default [
  {
    departureTime: Temporal.ZonedDateTime.from("2022-08-01T22:38:00+02:00[Europe/Berlin]"),
  },
  {
    arrivalTime: Temporal.ZonedDateTime.from("2022-08-01T22:40:00+02:00[Europe/Berlin]"),
    departureTime: Temporal.ZonedDateTime.from("2022-08-01T22:41:00+02:00[Europe/Berlin]"),
  },
  {
    arrivalTime: Temporal.ZonedDateTime.from("2022-08-01T22:44:00+02:00[Europe/Berlin]"),
    departureTime: Temporal.ZonedDateTime.from("2022-08-01T22:45:00+02:00[Europe/Berlin]"),
  },
  {
    arrivalTime: Temporal.ZonedDateTime.from("2022-08-01T22:51:00+02:00[Europe/Berlin]"),
  },
];
