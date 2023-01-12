import { createTrain, updateTrain } from './train';
import updateHands from './hands';
import updateStops from './stops';
import { createDots, updateDots } from './dots';
import { getNextInfo, transitionInfo } from './info';

export default {
    createDots,
    updateHands,
    updateStops,
    updateDots,
    createTrain,
    updateTrain,
    getNextInfo,
    transitionInfo,
};
