import { Temporal } from "@js-temporal/polyfill";
import {
  filterNodesByArDp, formatStopsFromTimetable, getStringFromDate,
} from "./consumerFns";

const DBClientID = "319c7843f0ffd25e9df9d59bf14afe14";
const DBApiKey = "bc235c81a107a57934a015cca40d68a5";
let totalRequests = 0;
const resetRequests = () => { console.log("req reset"); totalRequests = 0; };

const request = (endpoint) => {
  if (totalRequests === 0) setTimeout(resetRequests, 1000 * 65);
  totalRequests++;
  console.log("requesting:", totalRequests, endpoint);
  if (totalRequests > 45) {
    throw new Error("Reached request limit (in place because the API has a 60 request limit)");
  }
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

const getPlanForTime = (evaNo, dateArg) => {
  let time = dateArg || Temporal.Now.zonedDateTimeISO();
  time = time.withTimeZone("Europe/Berlin");
  const date = getStringFromDate(time);
  const hour = time.hour.toString().padStart(2, "0");

  return request(`/plan/${evaNo}/${date}/${hour}`)
    .then((resp) => formatStopsFromTimetable(resp.firstChild.childNodes));
};

const getChanges = (evaNo, changeType = "fchg") => (
  request(`/${changeType}/${evaNo}`)
    .then((resp) => filterNodesByArDp(resp.firstChild.childNodes))
    .then((filtered) => formatStopsFromTimetable(filtered))
);

const getAllChanges = (evaNo) => getChanges(evaNo, "fchg");

const getRecentChanges = (evaNo) => getChanges(evaNo, "rchg");

export default {
  getPlanForTime,
  getAllChanges,
  getRecentChanges,
};
