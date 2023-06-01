import requests
import json, time, os
import numpy as np
from math import sin, cos, radians
from bs4 import BeautifulSoup as BS
from scipy.interpolate import interp1d

def wind_components(wspd,wdir):
	wdir = 270.0 - wdir 
	if wdir < 0.0: 
		wdir = wdir + 360.0
	u = wspd * cos(radians(wdir))
	v = wspd * sin(radians(wdir))
	return u, v

def remove_missing_values(x,y,missing_value):
	new_x = []
	new_y = []
	for i,value in enumerate(y): 
		if value != missing_value: 
			new_x.append(x[i])
			new_y.append(value)
	return new_x,new_y


def interpolate_by_pressure(sounding):
	### Interpolation ###
	# We need to linearly interpolate all the variables to a set of pressure levels 
	if sounding['pressure'][0] > 1000.0: 
		interp_pressures = [sounding['pressure'][0]] + list(np.arange(1000.0,50.0,-25.0))
	else: 
		interp_pressures = list(np.arange(1000.0,50.0,-25.0))

	# Remove missing values 
	missing_value = -9999.0
	height_pres, height = remove_missing_values(sounding['pressure'],sounding['height'],missing_value)
	temp_pres, temp = remove_missing_values(sounding['pressure'],sounding['temperature'],missing_value)
	dewp_pres, dewp = remove_missing_values(sounding['pressure'],sounding['dewpoint'],missing_value)
	wind_pres, u_wind = remove_missing_values(sounding['pressure'],sounding['u_wind'],missing_value)
	wind_pres, v_wind = remove_missing_values(sounding['pressure'],sounding['v_wind'],missing_value)

	# Now we need to create the interpolators
	kind = 'cubic' # interpolation type - see Scipy Interp1d documentation for options
	temp_interp = interp1d(temp_pres,temp,kind=kind,bounds_error=False,fill_value='extrapolate')
	dewp_interp = interp1d(dewp_pres,dewp,kind=kind,bounds_error=False,fill_value='extrapolate')
	u_interp = interp1d(wind_pres,u_wind,kind=kind,bounds_error=False,fill_value=0.0)
	v_interp = interp1d(wind_pres,v_wind,kind=kind,bounds_error=False,fill_value=0.0)
	height_interp = interp1d(height_pres,height,kind=kind,bounds_error=False,fill_value='extrapolate')

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
	interp_heights = np.arange(0.0,18000.0,250.0)

	# Remove missing values 
	missing_value = -9999.0
	pres_height, pres = remove_missing_values(sounding['height'],sounding['pressure'],missing_value)
	temp_height, temp = remove_missing_values(sounding['height'],sounding['temperature'],missing_value)
	dewp_height, dewp = remove_missing_values(sounding['height'],sounding['dewpoint'],missing_value)
	wind_height, u_wind = remove_missing_values(sounding['height'],sounding['u_wind'],missing_value)
	wind_height, v_wind = remove_missing_values(sounding['height'],sounding['v_wind'],missing_value)

	# Now we need to create the interpolators
	kind = 'cubic' # interpolation type - see Scipy Interp1d documentation for options
	temp_interp = interp1d(temp_height,temp,kind=kind,bounds_error=False,fill_value='extrapolate')
	dewp_interp = interp1d(dewp_height,dewp,kind=kind,bounds_error=False,fill_value='extrapolate')
	u_interp = interp1d(wind_height,u_wind,kind=kind,bounds_error=False,fill_value=0.0)
	v_interp = interp1d(wind_height,v_wind,kind=kind,bounds_error=False,fill_value=0.0)
	pres_interp = interp1d(pres_height,pres,kind=kind,bounds_error=False,fill_value='extrapolate')

	# Perform the interpolation
	# We'll call the new profile variables "standard"
	sounding['pressure'] = list(pres_interp(interp_heights))
	sounding['temperature'] = list(temp_interp(interp_heights))
	sounding['dewpoint'] = list(dewp_interp(interp_heights))
	sounding['u_wind'] = list(u_interp(interp_heights))
	sounding['v_wind'] = list(v_interp(interp_heights))
	sounding['height'] = list(interp_heights)

	return sounding

