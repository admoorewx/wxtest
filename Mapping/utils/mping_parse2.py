import os, json
import requests
import datetime

#saveDir = '/home/AndrewMoore/wxtest/static/data/cim/'
saveDir = './'

# API key and base URL
api_key = "5fe1f378b6bfe8e32cf3924aeee69811bd039c61"
url = 'http://mping.ou.edu/mping/api/v2/reports'
past = 4 # hours

# Required headers
reqheaders = {
    'content-type':'application/json',
    'Authorization':'Token '+api_key
}

# To add:
# obs time
current = datetime.datetime.utcnow()
past24 = current - datetime.timedelta(hours=past)
past24_string = datetime.datetime.strftime(past24, "%Y-%m-%d %H:%M:%S")

# Hail request
print("Getting hail request...")
reqhail = {'category':'Hail','obtime_gt':past24_string}
response = requests.get(url,params=reqhail,headers=reqheaders)
if response.status_code != 200:
    print('Hail request Failed with status code %i' % response.status_code)
else:
    #print('Request Successful')
    data = response.json()
    # Pretty print the data
    #print(json.dumps(data,indent=4))
    with open(saveDir+'mping_hail.json', 'w') as outfile:
        json.dump(data, outfile)
print("Done.")

# Wind Damage request
print("Getting wind request...")
reqwind = {'category': 'Wind Damage','obtime_gt':past24_string}
response = requests.get(url,params=reqwind,headers=reqheaders)
if response.status_code != 200:
    print('Wind request Failed with status code %i' % response.status_code)
else:
    #print('Request Successful')
    data = response.json()
    # Pretty print the data
    #print(json.dumps(data,indent=4))
    with open(saveDir+'mping_wind.json', 'w') as outfile:
        json.dump(data, outfile)
print("Done.")

# Winter Request
print("Getting winter request...")
winter_dict = {
    'count': 0,
    'next': 'null',
    'previous': 'null',
    'results': []
}
winter_words = ["Freezing", "Snow", "Mixed", "Ice"]
for word in winter_words:
    reqwinter = {'description_contains':word,'obtime_gt':past24_string}
    response = requests.get(url, params=reqwinter, headers=reqheaders)
    if response.status_code != 200:
        print(f'Winter request failed with status code {response.status_code} for phrase: {word}')
    else:
        results = response.json()['results']
        for result in results:
            winter_dict['results'].append(result)

with open(saveDir+'mping_winter.json', 'w') as outfile:
    json.dump(winter_dict, outfile)
print("Done.")
print("!!! SUCCESS !!!")
