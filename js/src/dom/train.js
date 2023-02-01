import { angleForMinute, journeyNotOver } from '../helpers';

export const createTrain = (parent) => {
    const train = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const w = 0.062;
    const R = 1 + (w / 2);
    const r = 1 - (w / 2);

    const turn = (t) => (
        (2 * Math.PI) * t
    );

    const psi = turn(0.12);
    const noseAngle = turn(1 / 60);

    const cpFrontDiff = turn(1 / 90);
    const cpWideDiff = 0.02;

    const window = {
        back: {
            R: 1 + ((w * 0.5) / 2),
            r: 1 - ((w * 0.5) / 2),
            theta: noseAngle * 0.7,
        },
        front: {
            R: 1 + ((w * 0.35) / 2),
            r: 1 - ((w * 0.35) / 2),
            theta: noseAngle * 0.35,
        },
    };

    const gapWidth = turn(1 / 1500);

    const point = (theta, radius) => (
        `${Math.cos(-theta) * radius},${Math.sin(-theta) * radius}`
    );

    train.setAttribute('d', `
        M ${point(noseAngle, R)}
        A ${R} ${R} 0 0 0 ${point((psi / 3) - gapWidth, R)}
        L ${point((psi / 3) - gapWidth, r)}
        A ${r} ${r} 0 0 1 ${point(noseAngle, r)}
        C ${point(noseAngle - cpFrontDiff, r)} ${point(0, 1 - cpWideDiff)} ${point(0, 1)}
        C ${point(0, 1 + cpWideDiff)} ${point(noseAngle - cpFrontDiff, R)} ${point(noseAngle, R)}

        M ${point((psi / 3) + gapWidth, R)}
        A ${R} ${R} 0 0 0 ${point((psi * (2 / 3)) - gapWidth, R)}
        L ${point((psi * (2 / 3)) - gapWidth, r)}
        A ${r} ${r} 0 0 1 ${point((psi / 3) + gapWidth, r)}
        
        M ${point((psi * (2 / 3)) + gapWidth, R)}
        A ${R} ${R} 0 0 0 ${point(psi - noseAngle, R)}
        C ${point(psi - noseAngle + cpFrontDiff, R)} ${point(psi, 1 + cpWideDiff)} ${point(psi, 1)}
        C ${point(psi, 1 - cpWideDiff)} ${point(psi - noseAngle + cpFrontDiff, r)} ${point(psi - noseAngle, r)}
        A ${r} ${r} 0 0 1 ${point((psi * (2 / 3)) + gapWidth, r)}

        M ${point(window.back.theta, window.back.R)}
        L ${point(window.front.theta, window.front.R)}
        L ${point(window.front.theta, window.front.r)}
        L ${point(window.back.theta, window.back.r)}
        L ${point(window.back.theta, window.back.R)}
    `);
    train.classList.add('trainBody');
    train.setAttribute('hide', true);
    parent.appendChild(train);
    return train;
};
export const updateTrain = (state) => {
    const { train } = state.elements;
    if (journeyNotOver(state)) {
        const theta = angleForMinute(state.pNow.minute + (state.pNow.second / 60));
        train.setAttribute('hide', false);
        train.setAttribute(
            'transform',
            `matrix(${Math.cos(theta)} ${Math.sin(theta)} ${-Math.sin(theta)} ${Math.cos(theta)} 0 0)`,
        );
    }
    else train.setAttribute('hide', true);
};
