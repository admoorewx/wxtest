from django.contrib import admin
from django.urls import path
from .views import blowingSnowTable


urlpatterns = [
    path('table/', blowingSnowTable),
]