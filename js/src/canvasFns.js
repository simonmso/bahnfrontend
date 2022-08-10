export const getMinuteAngle = (date, flooring = false) => {
  const mPerc = flooring ? date.minute : date.minute + (date.second / 60);
  return (((Math.PI * 5) / 2) - (2 * Math.PI * (mPerc / 60))) % (2 * Math.PI);
};

export const getHourAngle = (date, flooring = false) => {
  const hPerc = flooring
    ? date.hour % 12
    : (date.hour % 12) + (date.minute / 60) + (date.second / 3600);
  return (((Math.PI * 5) / 2) - (2 * Math.PI * (hPerc / 12))) % (2 * Math.PI);
};

export const getAnglesForTime = (date, flooring = false) => ({
  hour: getHourAngle(date, flooring),
  minute: getMinuteAngle(date, flooring),
});

export const getPosition = (r, theta, center) => ({
  x: center.x + (r * Math.cos(theta)),
  y: center.y - (r * Math.sin(theta)),
});
