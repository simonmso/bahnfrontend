from datetime import datetime, timedelta, timezone
import random
import consumer
from knownStations import knownStations, knownHbfs


def getIdsFromStop (stop):
    ids = {}
    if 'id' in stop['data']:
        ids['id'] = stop['data']['id']

        # deal with ids sometimes having a leading '-'
        if stop['data']['id'].startswith('-'):
            ids['tripId'] = f"-{stop['data']['id'].split('-')[1]}"
        else: ids['tripId'] = stop['data']['id'].split('-')[0]
    return ids


def formatTimetableStops (stops):
    dataMap = {
        'tl': {
            'c': ['category', lambda a: a],
            'n': ['number', lambda a: a]
        },
        'dp': {
            'pt': ['plannedDepartureTime', lambda d: datetime.strptime(f"{d}+0200", '%y%m%d%H%M%z')],
            'ct': ['departureTime', lambda d: datetime.strptime(f"{d}+0200", '%y%m%d%H%M%z')],
            'ppth': ['futureStops', lambda s: s.split('|')],
            'cpth': ['futureStops', lambda s: s.split('|')],
            'l': ['line', lambda a: a],
            'cs': ['cancelled', lambda c: c == 'c']
        },
        'ar': {
            'pt': ['plannedArrivalTime', lambda d: datetime.strptime(f"{d}+0200", '%y%m%d%H%M%z')],
            'ct': ['arrivalTime', lambda d: datetime.strptime(f"{d}+0200", '%y%m%d%H%M%z')],
            'ppth': ['arrivalTime', lambda s: s.split('|')],
            'cpth': ['arrivalTime', lambda s: s.split('|')],
            'l': ['line', lambda a: a],
            'cs': ['cancelled', lambda c: c == 'c']
        }
    }

    formattedStops = []
    for stop in stops:
        formatted = getIdsFromStop(stop)

        # there is definitely a more elegant way of writing this
        for child in stop['children']:
            if child['type'] in dataMap:
                for (oldKey, (newKey, formatFn)) in dataMap[child['type']].items():
                    if oldKey in child['data']: formatted[newKey] = formatFn(child['data'][oldKey])

        formattedStops.append(formatted)
    
    return formattedStops


def confirmActualTime(stop):
    # if no new time, the train is leaving according to plan
    newStop = stop
    for (actual, planned) in [['departureTime', 'plannedDepartureTime'], ['arrivalTime', 'plannedArrivalTime']]:
        if (planned in stop) and not (actual in stop):
            newStop[actual] = stop[planned]
    return newStop
        

def applyChangesToStops(stops, changes):
    newStops = stops
    for stop in newStops: 
        for change in changes:
            if stop['id'] == change['id']:
                for (key, value) in change.items():
                    stop[key] = value
                break
    return newStops


def updateWithDelays(stops, evaNo):
    changes = formatTimetableStops(consumer.getAllChanges(evaNo))

    newStops = applyChangesToStops(stops, changes)

    for stop in newStops:
        stop = confirmActualTime(stop)
        stop['eva'] = evaNo
    
    return newStops


def getEvaForStationName (station):
    eva = ''
    if station in knownStations: eva = knownStations[station]
    else:
        stationResult = consumer.getStation(station)
        if stationResult == None: return None
        eva = stationResult['data']['eva']
    return eva


def findStopInStation (tripId, station, baseTime, future=True):
    eva = getEvaForStationName(station)
    testingTime = baseTime
    foundStop = False
    while not foundStop:
        if abs(testingTime - baseTime) >= timedelta(hours=10):
            print("did not find stop in the next 10 hours for station:", station)
            break

        stops = []
        if future: stops = formatTimetableStops(consumer.getArrivals(eva, testingTime))
        else: stops = formatTimetableStops(consumer.getDepartures(eva, testingTime))

        for (j, arrival) in enumerate(stops):
            if tripId == arrival['tripId']: foundStop = updateWithDelays(stops, eva)[j]
        
        if foundStop:
            foundStop['name'] = station
            break

        if future: testingTime += timedelta(hours=1)
        else: testingTime -= timedelta(hours=1)
    return foundStop


def buildJourneyFromStop (stop):
    earliestStopTime = stop['departureTime']
    journey = [stop]

    if 'previousStops' in stop:
        foundStop = findStopInStation(stop['tripId'], stop['previousStops'][0], earliestStopTime, future=False)
        if (foundStop): journey.insert(0, foundStop)


    for station in stop['futureStops']:
        foundStop = findStopInStation(stop['tripId'], station, earliestStopTime)
        if (foundStop):
            earliestStopTime = foundStop['arrivalTime']
            journey.append(foundStop)
        
    return journey


def filterStopsByRelevant (stops):
    discludeReasons = [
        ['cancelled', True],
    ]
    includedCategories = ["RE", "IC", "ICE"]
    newStops = []
    for stop in stops:
        includeStop = True
        approvedCatagory = stop['category'] in includedCategories
        # for 3rd party opperated trains, the category is in the line, ex: { 'category': 'ME', 'line': 'RE3' }
        approvedLine = 'line' in stop and stop['line'].strip('1234567890') in includedCategories
        includeStop = approvedCatagory or approvedLine
        for (key, value) in discludeReasons:
            if key in stop and stop[key] == value: includeStop = False
        if includeStop: newStops.append(stop)
    return newStops


def stopString (stop):
    keys = ['id', 'departureTime', 'category', 'line']
    ret = ''
    for key in keys:
        if key in stop: ret += f"{stop[key]} "
    if 'futureStops' in stop: ret += f"towards: {stop['futureStops'][-1]}"
    return ret


def findSoonestDepartureForStation (evaNo):
    now = datetime.now(timezone(timedelta(hours=2)))

    departuresFromStation = formatTimetableStops(consumer.getDepartures(evaNo, now))
    departuresFromStation = departuresFromStation + formatTimetableStops(consumer.getDepartures(evaNo, now + timedelta(hours=1)))
    departuresFromStation = updateWithDelays(departuresFromStation, evaNo)

    departuresFromStation = filterStopsByRelevant(departuresFromStation)

    if not len(departuresFromStation):
        return None        

    nearestStop = departuresFromStation[0]
    for stop in departuresFromStation:
        current = abs(now - nearestStop['departureTime'])
        testing = abs(now - stop['departureTime'])
        if testing < current:
            nearestStop = stop

    print(f"\nFound nearest stop: {stopString(nearestStop)}\n")
    return nearestStop


def main ():
    # evaNo = 8000801
    # name = "Bardowick"
    (name, evaNo) = random.choice(list(knownStations.items()))
    nearestStop = findSoonestDepartureForStation(evaNo)

    while not nearestStop:
        # if no departure from first station, limit stations to hbfs
        print('\nNo nearterm stops for', name, '\n')
        (name, evaNo) = random.choice(list(knownHbfs.items()))
        nearestStop = findSoonestDepartureForStation(evaNo)

    nearestStop['name'] = name
    journey = buildJourneyFromStop(nearestStop)

    print('\njourney:')
    for stop in journey:
        if 'departureTime' in stop: print(stop['departureTime'], stop['name'],)
        else: print(stop['arrivalTime'], stop['name'],)


if __name__ == "__main__": main()

