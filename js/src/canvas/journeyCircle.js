import { Temporal } from '@js-temporal/polyfill';
import { getMinuteAngle, getPosition } from './canvasFns';
import { earlierOf, stopInNext } from '../helpers';
import drawTrain from './train';

const drawDot = (pos, r, ctx) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, 7);
    ctx.fill();
};

const setGradient = (state) => {
    const { center, ctxs, now } = state;
    const ctx = ctxs.clock;

    const curAngle = getMinuteAngle(now);
    // WARNING: this may behave differently in other browsers
    const gradiant = ctx.createConicGradient(-curAngle + (Math.PI / 2), center.x, center.y);
    gradiant.addColorStop(0, 'white');
    gradiant.addColorStop(0.7, 'white');
    gradiant.addColorStop(0.8, 'black');
    ctx.fillStyle = gradiant;
    ctx.strokeStyle = gradiant;
};

const drawMinuteTicks = (startingTime, state, duration = { hours: 1 }) => {
    const {
        ctxs, center, radius, scaleFactor,
    } = state;
    const ctx = ctxs.clock;

    const desiredMinutes = Temporal.Duration.from(duration).total({ unit: 'minute' });
    const startingAngle = getMinuteAngle(startingTime, true);
    // for performance reasons, this isn't done using Temporal.compare
    for (let i = 0; i <= desiredMinutes; i++) {
        const offset = (Math.PI / 30) * i;
        const pos = getPosition(radius, startingAngle - offset, center);
        drawDot(pos, 3 * scaleFactor, ctx);
    }
};

const drawStop = (s, state) => {
    const {
        ctxs, center, radius, scaleFactor,
    } = state;
    const ctx = ctxs.clock;
    const time = earlierOf(s.arrivalTime, s.departureTime);
    const theta = getMinuteAngle(time, true);
    const pos = getPosition(radius, theta, center);
    const dotRad = 10 * scaleFactor;
    drawDot(pos, dotRad, ctx);

    if (s.arrivalTime && s.departureTime) {
        const theta2 = getMinuteAngle(s.departureTime, true);
        const pos2 = getPosition(radius, theta2, center);
        drawDot(pos2, dotRad, ctx);

        ctx.lineWidth = 5 * scaleFactor;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, -theta, -theta2);
        ctx.stroke();
    }
};

const drawJourney = (state) => {
    const { stops, now } = state;

    setGradient(state);
    const nextFewStops = stops.filter((s) => (
        s.show && stopInNext(s, state.now, { minutes: 53 }, true)
    ));

    const endStop = nextFewStops.find((s) => s.arrivalTime && !s.departureTime);
    const duration = endStop && stopInNext(endStop, now, { minutes: 53 }, true)
        ? endStop.arrivalTime.since(now)
        : { minutes: 53 };

    nextFewStops.forEach((s) => drawStop(s, state));
    drawMinuteTicks(now, state, duration);
    drawTrain(state);
};

export default drawJourney;
