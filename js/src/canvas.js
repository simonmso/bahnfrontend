import { Temporal } from "@js-temporal/polyfill";

const getAnglesForTime = (date, flooring = false) => {
  const h = flooring ? date.hour : date.hour + (date.second / 3600);
  const m = flooring ? date.minute : date.minute + (date.second / 60);
  return {
    hour: -(2 * Math.PI * (h / 12)) + (Math.PI / 2),
    minute: -(2 * Math.PI * (m / 60)) + (Math.PI / 2),
  };
};

const getPosition = (r, theta, center) => ({
  x: center.x + (r * Math.cos(theta)),
  y: center.y - (r * Math.sin(theta)),
});

const drawDot = (pos, r, ctx) => {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, 7);
  ctx.fill();
};

const drawMinuteTicks = (startingTime, config, endingTime = false) => {
  const { ctx, center, radius } = config;
  const endTime = endingTime || startingTime.add({ hours: 1 });
  let curTime = startingTime;
  while (curTime.epochSeconds < endTime.epochSeconds) {
    const theta = getAnglesForTime(curTime, true).minute;
    const pos = getPosition(radius, theta, center);
    drawDot(pos, 3, ctx);
    curTime = curTime.add({ minutes: 1 });
  }
};

const inNext = (s, min) => {
  const t = s.arrivalTime || s.departureTime;
  const diff = t.epochSeconds - Temporal.Now.instant().epochSeconds;
  return diff >= 0 && diff <= 60 * min;
};

const drawStop = (s, cfg) => {
  const theta = getAnglesForTime(s.arrivalTime || s.departureTime, true).minute;
  const pos = getPosition(cfg.radius, theta, cfg.center);
  const { ctx } = cfg;
  drawDot(pos, 10, ctx);
};

const drawHands = (cfg) => {
  const { ctx, center, radius } = cfg;
  const { minute, hour } = getAnglesForTime(Temporal.Now.zonedDateTimeISO());
  const minEnd = getPosition(radius * 0.9, minute, center);
  const hourEnd = getPosition(radius / 2, hour, center);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.moveTo(minEnd.x, minEnd.y);
  ctx.lineTo(center.x, center.y);
  ctx.stroke();
  ctx.lineTo(hourEnd.x, hourEnd.y);
  ctx.stroke();
};

export const prepCanvasConfig = () => {
  const canvas = document.getElementById("main");

  const width = window.innerWidth - 17; // minus value to avoid scrollbar
  const height = window.innerHeight - 4;
  const center = { x: width / 2, y: height / 2 };
  const radius = height / 2.5;

  canvas.height = height;
  canvas.width = width;

  const ctx = canvas.getContext("2d");
  return {
    ctx,
    center,
    radius,
    width,
    height,
  };
};

export const draw = (config) => {
  const { stops, ctx } = config;
  ctx.clearRect(0, 0, config.width, config.height);

  const nextFewStops = stops.filter((s) => inNext(s, 45));

  const start = Temporal.Now.zonedDateTimeISO();
  const end = nextFewStops[nextFewStops.length - 1].arrivalTime;
  drawMinuteTicks(start, config, end);
  nextFewStops.forEach((s) => drawStop(s, config));
  drawHands(config);
};
