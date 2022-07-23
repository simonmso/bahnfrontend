from datetime import datetime, timedelta, timezone
import http.client
import urllib.parse
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
    print('request sent:', endpoint)

    res = conn.getresponse()
    data = res.read()
    return parseXML(html.unescape(data.decode("utf=8")))

def getPlanForTime (evaNo, timeArg=None):
    time = timeArg
    if not time: time = datetime.now(timezone(timedelta(hours=2)))

    # datetime in germany
    date = time.strftime("%y%m%d")
    hour = time.strftime("%H")
    
    return request(f"/plan/{evaNo}/{date}/{hour}")[0]['children']

def getAllChanges (evaNo):
    return request(f"/fchg/{evaNo}")[0]['children']

def getRecentChanges (evaNo):
    return request(f"/rchg/{evaNo}")[0]['children']

def getStation (pattern):
    return request(f"/station/{urllib.parse.quote(pattern)}")[0]['children'][0]


def __getDeparturesOrArrivals__ (evaNo, time, dpOrAr="dp"):
    stops = getPlanForTime(evaNo, timeArg=time)
    matching = []
    for stop in stops:
        for child in stop['children']:
            if child['type'] == dpOrAr:
                matching.append(stop)
                break
    
    return matching

def getDepartures (evaNo, time=None):
    return __getDeparturesOrArrivals__(evaNo, time=time, dpOrAr='dp')

def getArrivals (evaNo, time=None):
    return __getDeparturesOrArrivals__(evaNo, time=time, dpOrAr='ar')

