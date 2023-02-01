import { Temporal } from '@js-temporal/polyfill';
import {
    angleForMinute, hslForMinute,
} from '../helpers';

const getPosForMin = (m) => {
    const theta = angleForMinute(m);
    return { x: Math.cos(theta), y: Math.sin(theta) };
};

const getDotForPos = (p) => {
    const r = 0.02;
    return `M ${p.x},${p.y - r}
        A ${r} ${r} 0 0 1 ${p.x},${p.y + r}
        A ${r} ${r} 0 0 1 ${p.x},${p.y - r}`;
};

const refreshStop = (stop, futureDepth, state) => {
    let startDotPath = '';
    let endDotPath = '';
    let curvePath = '';
    let iPos;
    let fPos;
    let startMinute;
    let endMinute;

    // refresh curve
    const pathIsNew = !stop.elements.path;
    const path = stop.elements.path
        || document.createElementNS('http://www.w3.org/2000/svg', 'path');

    if (stop.arrivalTime) {
        const useArrTime = Temporal.ZonedDateTime.compare(state.now, stop.arrivalTime) <= 0;
        startMinute = useArrTime
            ? stop.p.arrivalTime.minute + (stop.p.arrivalTime.second / 60)
            : state.pNow.minute + (state.pNow.second / 60);
        iPos = getPosForMin(startMinute);

        if (useArrTime) startDotPath = getDotForPos(iPos);
    }
    if (stop.departureTime) {
        const timeTilDep = stop.departureTime.since(state.now);
        const useDepTime = Temporal.Duration.compare(timeTilDep, { minutes: futureDepth }) <= 0;
        endMinute = useDepTime
            ? stop.p.departureTime.minute + (stop.p.departureTime.second / 60)
            : state.pNow.minute + futureDepth + (state.pNow.second / 60);
        fPos = getPosForMin(endMinute);

        if (useDepTime) endDotPath = getDotForPos(fPos);
    }
    if (iPos && fPos) {
        curvePath = `
            M ${iPos.x},${iPos.y}
            A 1 1 0 0 1 ${fPos.x},${fPos.y}
            A 1 1 0 0 0 ${iPos.x},${iPos.y}
        `;

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

        if (pathIsNew) {
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
        }

        path.setAttribute('stroke', `url(#grad-${stop.id})`);
        path.setAttribute('fill', `url(#grad-${stop.id})`);
    }
    else {
        path.setAttribute('stroke', hslForMinute(startMinute || endMinute, state.pNow));
        path.setAttribute('fill', hslForMinute(startMinute || endMinute, state.pNow));
    }

    if (pathIsNew) {
        path.classList.add('curve');
        state.elements.stopsContainer.appendChild(path);
        stop.elements.path = path;
    }

    path.setAttribute('d', `
    ${startDotPath}
    ${endDotPath}
    ${curvePath}
`);
};

export const removeStop = (s) => {
    if (s.elements.path) {
        s.elements.path.remove();
        s.elements.path = undefined;
    }
    if (s.elements.gradient) {
        s.elements.gradient.remove();
        s.elements.gradient = undefined;
        s.elements.gradientStops.start.remove();
        s.elements.gradientStops.start = undefined;
        s.elements.gradientStops.end.remove();
        s.elements.gradientStops.end = undefined;
    }
};

export default refreshStop;
