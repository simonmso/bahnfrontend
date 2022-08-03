export const getAnglesForTime = (date, flooring = false) => {
  const h = flooring
    ? (date.hour % 12)
    : (date.hour % 12) + (date.minute / 60) + (date.second / 3600);
  const m = flooring ? date.minute : date.minute + (date.second / 60);
  return {
    hour: (((Math.PI * 5) / 2) - (2 * Math.PI * (h / 12))) % (2 * Math.PI),
    minute: (((Math.PI * 5) / 2) - (2 * Math.PI * (m / 60))) % (2 * Math.PI),
  };
};

export const getPosition = (r, theta, center) => ({
  x: center.x + (r * Math.cos(theta)),
  y: center.y - (r * Math.sin(theta)),
});
