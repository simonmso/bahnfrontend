import { Temporal } from "@js-temporal/polyfill";
import { earlierOf, stopInFuture } from "../helpers";

const renderFrames = (frames, pos, cfg, callback) => {
  const { ctxs, width, height } = cfg;
  const ctx = ctxs.info;
  ctx.fillStyle = "white";
  const promises = frames.map((t, i) => new Promise((resolve) => {
    setTimeout(() => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillText(t, pos.x - (ctx.measureText(t).width / 2), pos.y);
      callback?.();
      resolve();
    }, 65 * i);
  }));
  return Promise.all(promises);
};

const type = (text, animation, cfg, callback) => {
  if (!text) return new Promise((r) => { r(); });
  const {
    center, radius, ctxs, scaleFactor,
  } = cfg;
  const ctx = ctxs.info;
  ctx.font = `${22 * scaleFactor}px "Courier New", sans-serif`;
  ctx.fillStyle = "white";

  const box = ctx.measureText(text);
  const pad = 0.85;
  const offset = Math.min(box.width / 2, radius * pad);
  const height = Math.sqrt(((pad * radius) ** 2) - (offset ** 2));
  const pos = {
    x: center.x,
    y: center.y + height,
  };

  if (animation) {
    // get every text to render. ex: ['n', 'na', 'nac', 'nach', ...]
    const steps = [text];
    for (let i = 1; i <= text.length; i++) {
      const portion = text.slice(0, -1 * i);
      if (animation === "growing") steps.splice(0, 0, portion);
      else steps.push(portion);
    }

    return renderFrames(steps, pos, cfg, callback);
  }
  return new Promise((resolve) => {
    ctx.fillText(text, pos.x - offset, pos.y); resolve();
  });
};

const getNextStop = ({ stops, now }) => {
  const inFuture = stops?.filter?.((s) => stopInFuture(s, now));
  return inFuture?.length
    ? inFuture.reduce((a, b) => {
      const aT = earlierOf(a.arrivalTime, a.departureTime);
      const bT = earlierOf(b.arrivalTime, b.departureTime);
      return Temporal.ZonedDateTime.compare(aT, bT) <= 0 ? a : b;
    })
    : undefined;
};

const getTrainInfo = (cfg) => {
  const next = getNextStop(cfg);
  const destination = next.futureStops?.length
    ? next.futureStops[next.futureStops.length - 1]
    : next.name;
  const cat = next.category || "";
  const line = next.line || next.number || "";
  return destination && { type: "train", text: `${cat} ${line} nach ${destination}` };
};

const getNextStopInfo = (cfg) => {
  const next = getNextStop(cfg);
  return next && { type: "nextStop", text: `Nächste Halt: ${next.name}` };
};

const getNextInfo = (cfg) => (
  cfg.info?.type === "train" ? getNextStopInfo(cfg) : getTrainInfo(cfg)
);

const transitionInfo = (oldInfo, newInfo, cfg, clbck) => (
  type(oldInfo, "shrinking", cfg, clbck)
    .then(() => type(newInfo, "growing", cfg, clbck))
);

const drawInfo = (cfg) => type(cfg?.info?.text, false, cfg);

export default {
  getNextInfo,
  transitionInfo,
  drawInfo,
};
