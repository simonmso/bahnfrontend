import { Temporal } from "@js-temporal/polyfill";

// import dummy from "./dummy";

const pad = (n) => n.toString().padStart(2, "0");

export const printStop = (s) => {
  const a = s.arrivalTime;
  const pa = s.plannedArrivalTime;
  const d = s.departureTime;
  const pd = s.plannedDepartureTime;
  const aas = a ? `${pad(a.hour)}:${pad(a.minute)}` : "--:--";
  const pas = pa ? `${pad(pa.hour)}:${pad(pa.minute)}` : "--:--";
  const ads = d ? `${pad(d.hour)}:${pad(d.minute)}` : "--:--";
  const pds = pd ? `${pad(pd.hour)}:${pad(pd.minute)}` : "--:--";

  const as = `${pas}->${aas}`;
  const ds = `${pds}->${ads}`;
  console.log(s.category, s.line || s.number, as, ds, s.name);
};

export const printStops = (ss) => {
  ss.forEach((s) => printStop(s));
};

export const earlierOf = (t1, t2) => {
  if (!(t1 && t2)) return t1 || t2;
  return Temporal.ZonedDateTime.compare(t1, t2) >= 0 ? t2 : t1;
};

export const laterOf = (t1, t2) => {
  if (!(t1 && t2)) return t1 || t2;
  return Temporal.ZonedDateTime.compare(t1, t2) >= 0 ? t1 : t2;
};

export const lessThanXApart = (t1, t2, duration) => (
  Temporal.Duration.compare(duration, t1.since(t2).abs()) === 1
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
    ? laterOf(stop.departureTime, stop.arrivalTime)
    : earlierOf(stop.departureTime, stop.arrivalTime);
  return lessThanXApart(t, now, duration) && stopInFuture(stop, now, partiallyCounts);
};
