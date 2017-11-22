#!/usr/bin/python3

import json

with open("manifest.json") as f:
    j=json.load(f)

if "applications" in j: del j["applications"]

with open("manifest.chrome.json","w") as f:
    json.dump(j,f,indent=2)
