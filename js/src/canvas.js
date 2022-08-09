import { getAnglesForTime, getPosition } from "./canvasFns";
import drawTrain from "./train";
import drawHands from "./hands";
import {
  earlierOf, lessThanXApart, stopInNext,
} from "./helpers";

const drawDot = (pos, r, ctx) => {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, 7);
  ctx.fill();
};

const setGradient = (cfg) => {
  const { center, ctx, now } = cfg;

  const curAngle = getAnglesForTime(now).minute;
  // WARNING: this may behave differently in other browsers
  const gradiant = ctx.createConicGradient(-curAngle + (Math.PI / 2), center.x, center.y);
  gradiant.addColorStop(0, "white");
  gradiant.addColorStop(0.7, "white");
  gradiant.addColorStop(0.8, "black");
  ctx.fillStyle = gradiant;
  ctx.strokeStyle = gradiant;
};

const drawMinuteTicks = (startingTime, config, duration = { hours: 1 }) => {
  const {
    ctx, center, radius, scaleFactor,
  } = config;

  let curTime = startingTime;
  for (; lessThanXApart(startingTime, curTime, duration); curTime = curTime.add({ minutes: 1 })) {
    const theta = getAnglesForTime(curTime, true).minute;
    const pos = getPosition(radius, theta, center);
    drawDot(pos, 3 * scaleFactor, ctx);
  }
};

const drawStop = (s, cfg) => {
  const {
    ctx, center, radius, scaleFactor,
  } = cfg;
  const time = earlierOf(s.arrivalTime, s.departureTime);
  const theta = getAnglesForTime(time, true).minute;
  const pos = getPosition(radius, theta, center);
  const dotRad = 10 * scaleFactor;
  drawDot(pos, dotRad, ctx);

  if (s.arrivalTime && s.departureTime) {
    const theta2 = getAnglesForTime(s.departureTime, true).minute;
    const pos2 = getPosition(radius, theta2, center);
    drawDot(pos2, dotRad, ctx);

    ctx.lineWidth = 5 * scaleFactor;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -theta, -theta2);
    ctx.stroke();
  }
};

const prepCanvasGetConfig = () => {
  const canvas = document.getElementById("main");

  const width = window.innerWidth - 17; // -17 to avoid scrollbar
  const height = window.innerHeight - 4;
  const center = { x: width / 2, y: height / 2 };
  const radius = height / 2.5;
  const scaleFactor = radius / 319;

  canvas.height = height;
  canvas.width = width;

  const ctx = canvas.getContext("2d");
  return {
    ctx,
    center,
    radius,
    scaleFactor,
    width,
    height,
  };
};

const clear = (config) => {
  config.ctx.clearRect(0, 0, config.width, config.height);
};

const drawJourney = (config) => {
  const { stops, now } = config;

  setGradient(config);
  const nextFewStops = stops.filter((s) => (
    s.show && stopInNext(s, config.now, { minutes: 53 }, true)
  ));

  const endStop = nextFewStops.find((s) => s.arrivalTime && !s.departureTime);
  const duration = endStop && stopInNext(endStop, now, { minutes: 53 }, true)
    ? endStop.arrivalTime.since(now)
    : { minutes: 53 };

  nextFewStops.forEach((s) => drawStop(s, config));
  drawMinuteTicks(now, config, duration);
  drawTrain(config);
};

export default {
  prepCanvasGetConfig,
  clear,
  drawJourney,
  drawHands,
};
