import requests
import numpy as np
import json, time, os
from math import sin, cos, radians
from bs4 import BeautifulSoup as BS
from scipy.interpolate import interp1d

def stringify(value):
	if value < 10:
		string_value = f'0{value}'
	else:
		string_value = str(value)
	return string_value

def retrieve_float(items):
	target = None
	for item in items: 
		try:
			target = float(item)
		except: 
			continue
	return target

def wind_components(wspd,wdir):
	wdir = 270.0 - wdir 
	if wdir < 0.0: 
		wdir = wdir + 360.0
	u = wspd * cos(radians(wdir))
	v = wspd * sin(radians(wdir))
	return u, v

def find_param(param,line,fill_value):
	if param in line:
		split = [item.strip() for item in line.split(" ")]
		if split[0] == f'{param}:':
			value = retrieve_float(split)
	return value

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

def get_spc_sounding(year,month,day,hour,station_id,latitude,longitude,save_path):
	"""
	The requested data comes in this format: 
	Pressure (hPa) Height (m) Temperature (C) Dewpoint (C) Relh (%) MIXR (g/kg) Direction (deg) Wind Speed (knot) ThetaA (K) ThetaE (K) ThetaV (K)
	For now we're just collecting pressure, height, temperature, dewpoint, wind speed/direction (which will be converted to U/V comp.).
	"""
	fill_value = -9999.0

	sounding = {
		'datetime': f'{month}/{day}/{year} {hour}',
		'id': station_id,
		'pressure': [],
		'height': [],
		'temperature': [],
		'dewpoint': [],
		'u_wind': [],
		'v_wind': []
	}

	url = f'https://www.spc.noaa.gov/exper/soundings/{str(year)[2:]}{stringify(month)}{stringify(day)}{stringify(hour)}_OBS/{station_id}.txt'
	#print(url)
	req = requests.get(url)
	soup = BS(req.text, "html.parser")
	# Split the soupy lines
	soup_lines = str(soup).split("\n")
	read = False
	for line in soup_lines:
		if "%END%" in line:
			read = False
		if read:
			line_parts = [float(item.strip()) for item in line.split(",")] 
			# 11/1/2022 - Adding in a check here to not add any data above 100 mb. 
			# This is due to the missing data issue in the MROS (?) sounding software
			# that often causes crazy behaviour. We don't care above anything above 100 mb anyway.
			if line_parts[0] >= 100.0 and line_parts[2] > -1000.0: 
				sounding['pressure'].append(line_parts[0])
				sounding['temperature'].append(line_parts[2])
				sounding['dewpoint'].append(line_parts[3])
				# Convert winds to U/V components
				if line_parts[4] >= 0.0 and line_parts[5] >= 0.0:
					u, v = wind_components(line_parts[5],line_parts[4])
					sounding['u_wind'].append(u)
					sounding['v_wind'].append(v)
				else: 
					sounding['u_wind'].append(-9999.0)
					sounding['v_wind'].append(-9999.0)
				# Convert height in MSL to AGL
				if len(sounding['height']) == 0: 
					sounding['height'].append(0.0)
					base_height = line_parts[1]
				else: 
					sounding['height'].append((line_parts[1] - base_height))
		if "%RAW%" in line:
			read = True

	# Remove the first value from each variable if sfc pressure < 1000.0 mb, as this is the interpolation down to 1000 mb, 
	# which we don't really want. 
	# if sounding['pressure'][0] <= 1000.0:
	# 	sounding['pressure'].pop(0)
	# 	sounding['height'].pop(0)
	# 	sounding['temperature'].pop(0)
	# 	sounding['dewpoint'].pop(0)
	# 	sounding['u_wind'].pop(0)
	# 	sounding['v_wind'].pop(0)

	# Interpolate to fill in missing obs 
	sounding = interpolate_by_height(sounding)

	# Save the data
	save_path = os.path.join(save_path,f'{stringify(hour)}')
	if not os.path.exists(save_path):
			os.makedirs(save_path)
	save_path = os.path.join(save_path,f'{station_id}.json')
	with open(save_path,'w') as fp:
		json.dump(sounding,fp)
	fp.close()	