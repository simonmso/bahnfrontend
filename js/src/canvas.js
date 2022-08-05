import { getAnglesForTime, getPosition } from "./canvasFns";
import drawTrain from "./train";

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

const inNext = (s, min, cfg) => {
  const t = s.departureTime || s.arrivalTime;
  const diff = t.epochSeconds - cfg.now.epochSeconds;
  return diff >= 0 && diff <= 60 * min;
};

const drawStop = (s, cfg) => {
  const { ctx, center, radius } = cfg;
  const time = s.arrivalTime || s.departureTime;
  const theta = getAnglesForTime(time, true).minute;
  const pos = getPosition(radius, theta, center);
  drawDot(pos, 10, ctx);

  if (s.arrivalTime && s.departureTime) {
    const theta2 = getAnglesForTime(s.departureTime, true).minute;
    const pos2 = getPosition(radius, theta2, center);
    drawDot(pos2, 10, ctx);

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -theta, -theta2);
    ctx.stroke();
  }
};

const drawHands = (cfg) => {
  const {
    ctx, center, radius, now,
  } = cfg;
  const { minute, hour } = getAnglesForTime(now);
  const minEnd = getPosition(radius * 0.9, minute, center);
  const hourEnd = getPosition(radius / 2, hour, center);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(minEnd.x, minEnd.y);
  ctx.lineTo(center.x, center.y);
  ctx.stroke();
  ctx.lineTo(hourEnd.x, hourEnd.y);
  ctx.stroke();
};

export const prepCanvasConfig = () => {
  const canvas = document.getElementById("main");

  const width = window.innerWidth - 17; // -17 to avoid scrollbar
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
  const { stops, ctx, now } = config;

  ctx.clearRect(0, 0, config.width, config.height);

  if (!stops) {
    drawHands(config);
  } else {
    const nextFewStops = stops.filter((s) => s.show && inNext(s, 53, config));

    const lastStop = nextFewStops.find((s) => s.arrivalTime && !s.departureTime);
    const lastMinute = now.add({ minutes: 53 });
    const end = lastStop && (lastStop.arrivalTime.epochSeconds < lastMinute.epochSeconds)
      ? lastStop.arrivalTime
      : lastMinute;

    setGradient(config);
    drawMinuteTicks(now, config, end);
    nextFewStops.forEach((s) => drawStop(s, config));
    drawHands(config);
    drawTrain(config);
  }
};
