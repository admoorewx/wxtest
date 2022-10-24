import os
from bs4 import BeautifulSoup
from django.shortcuts import render
import Mapping.utils.wx_utilities as wxutil
# Create your views here.


def display_home(request):
    return render(request,"statMap/index.html",{})

def display_surface(request):
    return render(request, "statMap/surface_charts.html",{})

def display_fire(request):
    sitelist = wxutil.getMetarList("CONUS")#[::2] # For now, just do CONUS and filter the obs so it's not too much
    context = {
        "site_list": sitelist,
    }
    return render(request, "statMap/fire.html",context)
