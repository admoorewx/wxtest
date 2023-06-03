import requests
import numpy as np
import json, time, os
import datetime as DT
from math import sin, cos, radians
from bs4 import BeautifulSoup as BS
from scipy.interpolate import interp1d

# Model, Save, and sounding location file paths
model = "rap"
# Dev paths
#save_path = "H:/Python/forecast_soundings"
#sounding_locations_file = "H:/Python/wxtest/static/data/soundings/forecast_locations.json"
# Production paths
save_path = "/var/www/wxtest/static/data/soundings/forecast_soundings"
sounding_locations_file = "/var/www/wxtest/static/data/soundings/forecast_locations.json"

def get_stid(line):
    parts = line.split(" ")
    return parts[2]


def get_forecast_time(line):
    parts = line.split(" ")
    return parts[8]


def get_data(line):
    parts = line.split(" ")
    parts = [float(part) for part in parts]
    return parts


def wind_components(wspd, wdir):
    wdir = 270.0 - wdir
    if wdir < 0.0:
        wdir = wdir + 360.0
    u = wspd * cos(radians(wdir))
    v = wspd * sin(radians(wdir))
    return u, v

def supersat_check(sounding):
    # Check for supersaturation. Set dewpoint equal to temperature if found
    for i,temp in enumerate(sounding['temperature']):
        if sounding['dewpoint'][i] > temp:
            sounding['dewpoint'][i] = temp
    return sounding

def remove_missing_values(x, y, missing_value):
    new_x = []
    new_y = []
    for i, value in enumerate(y):
        if value != missing_value:
            new_x.append(x[i])
            new_y.append(value)
    return new_x, new_y


def interpolate_by_pressure(sounding):
    ### Interpolation ###
    # We need to linearly interpolate all the variables to a set of pressure levels
    if sounding['pressure'][0] > 1000.0:
        interp_pressures = [sounding['pressure'][0]] + list(np.arange(1000.0, 50.0, -25.0))
    else:
        interp_pressures = list(np.arange(1000.0, 50.0, -25.0))

    # Remove missing values
    missing_value = -9999.0
    height_pres, height = remove_missing_values(sounding['pressure'], sounding['height'], missing_value)
    temp_pres, temp = remove_missing_values(sounding['pressure'], sounding['temperature'], missing_value)
    dewp_pres, dewp = remove_missing_values(sounding['pressure'], sounding['dewpoint'], missing_value)
    wind_pres, u_wind = remove_missing_values(sounding['pressure'], sounding['u_wind'], missing_value)
    wind_pres, v_wind = remove_missing_values(sounding['pressure'], sounding['v_wind'], missing_value)

    # Now we need to create the interpolators
    kind = 'cubic'  # interpolation type - see Scipy Interp1d documentation for options
    temp_interp = interp1d(temp_pres, temp, kind=kind, bounds_error=False, fill_value='extrapolate')
    dewp_interp = interp1d(dewp_pres, dewp, kind=kind, bounds_error=False, fill_value='extrapolate')
    u_interp = interp1d(wind_pres, u_wind, kind=kind, bounds_error=False, fill_value=0.0)
    v_interp = interp1d(wind_pres, v_wind, kind=kind, bounds_error=False, fill_value=0.0)
    height_interp = interp1d(height_pres, height, kind=kind, bounds_error=False, fill_value='extrapolate')

    # Perform the interpolation
    # We'll call the new profile variables "standard"
    sounding['height'] = list(height_interp(interp_pressures))
    sounding['temperature'] = list(temp_interp(interp_pressures))
    sounding['dewpoint'] = list(dewp_interp(interp_pressures))
    sounding['u_wind'] = list(u_interp(interp_pressures))
    sounding['v_wind'] = list(v_interp(interp_pressures))
    sounding['pressure'] = list(interp_pressures)

    return sounding


def interpolate_by_height(sounding):
    ### Interpolation ###
    # We need to linearly interpolate all the variables to a set of height levels
    interp_heights = np.arange(0.0, 18000.0, 250.0)

    # Remove missing values
    missing_value = -9999.0
    pres_height, pres = remove_missing_values(sounding['height'], sounding['pressure'], missing_value)
    temp_height, temp = remove_missing_values(sounding['height'], sounding['temperature'], missing_value)
    dewp_height, dewp = remove_missing_values(sounding['height'], sounding['dewpoint'], missing_value)
    wind_height, u_wind = remove_missing_values(sounding['height'], sounding['u_wind'], missing_value)
    wind_height, v_wind = remove_missing_values(sounding['height'], sounding['v_wind'], missing_value)

    # Now we need to create the interpolators
    kind = 'cubic'  # interpolation type - see Scipy Interp1d documentation for options
    temp_interp = interp1d(temp_height, temp, kind=kind, bounds_error=False, fill_value='extrapolate')
    dewp_interp = interp1d(dewp_height, dewp, kind=kind, bounds_error=False, fill_value='extrapolate')
    u_interp = interp1d(wind_height, u_wind, kind=kind, bounds_error=False, fill_value=0.0)
    v_interp = interp1d(wind_height, v_wind, kind=kind, bounds_error=False, fill_value=0.0)
    pres_interp = interp1d(pres_height, pres, kind=kind, bounds_error=False, fill_value='extrapolate')

    # Perform the interpolation
    # We'll call the new profile variables "standard"
    sounding['pressure'] = list(pres_interp(interp_heights))
    sounding['temperature'] = list(temp_interp(interp_heights))
    sounding['dewpoint'] = list(dewp_interp(interp_heights))
    sounding['u_wind'] = list(u_interp(interp_heights))
    sounding['v_wind'] = list(v_interp(interp_heights))
    sounding['height'] = list(interp_heights)

    return sounding


