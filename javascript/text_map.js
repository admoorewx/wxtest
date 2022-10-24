var map = L.map("map").setView([40.0, -96.0], 4);
var osmAttribution ='Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
var leafletRadarAttribution ='<a href="https://github.com/rwev/leaflet-radar">Radar</a>';

L.tileLayer(
        "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        {
                attribution: [
                    osmAttribution,
                    leafletRadarAttribution
                ].join(" | ")
        }
).addTo(map);

var cirlceSize = 50000.0 //meters
var opacity = 0.75
var circColor = "blue"
var fillCol = "blue"


var location_markers = new L.featureGroup();
$.ajax({
dataType: "json",
url: "{% static 'csv/wfos.json' %}",
success: function(data) {
    $(data.features).each(function(key, data) {
        addCircleMarker(data);
        //addMETARText(key);
    });
}
}).error(function() {});


function addCircleMarker(lat,lon){
  var marker = new L.circleMarker([lat, lon], { radius: 9, color: circColor, weight: 2, opacity: 1.0, fillColor: fillCol, fillOpacity: 0.75 });
  marker.addTo(surface_stations);
}

function addMETARText(latitude,longitude,text){
  var textmarker = new L.marker([latitude, longitude], { opacity: 0.0 });
  textmarker.on('mouseover', function(){
    document.getElementById("metardata").innerHTML = text;
  });
  textmarker.on('mouseout', function(){
    document.getElementById("metardata").innerHTML = "";
  });
  textmarker.addTo(surface_stations);
}

/// Markers
// var KEY = L.circle([24.553, -81.788], {
//     color: circColor ,
//     fillColor: fillCol,
//     fillOpacity: opacity,
//     radius: cirlceSize,
//     src: "KEY"
// }).on('click', function() {
//   document.getElementById("currentOffice").innerHTML = "Current Office: KEY";
//   getProductID()
// }).addTo(map);
