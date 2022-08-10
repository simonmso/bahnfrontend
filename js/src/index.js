import { Temporal } from "@js-temporal/polyfill";
import { getJourney, completeNextHour, rehydrateStops } from "./journey";
import cvs from "./canvas";
import { printStops, stopInFuture } from "./helpers";
import dummy from "./dummy";

const useDummy = false;

const main = async () => {
  const config = cvs.prepCanvasGetConfig();
  if (useDummy) config.stops = dummy;

  config.downtime = {
    start: { hour: 21, minute: 25, second: 0 },
    duration: Temporal.Duration.from({ hours: 9 }),
  };

  const inDowntime = () => {
    const { downtime, now } = config;
    const { start, duration } = downtime;
    const todayStart = now.with(start);
    const yesterdayStart = now.with(start).subtract({ days: 1 });
    return [todayStart, yesterdayStart].some((t) => (
      (Temporal.Duration.compare(duration, now.since(t)) === 1)
      && (Temporal.Duration.compare(now.since(t), { seconds: 0 }) === 1)
    ));
  };

  const refreshTime = () => {
    config.now = Temporal.Now.zonedDateTimeISO();
    // config.now = Temporal.Now.zonedDateTimeISO().add({ minutes: 53 });
    // config.now = Temporal.Now.zonedDateTimeISO().with({ minute: 10 });
  };

  const journeyNotOver = () => {
    const { stops } = config;
    const stopsToCome = stops?.some((s) => s.real && stopInFuture(s, config.now, true));
    const lastHasMore = stops?.length && stops[stops.length - 1].futureStops?.length;
    return stopsToCome || lastHasMore;
  };

  const cycleInfo = () => {
    refreshTime();
    const oldInfo = config.info;
    config.info = journeyNotOver()
      ? cvs.info.getNextInfo(config)
      : {};

    cvs.info.transitionInfo(oldInfo?.text, config.info?.text, config, refreshTime)
      .catch((e) => console.log("failed transitioning", e))
      .finally(() => { config.animating = false; });
  };

  const manageJourney = async () => {
    refreshTime();
    const notOver = journeyNotOver();
    const action = notOver ? completeNextHour(config.stops) : getJourney();

    try {
      config.stops = await action.then((stops) => rehydrateStops(stops));
      if (!notOver) cycleInfo();
      printStops(config.stops);
    } catch (e) { console.log("failed building", e); }
  };

  const draw = () => {
    refreshTime();
    cvs.clearClock(config);
    if (journeyNotOver()) cvs.drawJourney(config);
    cvs.drawHands(config);
  };

  if (!useDummy) manageJourney();
  cycleInfo();
  draw();

  if (!useDummy) setInterval(() => { if (!inDowntime()) manageJourney(); }, 1000 * 60 * 1.5);
  setInterval(draw, 400);
  setInterval(cycleInfo, 30 * 1000);
};

main();
