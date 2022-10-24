"""
Django settings for wxtest project.

Generated by 'django-admin startproject' using Django 3.1.2.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
#BASE_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STATIC_ROOT = os.path.join(BASE_DIR,'static')
STATIC_URL = '/static/'

STATICFILES_DIRS = [
    os.path.join(STATIC_ROOT,'javascript'),
    os.path.join(STATIC_ROOT,'csv'),
    os.path.join(STATIC_ROOT,'css'),
    os.path.join(STATIC_ROOT,'data'),
    os.path.join(STATIC_ROOT,'geo'),
    os.path.join(STATIC_ROOT,'media'),
    os.path.join(STATIC_ROOT,'shell'),
    os.path.join(STATIC_ROOT,'forecasts'),
]

# STATICFILES_DIRS = [
#     os.path.join(BASE_DIR,'javascript'),
# ]

# MEDIA_ROOT = os.path.join(BASE_DIR,'/stat/media/')
# MEDIA_URL = '/media/'
#
# GEO_ROOT = os.path.join(BASE_DIR,'/stat/geo/')
# GEO_URL = '/geo/'
#
# JS_ROOT = os.path.join(BASE_DIR,'static\javascript')
# JS_URL = '/javascript/'

MAPPING_ROOT = os.path.join(BASE_DIR,'Mapping')
MAPPING_URL = '/Mapping/'

BLSN_ROOT = os.path.join(BASE_DIR,'/stat/blsn/')
BLSN_URL = '/blsn/'

SIMPSAT_ROOT = os.path.join(BASE_DIR,'simpleSat')
SIMPSAT_URL = '/simpleSat/'

TEXT_ROOT = os.path.join(BASE_DIR,'textProd')
TEXT_URL = '/textProd/'

STATMAP_ROOT = os.path.join(BASE_DIR,'statMap')
STATMAP_URL = '/statMap/'

CLIMO_ROOT = os.path.join(BASE_DIR,'climo')
CLIMO_URL = '/climo/'

CLIMO_ROOT = os.path.join(BASE_DIR,'skewt')
CLIMO_URL = '/skewt/'

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '3=i+19d%_1&5nhojge!!2*=l5fnn!24yswuzohm&h#)_2et-2u'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'Metar',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'wxtest.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR),"templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'wxtest.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR,'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/