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

export const prepCanvasGetState = () => {
    const clock = document.getElementById('clock');
    const info = document.getElementById('info');

    const width = window.innerWidth;
    const height = window.innerHeight;
    const center = { x: width / 2, y: height / 2 };
    const radius = height / 2.5;
    const scaleFactor = radius / 319;

    clock.height = height;
    clock.width = width;
    info.height = height;
    info.width = width;

    return {
        ctxs: {
            clock: clock.getContext('2d'),
            info: info.getContext('2d'),
        },
        center,
        radius,
        scaleFactor,
        width,
        height,
        problems: [],
    };
};
