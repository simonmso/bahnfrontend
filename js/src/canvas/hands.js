import { getAnglesForTime, getPosition } from "./canvasFns";

const drawHands = (state) => {
  const {
    ctxs, center, radius, now, scaleFactor,
  } = state;
  const ctx = ctxs.clock;
  const { minute, hour } = getAnglesForTime(now);
  const minEnd = getPosition(radius * 0.9, minute, center);
  const hourEnd = getPosition(radius / 2, hour, center);

  // draw outlines
  ctx.strokeStyle = "black";
  ctx.lineWidth = 8 * scaleFactor;
  ctx.beginPath();
  ctx.moveTo(minEnd.x, minEnd.y);
  ctx.lineTo(center.x, center.y);
  ctx.lineTo(hourEnd.x, hourEnd.y);
  ctx.stroke();

  // draw hands
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4 * scaleFactor;
  ctx.beginPath();
  ctx.moveTo(minEnd.x, minEnd.y);
  ctx.lineTo(center.x, center.y);
  ctx.lineTo(hourEnd.x, hourEnd.y);
  ctx.stroke();
};

export default drawHands;