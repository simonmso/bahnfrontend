const getJourney = () => {
    const url = 'http://172.18.111.176:8080';
    return fetch(url).then((resp) => JSON.parse(resp));
};

export default getJourney;
