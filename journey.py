from datetime import datetime, timedelta, timezone
import random
import consumer


def formatStops (stops):
    formattedStops = []
    for stop in stops:
        formatted = {
            'previousStops': [],
            'futureStops': [],
            'plannedArrivalTime': 0,
            'plannedDepartureTime': 0,
            'id': stop['data']['id'],
            'catagory': '',
            'number': '',
            'line': ''
        }
        for child in stop['children']:
            if child['type'] == 'tl':
                formatted['catagory'] = child['data']['c']
                formatted['number'] = child['data']['n']
            elif child['type'] == 'dp':
                formatted['plannedDepartureTime'] = datetime.strptime(child['data']['pt'], '%y%m%d%H%M')
                formatted['futureStops'] = child['data']['ppth'].split('|')
                if 'l' in child['data']: formatted['line'] = child['data']['l']
            elif child['type'] == 'ar':
                formatted['plannedArrivalTime'] = datetime.strptime(child['data']['pt'], '%y%m%d%H%M')
                formatted['previousStops'] = child['data']['ppth'].split('|')
                if 'l' in child['data']: formatted['line'] = child['data']['l']
        formattedStops.append(formatted)
    
    return formattedStops


# evaNo = 8011160 # berlin
evaNo = 8000237 # luebeck

stopsWithDepartures = formatStops(consumer.getDepartures(evaNo))

currTime = datetime.now() + timedelta(hours=8)

nearestStop = stopsWithDepartures[0]
for stop in stopsWithDepartures:
    current = abs(currTime - nearestStop['plannedDepartureTime'])
    testing = abs(currTime - stop['plannedDepartureTime'])
    if testing < current:
        nearestStop = stop

print('nearestStop', nearestStop)


