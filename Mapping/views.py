import os
from django.shortcuts import render
from Mapping.utils.folium_interactive import createMap
import Mapping.utils.wx_utilities as wxutil
# Create your views here.
def create_standard_map(request):

    result = createMap(0,"CONUS")
    basedir = os.path.dirname(__file__)
    if result: # if the plot is successfully created
        filepath = os.path.join(basedir + "\standard_map.html")
        with open(filepath,'r') as fp:
            html = fp.read()
    else:
        html = "<p> Error Creating Map...</p>"

    context = {
        'map_html': html,
    }

    return render(request,"Mapping/wxmap.html",context)


def display_standard_map(request):
    sitelist = wxutil.getMetarList("CONUS")#[::2] # For now, just do CONUS and filter the obs so it's not too much
    context = {
        "site_list": sitelist,
    }
    return render(request,"Mapping/wxmap.html",context)

def display_cim(request):
    sitelist = wxutil.getMetarList("CONUS")
    context = {
        "site_list": sitelist,
    }
    return render(request,"Mapping/cim.html",context)

def display_outlook_practice(request):
    context = {}
    return render(request,"Mapping/outlook.html",context)

def display_outlook_fire(request):
    context = {}
    return render(request,"Mapping/outlook_fire.html",context)

def display_wim(request):
    sitelist = wxutil.getMetarList("CONUS")
    context = {
        "site_list": sitelist,
    }
    return render(request,"Mapping/wim.html",context)

def display_spc_verif(request):
    context = {}
    return render(request,"Mapping/spc_verif.html",context)
