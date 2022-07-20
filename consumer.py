from datetime import datetime, timedelta, timezone
import http.client
import html
from keys import DBApiKey, DBClientID
from xmlhandler import parseXML


conn = http.client.HTTPSConnection("apis.deutschebahn.com")

def request (endpoint):
    url = f"/db-api-marketplace/apis/timetables/v1{endpoint}"

    headers = {
        'DB-Client-Id': DBClientID,
        'DB-Api-Key': DBApiKey,
        'accept': "application/xml"
    }

    conn.request("GET", url, headers=headers)

    res = conn.getresponse()
    data = res.read()
    return parseXML(html.unescape(data.decode("utf=8")))

def getPlan (evaNo):
    # datetime in germany
    now = datetime.now(timezone(timedelta(hours=2)))
    date = now.strftime("%y%m%d")
    hour = now.strftime("%H")
    timetable = request(f"/plan/{evaNo}/{date}/{hour}")[0]

    # if less than 30 minutes until the next hour (ex. 1:45), get the next hour's timetable as well
    if int(now.strftime('%M')) > 30:
        nextHour = now + timedelta(hours=1)
        date = nextHour.strftime("%y%m%d")
        hour = nextHour.strftime('%H')
        timetable2 = request(f"/plan/{evaNo}/{date}/{hour}")[0]
        timetable['children'] = timetable['children'] + timetable2['children']
    
    return timetable['children']

def getAllChanges (evaNo):
    return request(f"/fchg/{evaNo}")

def getRecentChanges (evaNo):
    return request(f"/rchg/{evaNo}")

def getStation (pattern):
    return request(f"/station/{pattern}")


def __getDeparturesOrArrivals__ (evaNo, dpOrAr):
    stops = getPlan(evaNo)
    matching = []
    for stop in stops:
        for child in stop['children']:
            if child['type'] == dpOrAr:
                matching.append(stop)
                break
    
    return matching

def getDepartures (evaNo):
    return __getDeparturesOrArrivals__(evaNo, 'dp')

def getArrivals (evaNo):
    return __getDeparturesOrArrivals__(evaNo, 'ar')

