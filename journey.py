from datetime import datetime, timedelta
import consumer


def formatTimetableStops (stops):
    formattedStops = []
    for stop in stops:
        formatted = {}
        if 'id' in stop['data']: formatted['id'] = stop['data']['id']
        # there is definitely a more elegant way of writing this
        for child in stop['children']:
            if child['type'] == 'tl':
                if 'c' in child['data']: formatted['catagory'] = child['data']['c']
                if 'n' in child['data']: formatted['number'] = child['data']['n']
            elif child['type'] == 'dp':
                if 'pt' in child['data']: formatted['plannedDepartureTime'] = datetime.strptime(child['data']['pt'], '%y%m%d%H%M')
                if 'ct' in child['data']: formatted['departureTime'] = datetime.strptime(child['data']['ct'], '%y%m%d%H%M')
                if 'ppth' in child['data']: formatted['futureStops'] = child['data']['ppth'].split('|')
                if 'cpth' in child['data']: formatted['futureStops'] = child['data']['cpth'].split('|')
                if 'l' in child['data']: formatted['line'] = child['data']['l']
                if 'cs' in child['data']: formatted['cancelled'] = child['data']['cs'] == 'c'
            elif child['type'] == 'ar':
                if 'pt' in child['data']: formatted['plannedArrivalTime'] = datetime.strptime(child['data']['pt'], '%y%m%d%H%M')
                if 'ct' in child['data']: formatted['arrivalTime'] = datetime.strptime(child['data']['ct'], '%y%m%d%H%M')
                if 'ppth' in child['data']: formatted['previousStops'] = child['data']['ppth'].split('|')
                if 'cpth' in child['data']: formatted['previousStops'] = child['data']['cpth'].split('|')
                if 'l' in child['data']: formatted['line'] = child['data']['l']
                if 'cs' in child['data']: formatted['cancelled'] = child['data']['cs'] == 'c'
        formattedStops.append(formatted)
    
    return formattedStops


def updateWithDelays(stops, evaNo):
    allChangeStops = consumer.getAllChanges(evaNo)
    thatMatter = []
    idxs = []

    # add all changes relevant to the current stops
    for (i, stop) in enumerate(stops): 
        for change in allChangeStops:
            if stop['id'] == change['data']['id']:
                thatMatter.append(change)
                idxs.append(i)
                break
    formatted = formatTimetableStops(thatMatter)
    
    # for each change, update the stop with the new info
    newStops = []
    for (j, change) in enumerate(formatted):
        newStop = stops[idxs[j]]
        for (key, value) in change.items():
            newStop[key] = value
        newStops.append(newStop)

    # if no new time, the train is leaving according to plan
    for stop in newStops:
        if not 'departureTime' in stop:
            stop['departureTime'] = stop['plannedDepartureTime']
    
    return newStops


# evaNo = 8011160 # berlin hbf
evaNo = 8000237 # luebeck hbf

stopsWithDepartures = formatTimetableStops(consumer.getDepartures(evaNo))
stopsWithDepartures = updateWithDelays(stopsWithDepartures, evaNo)

currTime = datetime.now() + timedelta(hours=8)

nearestStop = stopsWithDepartures[0]
for stop in stopsWithDepartures:
    current = abs(currTime - nearestStop['departureTime'])
    testing = abs(currTime - stop['departureTime'])
    if testing < current:
        nearestStop = stop

print('nearestStop', nearestStop)


