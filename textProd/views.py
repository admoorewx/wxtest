import os
from django.shortcuts import render
# Create your views here.

def display_text_products(request):
    return render(request,"textProd/textprod.html",{})
