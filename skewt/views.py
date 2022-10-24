import os
from django.shortcuts import render
# Create your views here.

def sounding_plot(request):
    return render(request,"skewt/plot.html",{})
