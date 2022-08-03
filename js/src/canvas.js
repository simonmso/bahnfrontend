import { Temporal } from "@js-temporal/polyfill";

const getAnglesForTime = (date, flooring = false) => {
  const h = flooring
    ? (date.hour % 12)
    : (date.hour % 12) + (date.minute / 60) + (date.second / 3600);
  const m = flooring ? date.minute : date.minute + (date.second / 60);
  return {
    hour: ((Math.PI * 5) / 2) - (2 * Math.PI * (h / 12)),
    minute: ((Math.PI * 5) / 2) - (2 * Math.PI * (m / 60)),
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

const drawTrainHead = (trainWidth, angle, forward, cfg, color = "white") => {
  const { ctx, center, radius } = cfg;
  const inner = getPosition(radius - trainWidth, angle, center);
  const outer = getPosition(radius + trainWidth, angle, center);
  const cpLen = trainWidth * 3;
  const ratio = (cpLen / (radius - trainWidth));
  const cpDiff = {
    x: -1 * (inner.y - center.y) * ratio,
    y: (inner.x - center.x) * ratio,
  };
  const [cp1, cp2] = [inner, outer].map((p) => ({
    x: forward ? p.x + cpDiff.x : p.x - cpDiff.x,
    y: forward ? p.y + cpDiff.y : p.y - cpDiff.y,
  }));

  // head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(inner.x, inner.y);
  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, outer.x, outer.y);
  ctx.fill();

  // close hairline
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(inner.x, inner.y);
  ctx.lineTo(outer.x, outer.y);
  ctx.stroke();
};

const drawTrainBody = (trainWidth, startAngle, endAngle, cfg, color = "white") => {
  const { ctx, center, radius } = cfg;
  ctx.strokeStyle = color;
  ctx.lineWidth = trainWidth * 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, -startAngle, -endAngle);
  ctx.stroke();
};

const drawCarSeperators = (trainWidth, startAngle, endAngle, cfg) => {
  const { ctx, center, radius } = cfg;

  // account for the added length of the head and tail
  const cars = 4;
  const headOffset = 2 * Math.PI * (0.5 / 60);
  const start = startAngle + headOffset;
  const end = endAngle - headOffset;

  const carAngle = (end - start) / cars;

  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  for (let i = 1; i < cars; i++) {
    const angle = start + (carAngle * i);
    const p1 = getPosition(radius - trainWidth, angle, center);
    const p2 = getPosition(radius + trainWidth, angle, center);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
};

const drawFrontWindow = (trainWidth, angle, forward, cfg) => {
  const { ctx, center, radius } = cfg;
  const angleOffsetForSec = (sec) => (
    forward
      ? -1 * (2 * Math.PI * (sec / 3600))
      : (2 * Math.PI * (sec / 3600))
  );
  const start = angle + angleOffsetForSec(26);
  const end = angle + angleOffsetForSec(5);
  const startW = (trainWidth / 2.2);
  const endW = (trainWidth / 1.6);

  const p1 = getPosition(radius + startW, start, center);
  const p2 = getPosition(radius - startW, start, center);
  const p3 = getPosition(radius - endW, end, center);
  const p4 = getPosition(radius + endW, end, center);

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.fill();
};

const drawTrain = (cfg) => {
  const now = Temporal.Now.zonedDateTimeISO();
  const start = getAnglesForTime(now.subtract({ minutes: 7 })).minute;
  const end = getAnglesForTime(now.subtract({ seconds: 33 })).minute;

  const width = 10;

  // black train outline
  drawTrainBody(width + 2.5, start, end, cfg, "black");
  drawTrainHead(width + 1.7, end - 0.003, true, cfg, "black");
  drawTrainHead(width + 1.7, start + 0.003, false, cfg, "black");

  // train
  drawTrainBody(width, start, end, cfg);
  drawTrainHead(width, end, true, cfg);
  drawTrainHead(width, start, false, cfg);
  drawCarSeperators(width, start, end, cfg);
  drawFrontWindow(width, end, true, cfg);
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

  const nextFewStops = stops.filter((s) => inNext(s, 51));

  const start = Temporal.Now.zonedDateTimeISO();
  const end = start.add({ minutes: 51 });
  // TODO: or use last stop
  // const end = nextFewStops[nextFewStops.length - 1].arrivalTime;
  drawMinuteTicks(start, config, end);
  nextFewStops.forEach((s) => drawStop(s, config));
  drawHands(config);
  drawTrain(config);
};
