import { Temporal } from '@js-temporal/polyfill';

class Stop {
    #properties = [
        'id',
        'category',
        'number',
        'eva',
        'name',
        'line',
        'futureStops',
        'previousStops',
        'plannedDepartureTime',
        'changedDepartureTime',
        'plannedArrivalTime',
        'changedArrivalTime',
        'cancelled',
    ];

    #times = [
        'plannedDepartureTime',
        'changedDepartureTime',
        'plannedArrivalTime',
        'changedArrivalTime',
    ];

    constructor(props) {
        this.#properties.forEach((p) => {
            this[p] = props[p];
        });
        this.#times.forEach((t) => {
            if (this[t]) this[t] = Temporal.ZonedDateTime.from(this[t]);
        });
        this.elements = props.elements || {};
    }

    get tripId() {
        return this.id[0] === '-'
            ? `-${this.id.split('-')[1]}`
            : this.id.split('-')[0];
    }

    get routeId() {
        return `${this.category || ''} ${this.line || this.number || ''}`;
    }

    get departureTime() {
        return this.changedDepartureTime || this.plannedDepartureTime;
    }

    get arrivalTime() {
        return this.changedArrivalTime || this.plannedArrivalTime;
    }

    with(newStop) {
        const newProps = {};
        this.#properties.forEach((p) => {
            newProps[p] = newStop[p] || this[p];
        });
        newProps.elements = this.elements;
        return new Stop(newProps);
    }
}

export default Stop;
