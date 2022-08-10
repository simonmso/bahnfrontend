import { getMinuteAngle, getPosition } from "./canvasFns";

const drawTrainHead = (trainWidth, angle, forward, cfg, color = "white") => {
  const { ctxs, center, radius } = cfg;
  const ctx = ctxs.clock;
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
  const { ctxs, center, radius } = cfg;
  const ctx = ctxs.clock;
  ctx.strokeStyle = color;
  ctx.lineWidth = trainWidth * 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, -startAngle, -endAngle);
  ctx.stroke();
};

const drawCarSeperators = (trainWidth, startAngle, endAngle, cfg) => {
  const { ctxs, center, radius } = cfg;
  const ctx = ctxs.clock;

  // account for the added length of the head and tail
  const cars = 4;
  const headOffset = 2 * Math.PI * (0.5 / 60);
  const start = startAngle + headOffset;
  const end = endAngle - headOffset;

  // this is complicated to avoid a bug when the train straddles
  // the 15 minute mark
  const carAngle = -1 * Math.abs(Math.min(
    (end - start),
    (2 * Math.PI) - (end - start),
  ) / cars);

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
  const { ctxs, center, radius } = cfg;
  const ctx = ctxs.clock;
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
  const { now, scaleFactor } = cfg;
  const start = getMinuteAngle(now.subtract({ minutes: 7 }));
  const end = getMinuteAngle(now.subtract({ seconds: 33 }));

  const width = 10 * scaleFactor;

  // black train outline
  const headoff = 2.5 * scaleFactor;
  const bodyOff = 1.7 * scaleFactor;
  drawTrainBody(width + headoff, start, end, cfg, "black");
  drawTrainHead(width + bodyOff, end - 0.003, true, cfg, "black");
  drawTrainHead(width + bodyOff, start + 0.003, false, cfg, "black");

  // train
  drawTrainBody(width, start, end, cfg);
  drawTrainHead(width, end, true, cfg);
  drawTrainHead(width, start, false, cfg);
  drawCarSeperators(width, start, end, cfg);
  drawFrontWindow(width, end, true, cfg);
};

export default drawTrain;
