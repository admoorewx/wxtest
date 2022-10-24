import os
from django.shortcuts import render
import Mapping.utils.wx_utilities as wxutil
# Create your views here.

def display_standard_map(request):
    sitelist = wxutil.getMetarList("CONUS")
    context = {
        "site_list": sitelist,
    }
    return render(request,"simpleSat/simple_sat.html",context)
