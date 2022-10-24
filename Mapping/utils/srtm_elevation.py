
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import PIL.Image

PIL.Image.MAX_IMAGE_PIXELS = 240000000
geo_image = "H:/Python/wxtest/static/geo/elevation/HYP_HR_SR_OB_DR.tif"
img = plt.imread(geo_image)
img_extent = [-180.0,180.0,-90,90]

fig = plt.figure(figsize=(12, 12))
ax = plt.axes(projection=ccrs.PlateCarree())
ax.imshow(img, origin='upper', extent=img_extent, transform=ccrs.PlateCarree())
ax.set_extent([-126, -65, 22, 50],crs=ccrs.PlateCarree())

plt.show()

