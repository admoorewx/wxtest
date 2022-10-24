import os
from django.shortcuts import render
# Create your views here.

def climo_plot(request):
    return render(request,"climo/plot.html",{})
