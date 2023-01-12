import { Temporal } from '@js-temporal/polyfill';
import {
    angleForMinute, hslForMinute,
} from '../helpers';

const refreshStopCurve = (stop, futureDepth, state) => {
    const useNow = Temporal.ZonedDateTime.compare(state.now, stop.arrivalTime) >= 0;
    const startTime = useNow ? state.pNow : stop.p.arrivalTime;

    const startMinute = startTime.minute + (startTime.second / 60);

    const timeTilDep = stop.departureTime.since(state.now);
    const useDepTime = Temporal.Duration.compare(timeTilDep, { minutes: futureDepth }) <= 0;
    const endTime = useDepTime
        ? stop.p.departureTime
        : { ...state.pNow, minute: state.pNow.minute + futureDepth };
    const endMinute = endTime.minute + (endTime.second / 60);

    // refresh curve
    const curveIsNew = !stop.elements.curve;
    const curve = stop.elements.curve
        || document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const iTheta = angleForMinute(startMinute);
    const fTheta = angleForMinute(endMinute);
    const iPos = { x: Math.cos(iTheta), y: Math.sin(iTheta) };
    const fPos = { x: Math.cos(fTheta), y: Math.sin(fTheta) };
    curve.setAttribute('d', `
        M ${iPos.x},${iPos.y}
        A 1 1 0 0 1 ${fPos.x},${fPos.y}
    `);

    if (curveIsNew) {
        curve.classList.add('curve');
        state.elements.stopsContainer.appendChild(curve);
        stop.elements.curve = curve;
    }

    // refresh gradient
    const gradient = stop.elements.gradient
        || document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    const start = stop.elements.gradientStops?.start
        || document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    const end = stop.elements.gradientStops?.end
        || document.createElementNS('http://www.w3.org/2000/svg', 'stop');

    start.setAttribute('stop-color', hslForMinute(startMinute, state.pNow));
    end.setAttribute('stop-color', hslForMinute(endMinute, state.pNow));

    // make sure the gradient is going the correct direction
    const dx = fPos.x - iPos.x;
    const dy = fPos.y - iPos.y;
    gradient.setAttribute('cx', dx < 0 ? '100%' : '0%');
    gradient.setAttribute('cy', dy < 0 ? '100%' : '0%');
    gradient.setAttribute('r', `${(Math.hypot(dx, dy) / Math.abs(dx)) * 100}%`);

    if (curveIsNew) {
        start.setAttribute('offset', '0%');
        end.setAttribute('offset', '100%');
        gradient.id = `grad-${stop.id}`;
        state.elements.defs.appendChild(gradient);
        gradient.appendChild(start);
        gradient.appendChild(end);
        stop.elements.gradient = gradient;
        stop.elements.gradientStops = {
            start,
            end,
        };

        curve.setAttribute('stroke', `url(#grad-${stop.id})`);
    }
};

export default refreshStopCurve;
