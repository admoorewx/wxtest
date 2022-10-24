////////////////////////////////////////////////////////////////////////////////
function currentTime() {
  time = new Date();
  if (time.getSeconds() < 10) {
    seconds = "0"+time.getSeconds().toString();
  } else {
    seconds = time.getSeconds().toString();
  }
  result = formatTime(time);
  result = result.substring(0,(result.length-3))+seconds+" UTC";
  validTime = radarTime();

  obj = document.getElementById('clock');
  obj.innerHTML = "Current Time: "+result;
}
////////////////////////////////////////////////////////////////////////////////
function return_hazard_color(hazard){
  let color = "#d9b11d";
  try {
    if (hazard.feature.properties.event.includes("Severe")){
      //color = "#0032ff"; // blue
      color = "#ffec00"; // yellow
    } else if (hazard.feature.properties.event.includes("Tornado")){
      color = "#df1717";
    } else if (hazard.feature.properties.event.includes("Marine")){
      color = "#17dfdf";
    } else if (hazard.feature.properties.event.includes("Flood")){
      color = "#3eff05";
    } else {
      color = "#d9b11d";
    }
  }
  catch {
    if (hazard.properties.event.includes("Severe")){
      //color = "#0032ff"; // blue
      color = "#ffec00"; // yellow
    } else if (hazard.properties.event.includes("Tornado")){
      color = "#df1717";
    } else if (hazard.properties.event.includes("Marine")){
      color = "#17dfdf";
    } else if (hazard.properties.event.includes("Flood")){
      color = "#3eff05";
    } else {
      color = "#d9b11d";
    }
  }
  return color;
}
////////////////////////////////////////////////////////////////////////////////
function datetime_to_epoch(datetime_string){
  // Expects a datetime string in the format:
  // 2022-07-02T20:30:00-06:00
  var year = datetime_string.substring(0,4);
  var month = parseInt(datetime_string.substring(5,7)) - 1;
  var day = datetime_string.substring(8,10);
  var hour = datetime_string.substring(11,13);
  var minute = datetime_string.substring(14,16);
  // var datetime = new Date(year,month,day,hour,minute);
  var datetime = new Date(datetime_string);
  return datetime.getTime();
}
////////////////////////////////////////////////////////////////////////////////
function getNWSHeadlines(timedelta){
  // Retrieves all NWS products issued within a certain time limit.
  // The time limit is set by the timedelta parameter, more specifically,
  // this function looks for products issued in the past (now-timedelta) hours.
  timedelta = timedelta * 1000.0; // convert to milliseconds
  var headline_strings = [];
  var url = "https://api.weather.gov/alerts/active?status=actual";
  var request = new XMLHttpRequest();
  request.open("GET",url, false);
  request.send(null);
  data = JSON.parse(request.response);
  products = data.features;
  products.forEach(function(product){
    let issuance_time = product.properties.effective;
    let issuance_datetime = datetime_to_epoch(issuance_time);
    let current_datetime = new Date().getTime();
    let diff = current_datetime - issuance_datetime;
    if (diff <= timedelta){
      let headline = product.properties.headline;
      let description = product.properties.description;
      let event_string = `${headline}: ${description}`;
      headline_strings.push(event_string);
    }
  });
  return headline_strings;
}
////////////////////////////////////////////////////////////////////////////////
function updateCrawlerText(timedelta){
  const TIME_PER_HEADLINE = 120*1000; // milliseconds - time to read each headline.
  var headlines = getNWSHeadlines(timedelta);
  // performs the actual update of the messaage/crawler string.
  var crawler_string = "";
  let color = "#C9C9C9";
  if (headlines.length == 0){
    crawler_string = "No Active NWS Alerts..."
  } else {
    headlines.forEach(function(headline){
      // get the appropriate text color
      if (headline.includes("Tornado")){
        color = "#E23939";
      } else if (headline.includes("Severe")){
        color = "#FFF344";
      } else if (headline.includes("Flash flood")){
        color = "#00FF3C";
      } else if (headline.includes("Flood")){
        color = "#32B250";
      } else if (headline.includes("Winter")){
        color = "#00D5FF";
      } else if (headline.includes("Ice")){
        color = "#FF49FA";
      } else if (headline.includes("Blizzard")){
        color = "#FF49FA";
      } else if (headline.includes("Special Marine")){
        color = "#03F8FF";
      } else if (headline.includes("Heat")){
        color = "#FFAF68";
      } else if (headline.includes("Excessive")){
        color = "#F38AA2";
      } else if (headline.includes("Dense fog")){
        color = "#9D9EBA";
      } else if (headline.includes("Red")){
        color = "#FF81FF";
      } else if (headline.includes("Special Weather")){
        color = "#F9D3B2";
      } else {
        color = "#C9C9C9";
      }
      crawler_string = crawler_string + `<font color=${color}>${headline}</font>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
    });
  }
  // set the speed of the animation
  var message = document.getElementById("news_message");
  var duration = (TIME_PER_HEADLINE * headlines.length);
  console.log(duration);
  message.animate([
    { transform: 'translateX(0)'},
    { transform: 'translateX(-300%)'},
  ],{
    duration: duration,
    easing: "linear",
    iterations: Infinity,
  });
  message.innerHTML = crawler_string;
  console.log(`Updated crawler, there were ${headlines.length} headlines.`);
}
////////////////////////////////////////////////////////////////////////////////
function rotateImages(){
  const ROTATION_SPEED = 6; // seconds
  var image_div = document.getElementById("display_slide");
  var image_urls = [
    "https://www.spc.noaa.gov/products/outlook/day1otlk.gif",
    "https://www.spc.noaa.gov/products/fire_wx/day1otlk_fire.gif",
    "https://www.wpc.ncep.noaa.gov/qpf/94ewbg.gif",
    "https://www.wpc.ncep.noaa.gov/wwd/day1_psnow_gt_04_conus.gif",
    "https://www.nhc.noaa.gov/xgtwo/two_atl_5d0.png",
    "https://forecast.weather.gov/wwamap/png/US.png",
  ]
  var i = 0;
  setInterval(function(){
    image_div.src = image_urls[i];
    i++;
    if (i >= image_urls.length){
      i = 0;
    }
  },ROTATION_SPEED*1000);
  // for (i=0; i<image_urls.length;i++){
  //   image_div.src = image_urls[i];
  //   setTimeout(function(){
  //     console.log(url);
  //   }, 5*1000);
  // }
}
////////////////////////////////////////////////////////////////////////////////
function C2F(degC){
  return (9.0/5.0) * degC + 32.0;
}
////////////////////////////////////////////////////////////////////////////////
function roundTo(n, digits) {
  // I stole this from here: https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
  if (digits === undefined) {
    digits = 0;
  }

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  var test =(Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
}
////////////////////////////////////////////////////////////////////////////////
function kph2mph(kph){
  // convert kilometers/hour to miles/hour.
  return kph * 0.6213712;
}
////////////////////////////////////////////////////////////////////////////////
function meter2mile(meter){
  return meter * 0.0006213712;
}
////////////////////////////////////////////////////////////////////////////////
function meter2feet(meter){
  return meter * 3.28084;
}
////////////////////////////////////////////////////////////////////////////////
function retrieveASOS(stid){
  if (stid.length < 4){
    window.alert(`Warning: ${stid} may not be a valid station identifier. Local Wx obs may not display.`)
  } else {
    // reset all colors
    document.getElementById("relh").style.color = "#FFFFFF";
    document.getElementById("temp").style.color = "#FFFFFF";
    document.getElementById("wind").style.color = "#FFFFFF";
    document.getElementById("gust").style.color = "#FFFFFF";
    document.getElementById("visb").style.color = "#FFFFFF";
    document.getElementById("dewp").style.color = "#FFFFFF";

    var url = `https://api.weather.gov/stations/${stid}/observations/latest`;
    var request = new XMLHttpRequest();
    request.open("GET",url, false);
    request.send(null);
    data = JSON.parse(request.response);
    if (data.properties.presentWeather.length == 0){
      present_wx = "None";
    } else {
      present_wx = "";
      data.properties.presentWeather.forEach(function(wx){
        var intensity = wx.intensity;
        var weather = wx.weather;
        present_wx = present_wx + `${intensity} ${weather}&nbsp;&nbsp;`;
      });
    }
    document.getElementById("current_wx").innerHTML = present_wx;

    var temp = data.properties.temperature.value;
    if (temp == null){
      document.getElementById("temp").innerHTML = "Not Available";
      document.getElementById("dewp").innerHTML = "Not Available";
      document.getElementById("relh").innerHTML = "Not Available";
    } else {
      document.getElementById("temp").innerHTML = `${roundTo(C2F(data.properties.temperature.value),1)} F`;
      document.getElementById("temp").style.color = tempColor(C2F(data.properties.temperature.value));
      document.getElementById("dewp").innerHTML = `${roundTo(C2F(data.properties.dewpoint.value),1)} F`;
      document.getElementById("dewp").style.color = dewpColor(C2F(data.properties.dewpoint.value));
      document.getElementById("relh").innerHTML = `${roundTo(data.properties.relativeHumidity.value,1)} %`;
      document.getElementById("relh").style.color = relhColor(data.properties.relativeHumidity.value);
    }
    // wind speed/direction
    var wspd = roundTo(kph2mph(data.properties.windSpeed.value),1);
    var wdir = data.properties.windDirection.value;
    document.getElementById("wind").innerHTML = `${wspd} mph @ ${wdir} deg`;
    document.getElementById("gust").innerHTML = `${roundTo(kph2mph(data.properties.windGust.value),1)} mph`;
    document.getElementById("wind").style.color = windColor(wspd);
    document.getElementById("gust").style.color = windColor(kph2mph(data.properties.windGust.value));

    // visibility
    var visb = data.properties.visibility.value;
    if (visb == null){
      document.getElementById("visb").innerHTML = "Not Available";
    } else {
      document.getElementById("visb").innerHTML = `${roundTo(meter2mile(visb),1)} mi`;
      document.getElementById("visb").style.color = visbColor(visb);
    }
    // cloud conditions
    cloud_layers = data.properties.cloudLayers;
    if (cloud_layers.length > 0){
      cloud_string = "";
      cloud_layers.forEach(function(layer){
        cover = layer.amount;
        height = roundTo(meter2feet(layer.base.value),0);
        cloud_string = cloud_string + `${cover} ${height} ft&nbsp;&nbsp;`
      })
    } else {
      cloud_string = "Not Available";
    }

    document.getElementById("sky").innerHTML = cloud_string;
    document.getElementById("current_station").innerHTML = `Current Conditions at ${stid.toUpperCase()}`;
  } // end else
}
////////////////////////////////////////////////////////////////////////////////
function tempColor(temp){
  colors = ["#ff33e9","#d733ff", "#7a33ff", "#3383ff","#33ffe9","#33ff77","#6eff33","#caff33","#f6ff33","#ffca33","#ff3f33","#d133ff","#ff33ec"];
  if (temp <= -20){
    return colors[0];
  }
  else if (temp > -20 && temp <= 0.0) {
    return colors[1];
  }
  else if (temp > 0.0 && temp <= 20.0) {
    return colors[2];
  }
  else if (temp > 20.0 && temp <= 32.0) {
    return colors[3];
  }
  else if (temp > 32.0 && temp < 40.0) {
    return colors[4];
  }
  else if (temp >= 40.0 && temp < 50.0) {
    return colors[5];
  }
  else if (temp >= 50.0 && temp < 60.0) {
    return colors[6];
  }
  else if (temp >= 60.0 && temp < 70.0) {
    return colors[7];
  }
  else if (temp >= 70.0 && temp < 80.0) {
    return colors[8];
  }
  else if (temp >= 80.0 && temp < 90.0) {
    return colors[9];
  }
  else if (temp >= 90.0 && temp < 100.0) {
    return colors[10];
  }
  else if (temp >= 100.0 && temp < 110.0) {
    return colors[11];
  }
  else if (temp >= 110.0) {
    return colors[12];
  }
  else{
    console.log("Could not find matching color for temp: "+temp.toString());
    return "#fdfefe";
  }
} // end tempColor function
////////////////////////////////////////////////////////////////////////////////
function dewpColor(dewp){
  colors = ["#641e16","#641e16", "#6e2c00", "#873600","#a04000",
            "#ba4a00","#d35400","#708090","#6495ED","#1E90FF","#00BFFF",
            "#228B22","#008000","#4B0082","#8A2BE2","#DAA520"];
  if (dewp < 0.0){
    return colors[0];
  }
  else if (dewp >= 0.0 && dewp < 10.0) {
    return colors[1];
  }
  else if (dewp >= 10.0 && dewp < 20.0) {
    return colors[2];
  }
  else if (dewp >= 20.0 && dewp < 25.0) {
    return colors[3];
  }
  else if (dewp >= 25.0 && dewp < 30.0) {
    return colors[4];
  }
  else if (dewp >= 30.0 && dewp < 35.0) {
    return colors[5];
  }
  else if (dewp >= 35.0 && dewp < 40.0) {
    return colors[6];
  }
  else if (dewp >= 40.0 && dewp < 45.0) {
    return colors[7];
  }
  else if (dewp >= 45.0 && dewp < 50.0) {
    return colors[8];
  }
  else if (dewp >= 50.0 && dewp < 55.0) {
    return colors[9];
  }
  else if (dewp >= 55.0 && dewp < 60.0) {
    return colors[10];
  }
  else if (dewp >= 60.0 && dewp < 65.0) {
    return colors[11];
  }
  else if (dewp >= 65.0 && dewp < 70.0) {
    return colors[12];
  }
  else if (dewp >= 70.0 && dewp < 75.0) {
    return colors[13];
  }
  else if (dewp >= 75.0 && dewp < 80.0) {
    return colors[14];
  }
  else if (dewp >= 80.0) {
    return colors[15];
  }
  else{
    console.log("Could not find matching color for dewp: "+dewp.toString());
    return "#fdfefe";
  }
} // end dewpColor function
////////////////////////////////////////////////////////////////////////////////
function relhColor(relh){
  colors = ["#FF9BF9","#FF6A06", "#e67e22", "#f5b041","#d4ac0d",
            "#f7dc6f","#34495e","#1abc9c","#138d75","#1a5276",
            "#FFFFFF"];
  if (relh < 15.0){
    return colors[0];
  }
  else if (relh >= 15.0 && relh < 20.0) {
    return colors[1];
  }
  else if (relh >= 20.0 && relh < 25.0) {
    return colors[2];
  }
  else if (relh >= 25.0 && relh < 30.0) {
    return colors[3];
  }
  else if (relh >= 30.0 && relh < 35.0) {
    return colors[4];
  }
  else if (relh >= 35.0 && relh < 40.0) {
    return colors[5];
  }
  else if (relh >= 40.0) {
    return colors[10];
  }
  else{
    console.log("Could not find matching color for relh: "+relh.toString());
    return "#fdfefe";
  }
} // end relhColor function
////////////////////////////////////////////////////////////////////////////////
function visbColor(visb){
  colors = ["#B60AFF","#D58EF3", "#D699EC", "#652FC3","#001FE6",
            "#4BB8FF","#56C4CB","#FFFFFF"];
  if (visb <= 0.25){
    return colors[0];
  }
  else if (visb > 0.25 && visb <= 0.5) {
    return colors[1];
  }
  else if (visb > 0.5 && visb <= 1.0) {
    return colors[2];
  }
  else if (visb > 1.0 && visb <= 3.0) {
    return colors[3];
  }
  else if (visb > 3.0 && visb <= 5.0) {
    return colors[4];
  }
  else if (visb > 5.0 && visb <= 7.0) {
    return colors[5];
  }
  else if (visb >= 7.0 && visb <= 9.0) {
    return colors[6];
  }
  else if (visb > 9.0) {
    return colors[7];
  }
  else{
    console.log("Could not find matching color for visb: "+visb.toString());
    return "#fdfefe";
  }
} // end visbColor function
////////////////////////////////////////////////////////////////////////////////
function windColor(wind){
  if (wind < 35){
    return "#FFFFFF"; // base color
  } else if (wind <= 45){
    return "#14C025"; // color for 35-45 mph
  } else if (wind <= 50){
    return "#FFEA22"; // color for 45-50 mph
  } else if (wind <= 58){
    return "#FFCC00"; // color for 50-58 mph
  } else if (wind <= 75){
    return "#FF5744"; // color for severe wind
  } else {
    return "#F344FF"; // color for sig wind.
  }
}
////////////////////////////////////////////////////////////////////////////////
