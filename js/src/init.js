import dummy from "./dummy";
import cfg from "./config.json";

const createClock = () => {
    // create 60 dots, one in each minute position
    const container = document.getElementById("dotsContainer");
    const dots = [];

    for (let i = 0; i <= 59; i++) {
        const newDot = document.createElement("div");
        newDot.className = "dot";
        newDot.style = `--i:${i}`;
        container.append(newDot);
        dots.push(newDot);
    }

    // get hands
    const clock = document.getElementById("clock");

    return {
        dots,
        clock
    }
}

const initializeState = () => {
    const elements = createClock();
    const state = {
        elements,
        problems: [],
    };
    if (cfg.useDummy) state.stops = dummy;

    return state;
}

export default initializeState;