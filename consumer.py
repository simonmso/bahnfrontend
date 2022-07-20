from datetime import datetime, timedelta, timezone
import http.client
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
    return parseXML(data.decode("utf=8"))

def getPlan (evaNo):
    # datetime in germany
    now = datetime.now(timezone(timedelta(hours=2)))
    date = now.date().strftime("%y%m%d")
    hour = now.time().strftime("%H")
    return request(f"/plan/{evaNo}/{date}/{hour}")

def getAllChanges (evaNo):
    return request(f"/fchg/{evaNo}")

def getRecentChanges (evaNo):
    return request(f"/rchg/{evaNo}")
