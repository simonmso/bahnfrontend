from datetime import datetime, timedelta, timezone
import consumer


def formatTimetableStops (stops):
    formattedStops = []
    for stop in stops:
        formatted = {}
        if 'id' in stop['data']:
            formatted['id'] = stop['data']['id']

            # deal with ids sometimes having a leading '-'
            if stop['data']['id'].startswith('-'):
                formatted['tripId'] = f"-{stop['data']['id'].split('-')[1]}"
            else: formatted['tripId'] = stop['data']['id'].split('-')[0]

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
    newStops = stops
    for (j, change) in enumerate(formatted):
        newStop = stops[idxs[j]]
        for (key, value) in change.items():
            newStop[key] = value
        newStops[idxs[j]] = newStop

    # if no new time, the train is leaving according to plan
    for stop in newStops:
        if not 'departureTime' in stop and 'plannedDepartureTime' in stop:
            stop['departureTime'] = stop['plannedDepartureTime']
        if not 'arrivalTime' in stop and 'plannedArrivalTime' in stop:
            stop['arrivalTime'] = stop['plannedArrivalTime']
        stop['eva'] = evaNo # also add eva
    
    return newStops


def findStopInStation (tripId, station, baseTime):
    station = consumer.getStation(station)['data']
    testingTime = baseTime
    foundStop = False
    i = 0
    while not foundStop:
        if i >= 24:
            print("did not find arrival in the next 24 hours")
            break
        arrivalsAtEnd = formatTimetableStops(consumer.getArrivals(station['eva'], testingTime))
        for (i, arrival) in enumerate(arrivalsAtEnd):
            if tripId == arrival['tripId']:
                trueArrivals = updateWithDelays(arrivalsAtEnd, station['eva']) # updates with delays here to minimize requests
                foundStop = trueArrivals[i]
        if foundStop: break

        testingTime = testingTime + timedelta(hours=1)
        i += 1
    return foundStop


def buildJourneyFromStop (stop):
    earliestStopTime = stop['departureTime']
    journey = [stop]
    for station in stop['futureStops']:
        foundStop = findStopInStation(stop['tripId'], station, earliestStopTime)
        foundStop['name'] = station
        earliestStopTime = foundStop['arrivalTime']
        journey.append(foundStop)
        
    return journey



def findSoonestDepartureForStation (evaNo):
    time = datetime.now(timezone(timedelta(hours=2)))

    departuresFromStation = formatTimetableStops(consumer.getDepartures(evaNo, time))
    while True:
        time = time + timedelta(hours=1)
        departuresFromStation = departuresFromStation + formatTimetableStops(consumer.getDepartures(evaNo, time))
        if len(departuresFromStation): break

    departuresFromStation = updateWithDelays(departuresFromStation, evaNo)
    # TODO: exclude cancelled trains

    # different from 'time' above b/c we need to compare naive time later
    currTime = datetime.now() + timedelta(hours=8)

    nearestStop = departuresFromStation[0]
    for stop in departuresFromStation:
        current = abs(currTime - nearestStop['departureTime'])
        testing = abs(currTime - stop['departureTime'])
        if testing < current:
            nearestStop = stop

    if 'line' in nearestStop: print('\nfound nearest stop:', nearestStop['id'], nearestStop['departureTime'], nearestStop['catagory'], nearestStop['line'], 'towards:', nearestStop['futureStops'][-1], '\n')
    else: print('nearestStop', nearestStop)
    return nearestStop


def main ():

    evaNo = 8011160 # berlin hbf
    # evaNo = 8000237 # luebeck hbf

    nearestStop = findSoonestDepartureForStation(evaNo)
    nearestStop['name'] = 'berlin'
    # nearestStop['name'] = 'lubeck'
    journey = buildJourneyFromStop(nearestStop)

    print('\njourney:')
    for stop in journey:
        if 'departureTime' in stop: print(stop['departureTime'], stop['name'],)
        else: print(stop['arrivalTime'], stop['name'],)


if __name__ == "__main__": main()

