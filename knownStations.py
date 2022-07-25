import json

stationFile = open("./knownStations.json")
hbfFile = open("./knownHbfs.json")

knownStations = json.load(stationFile)
knownHbfs = json.load(hbfFile)
