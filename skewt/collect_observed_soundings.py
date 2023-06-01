import numpy as np
from wy_html_sounding_to_json import get_sounding
from spc_sounding_to_json import get_spc_sounding
import time
import datetime as DT

#save_path = "/home/andrew/wxtest/wxtest/static/data/soundings/observed_soundings"
save_path = "/home/andrew/Python/observed_soundings/json"

station_list = {
	"ABR": [72659,45.455, -98.411],
	#"ALB": [72518,42.643785, -73.757991],
	"ABQ": [72365,35.068, -106.647],
	"AMA": [72363,35.217, -101.842],
	"BMX": [72230,33.495, -86.840],
	"BIS": [72764,46.771, -100.756],
	"RNK": [72318,37.264, -79.942],
	"BOI": [72681,43.587, -116.211],
	"BRO": [72250,25.899, -97.432],
	"BUF": [72528,42.876, -78.871],
	"CAR": [72712,46.873, -68.020],
	"MPX": [72649,45.021, -93.269],
	"CHS": [72208,32.816, -79.974],
	"CRP": [72251,27.782, -97.505],
	"DVN": [74455,41.515, -90.548],
	"DRT": [72261,29.37107, -100.91995],
	"DNR": [72469,39.753523, -104.996582],
	"DTX": [72632,42.343, -83.448],
	"DDC": [72451,37.753, -99.969],
	"EPZ": [72364,31.799, -106.365],
	"LKN": [72582,40.828545, -115.784040],
	"FGZ": [72376,35.202, -111.662],
	"FWD": [72249,32.834, -97.288],
	"APX": [72649,45.018719, -84.674250],
	"GGW": [72768,48.210, -106.619],
	"GJT": [72476,39.068, -108.533],
	"GYX": [74389,43.882, -70.331],
	"TFX": [72776,47.483, -111.351],
	"GRB": [72645,44.515421, -88.033703],
	"GSO": [72317,36.083, -79.792],
	"INL": [72747,48.56620, -93.40071],
	"JAN": [72235,32.269, -90.183],
	"JAX": [72206,30.346, -81.668],
	"KEY": [72201,24.553, -81.788],
	"LCH": [72240,30.209, -93.230],
	"LMN": [74646,36.60769, -97.48787],
	"VEF": [72388,36.085, -115.173],
	"ILX": [74560,40.139, -89.375],
	"LZK": [72340,34.773, -92.275],
	"MFR": [72597,43.367, -122.876],
	"MFL": [72202,25.753, -80.383],
	"MAF": [72265,32.025, -102.107],
	"BNA": [72327,36.127563, -86.685050],
	"LIX": [72233,30.276, -89.805],
	"MHX": [72305,34.7329, -76.65487],
	"OUN": [72357,35.180, -97.438],
	"LBF": [72562,41.135, -100.770],
	"OAK": [72493,37.826729, -122.422978],
	"OAX": [72558,41.247, -95.924],
	"ILN": [72426,39.42116, -83.82115],
	"WAL": [72402,37.843824, -75.479102],
	"VBG": [72393,34.73215, -120.57235],
	"OKX": [72501,40.863, -72.863],
	"TOP": [72456,39.063, -95.6308],
	"TBW": [72210,27.705, -82.401],
	"TLH": [72214,30.445742, -84.299276],
	"IAD": [72403,38.946, -77.455],
	"SGF": [72440,37.198816, -93.291232],
	"OTX": [72786,47.644, -117.432],
	"SHV": [72248,32.495, -93.667],
	"NKX": [72293,32.727535, -117.143298],
	"SLC": [72572,40.780, -111.965],
	"SLE": [72694,45.497847, -122.678831],
	"RIW": [72672,43.019, -108.385],
	"REV": [72489,39.516, -119.801],
	"UNR": [72662,44.071, -103.219],
	"UIL": [72797,47.596499, -122.330906],
	"PIT": [74626,40.431031, -80.003856],
	#"PSR": [74626,],
	"FFC": [72215,33.751, -84.366],
}

def create_request_date():
	now = DT.datetime.utcnow()
	if now.hour < 13: 
		hour = 0
	else: 
		hour = 12
	return now.year, now.month, now.day, hour

start = time.time()

year, month, day, hour = create_request_date()
# hour = 12
success = 0 
fail = 0 

### For Debugging ###
#station = "OUN"
#get_spc_sounding(2022,11,15,12,station,station_list[station][1],station_list[station][2],save_path)
#get_sounding(2022,11,15,12,station,station_list[station][0],save_path)

for name,info in station_list.items(): 
	print(f'Getting data for sounding {name}')
	#get_sounding(year,month,day,hour,name,info[0],save_path)
	try:
		#get_sounding(year,month,day,hour,name,info[1],info[2],save_path)
		get_spc_sounding(year,month,day,hour,name,info[1],info[2],save_path)
		success = success + 1
	except: 
		print(f'Warning: Something went wrong gathering data, grabbing from Uni. WY server.')
		try:
			get_sounding(year,month,day,hour,name,info[0],save_path)
			success = success + 1
		except: 
			print(f'Tried again, but failed. Either the sounding does not exist or something broke in the code')
			fail = fail + 1

end = time.time()
print("Complete.")
print(f'Elapsed time: {end-start} seconds.')
print(f'Pass/Fail percentages: {round(100.0*(success/(success+fail)),2)}% / {round(100.0*(fail/(success+fail)),2)}%')
print(f'This took {(end-start)/(success)} seconds/sounding.')