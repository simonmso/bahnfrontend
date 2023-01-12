import { angleForHour, angleForMinute } from '../helpers';

const updateHands = (state) => {
    const { elements } = state;
    const now = state.pNow;
    const min = now.minute + (now.second / 60) + (now.millisecond / (60 * 1000));
    const thetaM = angleForMinute(min);
    const thetaH = angleForHour(now.hour + (min / 60));
    elements.hands.minute.setAttribute('x2', 0.8 * Math.cos(thetaM));
    elements.hands.minute.setAttribute('y2', 0.8 * Math.sin(thetaM));
    elements.hands.hour.setAttribute('x2', 0.5 * Math.cos(thetaH));
    elements.hands.hour.setAttribute('y2', 0.5 * Math.sin(thetaH));

    // used for gradient, might delete later
    elements.clock.style = `--hour: ${state.now.hour};
                                --minute: ${state.now.minute};
                                --second: ${state.now.second};
                                --millisecond: ${state.now.millisecond};`;
};
export default updateHands;
