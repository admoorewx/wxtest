import folium
from folium.features import DivIcon
from branca.element import Element
from .awc_metar_retrieval import multipleMetars
from .wx_utilities import C2F, roundTime
import datetime
from string import Template
import numpy as np
import csv, os

def tempColor(temp):
    colors = [
        "darkviolet", # -60 to -20
        "indigo", # -19 to -10
        "navy", # -9 to 0
        "mediumblue", # 0 to 20
        "dodgerblue", # 21 to 32
        "teal", # 33 to 40
        "lightseagreen", # 40 to 50
        "mediumseagreen", # 50 to 60
        "green", # 60 to 70
        "gold", # 70 to 80
        "orange", # 80 to 90
        "firebrick", # 90 to 100
        "deeppink", # 100 to 110
        "fuchisa" #110+
    ]
    if temp <= -20:
        color = colors[0]
    elif temp > -20 and temp <= -10:
        color = colors[1]
    elif temp > -10 and temp <= 0:
        color = colors[2]
    elif temp > 0 and temp <= 20:
        color = colors[3]
    elif temp > 20 and temp <= 32:
        color = colors[4]
    elif temp > 32 and temp <= 40:
        color = colors[5]
    elif temp > 40 and temp <= 50:
        color = colors[6]
    elif temp > 50 and temp <= 60:
        color = colors[7]
    elif temp > 60 and temp <= 70:
        color = colors[8]
    elif temp > 70 and temp <= 80:
        color = colors[9]
    elif temp > 80 and temp <= 90:
        color = colors[10]
    elif temp > 90 and temp <= 100:
        color = colors[11]
    elif temp > 100 and temp <= 110:
        color = colors[12]
    elif temp > 110:
        color = colors[13]
    else:
        print("Warning: Could not find appropriate color!")
        color = "white"
    return color

def dewpColor(dewp):
    colors = [
        "chocolate", # below 20 F
        "sandybrown", # 20 to 30 F
        "goldenrod", # 30 to 40
        "olive", # 40 to 45
        "darkolivegreen", # 45 to 50
        "teal", # 50 to 55
        "limegreen", # 55 to 60
        "mediumseagreen", # 60 to 65
        "seagreen", # 65 to 70
        "green", # 70 to 75
        "blue", # 75 to 80
        "indigo" # 80+
    ]
    if dewp <= 20:
        color = colors[0]
    elif dewp > 20 and dewp <= 30:
        color = colors[1]
    elif dewp > 30 and dewp <= 40:
        color = colors[2]
    elif dewp > 40 and dewp <= 45:
        color = colors[3]
    elif dewp > 45 and dewp <= 50:
        color = colors[4]
    elif dewp > 50 and dewp <= 55:
        color = colors[5]
    elif dewp > 55 and dewp <= 60:
        color = colors[6]
    elif dewp > 60 and dewp <= 65:
        color = colors[7]
    elif dewp > 65 and dewp <= 70:
        color = colors[8]
    elif dewp > 70 and dewp <= 75:
        color = colors[9]
    elif dewp > 75 and dewp <= 80:
        color = colors[10]
    elif dewp > 80:
        color = colors[11]
    else:
        print("Warning: Could not find appropriate color!")
        color = "white"
    return color

def getMetarList(stationList):
    dirname = os.path.dirname(__file__)
    datafile = os.path.join(dirname,stationList+".csv")
    sites = []
    with open(datafile) as csv_file:
        csv_reader = csv.reader(csv_file,delimiter="\n")
        for row in csv_reader:
            sites.append(row[0])
    csv_file.close()
    return sites


def createMap(obDensity=0,stationList=None):

    try:
        if stationList == None:
            stationList = "CONUS"

        m = folium.Map(location=[40.,-100],
                       tiles="cartodbdark_matter",
                       zoom_start=5)

        radar_time = roundTime(datetime.datetime.utcnow(),300)
        if radar_time > datetime.datetime.utcnow():
            radar_time = radar_time - datetime.timedelta(seconds=300)
        radar_time = datetime.datetime.strftime(radar_time,"%Y-%m-%dT%H:%M:00Z")

        radar = folium.raster_layers.WmsTileLayer(
            url="https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q-t.cgi",
            layers='nexrad-n0q-wmst',
            fmt="image/png",
            transparent=True,
            name="CONUS Base Reflectivity",
            time=radar_time,
            opacity=0.35)


        radar_name = radar.layer_name
        html_string = f'''<p align="center" style="position:relative; right:30px; bottom:20px; font-size:15px;">{radar_name}</p>'''

        radar.add_to(m)
        folium.TileLayer('Stamen Toner').add_to(m)
        folium.TileLayer('openstreetmap').add_to(m)
        folium.LayerControl().add_to(m)

        radar_label = Template('''

                L.Control.textbox = L.Control.extend({
                  onAdd: function($map) {
                    var text = L.DomUtil.create('div');
                    text.id = "$layerID";
                    text.innerHTML = "<p id='$layerID' style='color: white; text-shadow: 1px 1px black; font-size:15px;'>$layerID</p>";
                    return text;
                  },
                  onRemove: function($map) {
                    // nothing?
                  }
                });
                L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
                L.control.textbox({position: 'bottomright'}).addTo($map);
        ''')
        radar_label = radar_label.safe_substitute({
            'map': m.get_name(),
            'layerID': radar_name
        })


        # Get the HTML from the Folium Map
        html = m.get_root().render().splitlines()

        # Javascript lines that need to be added into the HTML in certain locations
        jsend = '</script>'

        # Remove the old </script> tag so we can add in additional lines
        html = html[:-1]
        # add in the clock JS
        html.append(radar_label)
        # add in the final </script> tag
        html.append(jsend)

        # Write the HTML code to an HTML file
        basedir = os.path.dirname(__file__)
        filepath = os.path.abspath(os.path.join(basedir, "..", "standard_map.html"))
        htmlfile = open(filepath,'w')
        for line in html:
            htmlfile.write(line+"\n")
        htmlfile.close()
        #m.save("folium.html")
        return True # send a signal that map creation was successful
    except:
        return False # send a signal that map creation failed.

