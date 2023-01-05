const updateHands = (state) => {
    state.elements.clock.style = `--hour: ${state.now.hour};
                                --minute: ${state.now.minute};
                                --second: ${state.now.second};
                                --millisecond: ${state.now.millisecond};`;
}

export default {
    updateHands
}