import drawHands from "./hands";

const renderFrames = (frames, pos, cfg, callback) => {
  const { ctx, width, height } = cfg;
  const promises = frames.map((t, i) => new Promise((resolve) => {
    setTimeout(() => {
      ctx.fillStyle = "white";
      ctx.clearRect(0, 0, width, height);
      ctx.fillText(t, pos.x - (ctx.measureText(t).width / 2), pos.y);
      drawHands(cfg);
      callback?.();
      resolve();
    }, 65 * i);
  }));
  return Promise.all(promises);
};

const type = (text, animation, cfg, callback) => {
  if (!text) return new Promise((r) => { r(); });
  const {
    center, radius, ctx, scaleFactor,
  } = cfg;
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
  const inFuture = stops?.filter?.((s) => {
    const t = s.departureTime || s.arrivalTime;
    return t.epochSeconds - now.epochSeconds > 0;
  });
  return inFuture?.length
    ? inFuture.reduce((a, b) => {
      const aT = a.arrivalTime || a.departureTime;
      const bT = b.arrivalTime || b.departureTime;
      const aDiff = aT.epochSeconds - now.epochSeconds;
      const bDiff = bT.epochSeconds - now.epochSeconds;
      return (aDiff < bDiff && aDiff > 0) ? a : b;
    })
    : undefined;
};

export const getTrainInfo = (cfg) => {
  const next = getNextStop(cfg);
  const destination = next.futureStops[next.futureStops.length - 1];
  const cat = next.category || "";
  const line = next.line || next.number || "";
  return destination && { type: "train", text: `${cat} ${line} nach ${destination}` };
};

export const getNextInfo = (cfg) => {
  const next = getNextStop(cfg);
  return next && { type: "next", text: `Nächste Halt: ${next.name}` };
};

export const transitionInfo = (oldInfo, newInfo, cfg, clbck) => (
  type(oldInfo, "shrinking", cfg, clbck)
    .then(() => type(newInfo, "growing", cfg, clbck))
);

export const drawInfo = (config) => {
  const { info } = config;

  return type(info?.text, false, config);
};
