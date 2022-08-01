import { Temporal } from "@js-temporal/polyfill";

const DBClientID = "319c7843f0ffd25e9df9d59bf14afe14";
const DBApiKey = "bc235c81a107a57934a015cca40d68a5";

const request = (endpoint) => {
  console.log("requesting:", endpoint);
  const url = `https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1${endpoint}`;
  return fetch(url, {
    headers: {
      "DB-Client-ID": DBClientID,
      "DB-Api-Key": DBApiKey,
      accept: "application/xml",
    },
  })
    .then((resp) => resp.text())
    .then((text) => {
      const parser = new DOMParser();
      return parser.parseFromString(text, "text/xml");
    });
};

const getDateFromString = (dateStr) => {
  if (!dateStr) { return undefined; }
  const [Y, M, d, H, m] = dateStr.match(/(\d\d)/g);
  return Temporal.ZonedDateTime.from(`20${Y}-${M}-${d}T${H}:${m}[Europe/Berlin]`);
};

const nodeToStop = (node) => {
  const newStop = { id: node.id };
  newStop.tripId = node.id[0] === "-"
    ? `-${node.id.split("-")[1]}`
    : node.id.split("-")[0];

  const val = (n, k) => n.getNamedItem(k)?.value;

  node.childNodes.forEach((child) => {
    const c = child.attributes;

    if (child.nodeName === "tl") {
      newStop.category = val(c, "c") || newStop.category;
      newStop.number = val(c, "n") || newStop.number;
    } else if (child.nodeName === "dp") {
      newStop.plannedDepartureTime = getDateFromString(val(c, "pt")) || newStop.plannedDepartureTime;
      newStop.departureTime = getDateFromString(val(c, "ct")) || newStop.departureTime;
      newStop.futureStops = val(c, "ppth")?.split("|") || newStop.futureStops;
      newStop.futureStops = val(c, "cpth")?.split("|") || newStop.futureStops;
      newStop.line = val(c, "l") || newStop.line;
      newStop.cancelled = val(c, "cs") || newStop.cancelled;
    } else if (child.nodeName === "ar") {
      newStop.plannedArrivalTime = getDateFromString(val(c, "pt")) || newStop.plannedArrivalTime;
      newStop.arrivalTime = getDateFromString(val(c, "ct")) || newStop.arrivalTime;
      newStop.previousStops = val(c, "ppth")?.split("|") || newStop.previousStops;
      newStop.previousStops = val(c, "cpth")?.split("|") || newStop.previousStops;
      newStop.line = val(c, "l") || newStop.line;
      newStop.cancelled = val(c, "cs") || newStop.cancelled;
    }
  });
  return newStop;
};

const formatStopsFromTimetable = (childNodes) => {
  const stops = childNodes instanceof NodeList
    ? Array.from(childNodes)
    : childNodes;
  return stops.map((n) => nodeToStop(n));
};

export const getPlanForTime = (evaNo, dateArg) => {
  const time = dateArg || Temporal.Now.zonedDateTimeISO("Europe/Berlin");
  const yy = time.year.toString().toString().slice(-2);
  const mm = time.month.toString().padStart(2, "0");
  const dd = time.day.toString().padStart(2, "0");

  const date = `${yy}${mm}${dd}`;
  const hour = time.hour.toString().padStart(2, "0");

  return request(`/plan/${evaNo}/${date}/${hour}`)
    .then((resp) => formatStopsFromTimetable(resp.firstChild.childNodes));
};

// only include nodes with arrival/departure information
const filterNodesByArDp = (nodes) => (
  Array.from(nodes).filter((n) => (
    Array.from(n.childNodes).some((c) => (
      ["ar", "dp"].includes(c.nodeName)
    ))
  ))
);

export const getChanges = (evaNo) => (
  request(`/fchg/${evaNo}`)
    .then((resp) => filterNodesByArDp(resp.firstChild.childNodes))
    .then((filtered) => formatStopsFromTimetable(filtered))
);
