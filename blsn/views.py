import os
from bs4 import BeautifulSoup
from django.shortcuts import render
# Create your views here.
# Pretty simple views.py script.
# Just return the blowing snow html site since it
# can stand on it's own.
def blowingSnowTable(request):
    basedir = os.path.dirname(__file__)
    #blsn_model = os.path.join(basedir + "\blsn_model.js")
    # blsn_model = "javascript/blsn_model.js"
    # context = {
    #     "model_script": blsn_model,
    # }
    return render(request,"blsn/blsn_site.html",{})
