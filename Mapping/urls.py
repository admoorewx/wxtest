"""wxtest URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import create_standard_map,display_standard_map, display_cim, display_outlook_practice, display_outlook_fire, display_wim, display_spc_verif


urlpatterns = [
    path('wxmap/', display_standard_map),
    path('cim/', display_cim),
    path('wim/', display_wim),
    path('outlook/',display_outlook_practice),
    path('outlook_fire/',display_outlook_fire),
    path('spc-verif/',display_spc_verif),
]