def get_sounding(year,month,day,hour,station_id,station_number,save_path):
	"""
	The requested data comes in this format: 
	Pressure (hPa) Height (m) Temperature (C) Dewpoint (C) Relh (%) MIXR (g/kg) Direction (deg) Wind Speed (knot) ThetaA (K) ThetaE (K) ThetaV (K)
	For now we're just collecting pressure, height, temperature, dewpoint, wind speed/direction (which will be converted to U/V comp.).
	"""
	sounding = {
		'id': station_id,
		'datetime': f'{month}/{day}/{year} {hour}',
		'pressure': [],
		'height': [],
		'temperature': [],
		'dewpoint': [],
		'u_wind': [],
		'v_wind': []
	}

	if hour < 10:
		hour_string = f'0{hour}'
	else: 
		hour_string = hour 
	# TEMP URL - This is faster and cleaner, but slightly less data resolution
	url = f'http://weather.uwyo.edu/cgi-bin/sounding?region=naconf&TYPE=TEXT%3ALIST&YEAR={year}&MONTH={month}&FROM={day}{hour_string}&TO={day}{hour_string}&STNM={station_number}'

	#print(f'\n{url}\n')
	# BUFR URL - This has better data resolution, but is slower and can have several weird errors.
	#url = f'http://weather.uwyo.edu/cgi-bin/bufrraob.py?datetime={year}-{month}-{day}%20{hour}:00:00&id={station_number}&type=TEXT:LIST'

	req = requests.get(url)
	soup = BS(req.text, "html.parser")
	raw_text_data = soup.find_all("pre")
	sounding_text = raw_text_data[0]
	sounding_meta = raw_text_data[1]
	# Parse the raw sounding text data first
	raw_text_data = str(sounding_text).split("\n")
	ignore = 4 # number of lines in the header and the first pressure level, which we want to ignore
	for i,line in enumerate(raw_text_data[0:-1]): 
		if i > ignore: 
			parsed_line = []
			line = [item.strip() for item in line.split(" ")]
			for item in line: 
				try: 
					parsed_line.append(float(item))
				except:
					continue
			if len(parsed_line) == 11: # This avoids reading lines with missing values (mainly at the very end).
				sounding['pressure'].append(parsed_line[0])
				sounding['temperature'].append(parsed_line[2])
				sounding['dewpoint'].append(parsed_line[3])
				# Convert winds to U/V components
				u, v = wind_components(parsed_line[7],parsed_line[6])
				sounding['u_wind'].append(u)
				sounding['v_wind'].append(v)
				# Convert height in MSL to AGL
				if len(sounding['height']) == 0: 
					sounding['height'].append(0.0)
					base_height = parsed_line[1]
				else: 
					sounding['height'].append((parsed_line[1] - base_height))
	# Parse the meta data second
	# Here are the lines we're after: 
	raw_meta_data = np.asarray(str(sounding_meta).split("\n"))
	#raw_meta_data = raw_meta_data[inds]
	parsed_line = []
	for i,line in enumerate(raw_meta_data):
		# if "Station identifier" in line:
		# 	print(line)
		# if "Observation time" in line:
		# 	print(line)
		if "latitude" in line: 
			line = [item.strip() for item in line.split(" ")]
			for item in line: 
				try: 
					sounding["lat"] = float(item)
				except:
					continue
		if "longitude" in line: 
			line = [item.strip() for item in line.split(" ")]
			for item in line: 
				try: 
					sounding["lon"] = float(item)
				except:
					continue
		if "elevation" in line: 
			line = [item.strip() for item in line.split(" ")]
			for item in line: 
				try: 
					sounding["elevation"] = float(item)
				except:
					continue
	# perform interpolation 
	sounding = interpolate_by_height(sounding)

	# Save the data
	save_path = os.path.join(save_path,f'{hour_string}')
	if not os.path.exists(save_path):
			os.makedirs(save_path)
	save_path = os.path.join(save_path,f'{station_id}.json')
	with open(save_path,'w') as fp:
		json.dump(sounding,fp)
	fp.close()	