def process_sounding(data_lines, station):
    sounding = {
        'pressure': [],
        'height': [],
        'temperature': [],
        'dewpoint': [],
        'u_wind': [],
        'v_wind': []
    }
    for line in data_lines:
        if "STID" in line:
            stid = get_stid(line)
            forecast_time = get_forecast_time(line)
        if "SLAT" in line:
            parts = line.split(" ")
            lat = float(parts[2])
            lon = float(parts[5])
        try:
            first = float(line.split(" ")[0])
            if isinstance(first, float):
                data = get_data(line)
                if len(data) > 2:
                    # These lines are structured like this: PRES TMPC TMWC DWPC THTE DRCT SKNT OMEG
                    sounding['pressure'].append(float(data[0]))
                    sounding['temperature'].append(float(data[1]))
                    sounding['dewpoint'].append(float(data[3]))
                    # Convert the wind data to U and V components.
                    wspd = float(data[6])
                    wdir = float(data[5])
                    u, v = wind_components(wspd, wdir)
                    sounding['u_wind'].append(u)
                    sounding['v_wind'].append(v)
                else:
                    # These lines are structured like this: CFRL HGHT
                    if len(sounding['height']) == 0:
                        sounding['height'].append(0.0)
                        elevation = float(data[1])
                    else:
                        sounding['height'].append(float(data[1]) - elevation)
        except:
            continue
    # Place the meta data in dict
    sounding["stid"] = station
    sounding["latitude"] = lat
    sounding["longitude"] = lon
    sounding["forecast_time"] = forecast_time

    # Do the interpolation by height
    sounding = interpolate_by_height(sounding)
    # Check for supersaturation
    sounding = supersat_check(sounding)

    # return
    return sounding


def write_to_json(sounding, save_path):
    station_id = sounding["stid"]
    forecast_hour = sounding["forecast_hour"]
    model_hour = sounding["model_run_hour"]
    save_name = f'{station_id}_{forecast_hour}.json'
    sounding_directory = os.path.join(save_path, f'{model}/{model_hour}/{station_id}')
    if not os.path.exists(sounding_directory):
        os.makedirs(sounding_directory)
    with open(os.path.join(sounding_directory, save_name), 'w') as fp:
        json.dump(sounding, fp)
    fp.close()
    #print(f'Saved file: {os.path.join(sounding_directory, save_name)}')

def retrieve_data(station, stid, model, model_run_hour, save_path):
    snd_length = 111  # Number of lines in an individual bufkit sounding
    forecast_hour = 0
    url = f'http://www.meteo.psu.edu/bufkit/data/{model.upper()}/{model_run_hour}/{model}_{stid.lower()}.buf'
    print(f'Trying URL: {url}')
    req = requests.get(url)
    soup = BS(req.text, "html.parser")
    # Split the soupy lines
    soup_lines = str(soup).split("\r\n")
    if len(soup_lines) == 1:
        # If the first URL is not correct, try an alternate
        url = f'http://www.meteo.psu.edu/bufkit/data/{model.upper()}/{model_run_hour}/{model}_{station.lower()}.buf'
        print(f'Trying URL: {url}')
        req = requests.get(url)
        soup = BS(req.text, "html.parser")
        # Split the soupy lines
        soup_lines = str(soup).split("\r\n")
    for i, line in enumerate(soup_lines):
        if "STID" in line:
            start = i
            end = start + snd_length
            sounding = process_sounding(soup_lines[start:end], station)
            sounding["forecast_hour"] = forecast_hour
            sounding["model_run_hour"] = model_run_hour
            # Write to dictionary
            write_to_json(sounding, save_path)
            forecast_hour = forecast_hour + 1

### Main ###
start = time.time()
now = DT.datetime.utcnow()
print(f'Starting at time {now}')
# The Penn State website usually contains the (Now - 2 Hours) version of the RAP
# (So at 01 UTC the 23 Z run is the latest available run.)
hour = now.hour - 2
if hour < 0:
    hour = (now.hour + 24) - 2
if hour < 10:
    hour = f'0{now.hour}'
else:
    hour = f'{hour}'

# Get the sounding locations
with open(sounding_locations_file) as json_file:
    data = json.load(json_file)
json_file.close()

count = 0
for station, value in data.items():
    stid = value[0]
    print(f'Retrieving bufkit soundings from {hour} UTC run of the {model} for station {station}.')
    try:
        retrieve_data(station, stid, model, hour, save_path)
        count = count + 1
    except:
        print(f'Failed to produce sounding for {stid}')

finish = time.time()
print(f'Total ellapsed time: {finish - start} seconds')
print(f'Collected a total of {count * 51} soundings.')
print(f'That is {(finish - start) / (count * 51)} seconds/sounding')