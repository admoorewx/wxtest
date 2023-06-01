import numpy as np 
import json 
import os
from math import radians, cos, sin, asin, sqrt

locations_file_path = "/home/andrew/Python/metar_locations.txt"
bufkit_locations_path = "/home/andrew/Python/bufkit_rap_locations.txt"
save_path = "/home/andrew/wxtest/wxtest/static/data/soundings"

remove_every = 2
min_distance = 80.0 # km
stations = {}

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles. Determines return value units.
    return c * r

def parse_bufkit_file(filepath):
	stations = []
	with open(filepath) as f: 
		lines = f.readlines()
		for line in lines: 
			line_parts = line.split(" ")
			if len(line_parts) > 1: 
				for part in line_parts: 
					if "alt" in part: 
						split = part.split("/")
						stations.append(split[1][0:-1])
	return stations


bufkit_stations = parse_bufkit_file(bufkit_locations_path)
with open(locations_file_path) as f:
	lines = f.readlines()
	for line in lines: 
		line_parts = line.split(' ')
		real_inds = np.where(np.asarray(line_parts) != '')[0]
		line_parts = [line_parts[ind] for ind in real_inds]
		try:
			if line_parts[3][0] == "K":
				if len(line_parts[3]) == 4:
					if "N" in line_parts[6]:
						deg_lat = line_parts[5]
						min_lat = line_parts[6][:-1]
					elif "N" in line_parts[5]: 
						deg_lat = line_parts[4]
						min_lat = line_parts[5][:-1]
					else: 
						deg_lat = line_parts[6]
						min_lat = line_parts[7][:-1]
					if "W" in line_parts[8]:
						deg_lon = line_parts[7]
						min_lon = line_parts[8][:-1]
					elif "W" in line_parts[7]: 
						deg_lon = line_parts[6]
						min_lon = line_parts[7][:-1]
					else: 
						deg_lon = line_parts[8]
						min_lon = line_parts[9][:-1]

					latitude = float(deg_lat) + (float(min_lat)/60.0)
					longitude = -1.0 * (float(deg_lon) + (float(min_lon)/60.0))

					# Check to make sure that this is a valid bufkit location 
					if line_parts[3] in bufkit_stations or line_parts[3][1:] in bufkit_stations:
						if latitude < 50.0 and latitude > 23.0: 
							if longitude < -60.0 and longitude > -125.0: 
								# Check to make sure this isn't near any other points already in the dict
								valid = True
								for key,values in stations.items():
									distance = haversine(longitude,latitude,values[2],values[1])
									if distance < min_distance:
										valid = False 
										break 
								if valid: 
									station_id = line_parts[3]
									stations[station_id[1:]] = [station_id,latitude,longitude]
		except:
			continue
	
print(len(stations))
with open(os.path.join(save_path,'forecast_locations.json'),'w') as fp:
	json.dump(stations,fp)
fp.close()