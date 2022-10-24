
// Functions to aid in plotting weather data into a leaflet map.

///////////////////////////////////////////////////////////////////////////////
function clearTimers(timers){
  len = timers.length;
  for (i = 0; i < len; i++){
    clearInterval(timers[i]);
  }
}
///////////////////////////////////////////////////////////////////////////////
function string_to_date(datestring){
  /// assumes format is YYYYMMDDHHMM
  let year = parseInt(datestring.substring(0,4));
  let month = parseInt(datestring.substring(4,6)-1);
  let day = parseInt(datestring.substring(6,8));
  let hour = parseInt(datestring.substring(8,10));
  let minute = parseInt(datestring.substring(10,12));
  return new Date(Date.UTC(year, month, day, hour, minute));
}
///////////////////////////////////////////////////////////////////////////////
function hazardColor(type){
  if (type.includes("Dense Fog")){
    return "#868686";
  } else if (type.includes("Small Craft") || type.includes("High Surf")) {
    return "#D899DC";
  } else if (type.includes("Beach Hazard")) {
    return "#3FD5CB";
  } else if (type.includes("Rip Current")) {
    return "#3FD5CB";
  } else if (type.includes("Gale Warning")) {
    return "#B34DAC";
  } else if (type.includes("Gale Watch")) {
    return "#B59EB3";
  } else if (type.includes("Wind Advisory")) {
    return "#B2A265";
  } else if (type.includes("Wind Warning")) {
    return "#B79716";
  } else if (type.includes("Wind Chill Advisory")) {
    return "#63E6D9";
  } else if (type.includes("Wind Chill Watch")) {
    return "#90F2D4";
  } else if (type.includes("Wind Chill Warning")) {
    return "#469B92";
  } else if (type.includes("Freeze Advisory") || type.includes("Frost Advisory")) {
    return "#85c1e9";
  } else if (type.includes("Freeze Warning")) {
    return "#3498db";
  } else if (type.includes("Flood Watch")) {
    return "#52be80";
  } else if (type.includes("Flash Flood Watch")) {
    return "#45b39d";
  } else if (type.includes("Flood Watch")) {
    return "#52be80";
  } else if (type.includes("Flood Advisory")) {
    return "#28b463";
  } else if (type.includes("Flood Warning")) {
    return "#7FFF00";
  } else if (type.includes("Fire Weather Watch")) {
    return "#f7dc6f";
  } else if (type.includes("Red Flag")) {
    return "#FF7AE5";
  } else if (type.includes("Special Weather Statement")) {
    return "#FFE4B5";
  } else if (type.includes("Severe Thunderstorm Watch")) {
    return "#f7dc6f";
  } else if (type.includes("Tornado Watch")) {
    return "#cd6155";
  } else if (type.includes("Winter Weather Advisory")) {
    return "#4682B4";
  } else if (type.includes("Winter Storm Warning")) {
    return "#8B008B";
  } else if (type.includes("Winter Storm Watch")) {
    return "#1E90FF";
  } else if (type.includes("Blizzard Warning")) {
    return "#e74c3c";
  } else if (type.includes("Snow Squall Warning")) {
    return "#71efed";
  // In order for winter storm watches to plot correctly, this needs to go last.
  } else if (type.includes("Freezing Spray") || type.includes("Storm Watch")) {
    return "#BA21B0";
  } else {
    return "#AF7171";
  }
}

///////////////////////////////////////////////////////////////////////////////
function warnColor(type){
  if (type.includes("Flash Flood")){
    return "#22C02D";
  } else if (type.includes("Severe Thunderstorm")) {
    return "#FFD700";
  } else if (type.includes("Tornado")) {
    return "#FF0000";
  }
  else {
    return "#FF7F50";
  }
}

///////////////////////////////////////////////////////////////////////////////
function spcCatColor(dn){
  if (dn == 2){
    return "#7ED07E";
  } else if (dn == 3) {
    return "#079407";
  } else if (dn == 4) {
    return "#F5FF58";
  } else if (dn == 5) {
    return "#FF8C00";
  } else if (dn == 6) {
    return "#B22222";
  } else if (dn == 8) {
    return "#9932CC";
  }
  else {
    return "#FFFFFF";
  }
}
///////////////////////////////////////////////////////////////////////////////
function fireCatColor(dn){
  //console.log(dn)
  if (dn == 5){ // elevated
    return "#f5b041";
  } else if (dn == 8) { // critical
    return "#cb4335";
  } else if (dn == 10) { // extremely critical
    return "#9b59b6";
  }
  else {
    return "#FFFFFF";
  }
}
///////////////////////////////////////////////////////////////////////////////
function checkFileExists(url){
  var http = new XMLHttpRequest();
  if (url.length == 0){
    return false;
  } else {
    http.open('HEAD',url,false);
    http.send();
    console.log(http.status);
    if (http.status == 200){
      return true;
    } else {
      return false;
    } // end else
  } // end outer else
} // end funciton

///////////////////////////////////////////////////////////////////////////////
function formatTime(time){
  if ((time.getUTCMonth()+1) < 10) {
    month = "0"+(time.getUTCMonth()+1).toString();
  } else {
    month = (time.getUTCMonth()+1).toString();
  }
  if (time.getUTCDate() < 10) {
    date = "0"+time.getUTCDate().toString();
  } else {
    date = time.getUTCDate().toString();
  }
  if (time.getUTCHours() < 10) {
    hours = "0"+time.getUTCHours().toString();
  } else {
    hours = time.getUTCHours().toString();
  }
  if (time.getMinutes() < 10) {
    minute = "0"+time.getMinutes().toString();
  } else {
    minute = time.getMinutes().toString();
  }
  //2021-02-07T03:00:00Z
  validTime = month+'/'+date+'/'+time.getFullYear().toString()+' '+hours+':'+minute+":00Z";
  return validTime;
}

///////////////////////////////////////////////////////////////////////////////
function dataTimeFormat(time){
  if ((time.getUTCMonth()+1) < 10) {
    month = "0"+(time.getUTCMonth()+1).toString();
  } else {
    month = (time.getUTCMonth()+1).toString();
  }
  if (time.getUTCDate() < 10) {
    date = "0"+time.getUTCDate().toString();
  } else {
    date = time.getUTCDate().toString();
  }
  if (time.getUTCHours() < 10) {
    hours = "0"+time.getUTCHours().toString();
  } else {
    hours = time.getUTCHours().toString();
  }
  if (time.getMinutes() < 10) {
    minute = "0"+time.getMinutes().toString();
  } else {
    minute = time.getMinutes().toString();
  }
  //2021-02-07T03:00:00Z
  validTime = time.getFullYear().toString()+month+date+hours+minute;
  return validTime;
}

///////////////////////////////////////////////////////////////////////////////
function createTimeArray(intervals){
  var times = [];
  var time = dataTimeFormat(new Date(Math.floor( new Date() / 300000) * 300000));
  //times.push(time); // add the initial time
  for (i=1; i <= intervals; i++){
    var time = new Date(Math.floor( new Date() / 300000) * 300000);
    time.setMinutes(time.getMinutes() - (i*5));
    timestring = dataTimeFormat(time);
    times.push(timestring);
  }
  return times;
}

///////////////////////////////////////////////////////////////////////////////
function radarTime(){
  time = new Date(Math.floor( new Date() / 300000) * 300000);
  return formatTime(time);
}

///////////////////////////////////////////////////////////////////////////////
function getWarningTimes(){
  var time = new Date();
  if ((time.getUTCMonth()+1) < 10) {
    month = "0"+(time.getUTCMonth()+1).toString();
  } else {
    month = (time.getUTCMonth()+1).toString();
  }
  if (time.getUTCDate() < 10) {
    date = "0"+time.getUTCDate().toString();
  } else {
    date = time.getUTCDate().toString();
  }
  if (time.getUTCHours() < 10){
    hours = "0"+time.getUTCHours().toString();
  } else {
    hour = time.getUTCHours().toString();
  }
  if (time.getMinutes() < 10) {
    minutes = "0"+time.getMinutes().toString();
  } else {
    minutes = time.getMinutes().toString();
  }
  // Formate: YYYYmmddHHMM
  var time1 = time.getFullYear().toString()+month+date+hours+minutes
  var oldTime = new Date(time - 60000);
  if ((oldTime.getUTCMonth()+1) < 10) {
    month = "0"+(oldTime.getUTCMonth()+1).toString();
  } else {
    month = (oldTime.getUTCMonth()+1).toString();
  }
  if (oldTime.getUTCDate() < 10) {
    date = "0"+oldTime.getUTCDate().toString();
  } else {
    date = oldTime.getUTCDate().toString();
  }
  if (oldTime.getUTCHours() < 10){
    hours = "0"+oldTime.getUTCHours().toString();
  } else {
    hour = oldTime.getUTCHours().toString();
  }
  if (oldTime.getMinutes() < 10) {
    minutes = "0"+oldTime.getMinutes().toString();
  } else {
    minutes = oldTime.getMinutes().toString();
  }
  var time2 = oldTime.getFullYear().toString()+month+date+hours+minutes

  return [time1,time2]
}

///////////////////////////////////////////////////////////////////////////////
function getHazardTimes(){
  var time = new Date(Math.floor( new Date() / (15*60*1000)) * (15*60*1000)); // every 15 min
  if ((time.getUTCMonth()+1) < 10) {
    month = "0"+(time.getUTCMonth()+1).toString();
  } else {
    month = (time.getUTCMonth()+1).toString();
  }
  if (time.getUTCDate() < 10) {
    date = "0"+time.getUTCDate().toString();
  } else {
    date = time.getUTCDate().toString();
  }
  if (time.getUTCHours() < 10){
    hours = "0"+time.getUTCHours().toString();
  } else {
    hour = time.getUTCHours().toString();
  }
  if (time.getMinutes() < 10) {
    minutes = "0"+time.getMinutes().toString();
  } else {
    minutes = time.getMinutes().toString();
  }
  // Formate: YYYYmmddHHMM
  var time1 = time.getFullYear().toString()+month+date+hours+minutes
  var oldTime = new Date(time - (15*60*1000)); // previous 15 min block
  if ((oldTime.getUTCMonth()+1) < 10) {
    month = "0"+(oldTime.getUTCMonth()+1).toString();
  } else {
    month = (oldTime.getUTCMonth()+1).toString();
  }
  if (oldTime.getUTCDate() < 10) {
    date = "0"+oldTime.getUTCDate().toString();
  } else {
    date = oldTime.getUTCDate().toString();
  }
  if (oldTime.getUTCHours() < 10){
    hours = "0"+oldTime.getUTCHours().toString();
  } else {
    hour = oldTime.getUTCHours().toString();
  }
  if (oldTime.getMinutes() < 10) {
    minutes = "0"+oldTime.getMinutes().toString();
  } else {
    minutes = oldTime.getMinutes().toString();
  }
  var time2 = oldTime.getFullYear().toString()+month+date+hours+minutes

  return [time1,time2]
}


///////////////////////////////////////////////////////////////////////////////
function getURLS(base,times,end){
  urls = [];
  //validTimes = [];
  for (t=0;t<times.length;t++){
    url = base + times[t].toString() + end;
    //urls.push(url);
    if (checkFileExists(url)){
      urls.push(url);
      //validTimes.push(times[t])
    } else {
      console.log(url+" was not found!");
    }
  } // end for

  return urls;
} // end function
///////////////////////////////////////////////////////////////////////////////
function clockAndLabel() {
  time = new Date();
  if (time.getSeconds() < 10) {
    seconds = "0"+time.getSeconds().toString();
  } else {
    seconds = time.getSeconds().toString();
  }
  result = formatTime(time);
  result = result.substring(0,(result.length-3))+seconds+"Z";
  validTime = radarTime();

  obj = document.getElementById('timestamp');
  obj.innerHTML = "Current Time: "+result;
}
///////////////////////////////////////////////////////////////////////////////
function C2F(tempC) {
  if (tempC == null){
    return "--"
  } // end if
  else {
    tempF = (1.8 * tempC) + 32.0
    return Math.round(tempF);
  } // end else
} // end C2F
///////////////////////////////////////////////////////////////////////////////
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


///////////////////////////////////////////////////////////////////////////////
function dewpColor(dewp){
  if (dewp < 0.0){
    return "#641e16";
  }
  else if (dewp >= 0.0 && dewp < 10.0) {
    return "#641e16";
  }
  else if (dewp >= 10.0 && dewp < 20.0) {
    return  "#6e2c00";
  }
  else if (dewp >= 20.0 && dewp < 25.0) {
    return "#873600";
  }
  else if (dewp >= 25.0 && dewp < 30.0) {
    return "#a04000";
  }
  else if (dewp >= 30.0 && dewp < 35.0) {
    return "#ba4a00";
  }
  else if (dewp >= 35.0 && dewp < 40.0) {
    return "#d35400";
  }
  else if (dewp >= 40.0 && dewp < 45.0) {
    return "#708090";
  }
  else if (dewp >= 45.0 && dewp < 50.0) {
    return "#6495ED";
  }
  else if (dewp >= 50.0 && dewp < 55.0) {
    return "#4B59D7";
  }
  else if (dewp >= 55.0 && dewp < 60.0) {
    return "#51F4FF";
  }
  else if (dewp >= 60.0 && dewp < 65.0) {
    return "#228B22";
  }
  else if (dewp >= 65.0 && dewp < 70.0) {
    return "#3BDE3B";
  }
  else if (dewp >= 70.0 && dewp < 75.0) {
    return "#4B0082";
  }
  else if (dewp >= 75.0 && dewp < 80.0) {
    return "#DD2BE4";
  }
  else if (dewp >= 80.0) {
    return "#E4D12B";
  }
  else{
    console.log("Could not find matching color for dewp: "+dewp.toString());
    return "#fdfefe";
  }
} // end dewpColor function
///////////////////////////////////////////////////////////////////////////////
function windColor(wspd){
  colors = ["#1223BF","#129F20","#62FF32","#FFFF57","#FF9810","#FF3C00","#DE00FF"];
  if (wspd < 10.0){
    return colors[0];
  }
  else if (wspd >= 10.0 && wspd < 15.0) {
    return colors[1];
  }
  else if (wspd >= 15.0 && wspd < 20.0) {
    return colors[2];
  }
  else if (wspd >= 20.0 && wspd < 30.0) {
    return colors[3];
  }
  else if (wspd >= 30.0 && wspd < 40.0) {
    return colors[4];
  }
  else if (wspd >= 40.0 && wspd < 50.0) {
    return colors[5];
  }
  else if (wspd >= 50.0 && wspd < 75.0) {
    return colors[6];
  }
  else{
    return colors[7];
  }
} // end windColor function
///////////////////////////////////////////////////////////////////////////////
function flightCatColor(cat){
  colors = ["#04e12c","#0483e1", "#cb431a", "#c81acb"];
  if (cat == "VFR"){
    return colors[0];
  }
  else if (cat == "MVFR") {
    return colors[1];
  }
  else if (cat == "IFR") {
    return colors[2];
  }
  else if (cat == "LIFR") {
    return colors[3];
  }
  else{
    console.log("Could not find matching color for cat: "+cat.toString());
    return "#fdfefe";
  }
} // end dewpColor function
///////////////////////////////////////////////////////////////////////////////
function knot2mph(knot){
  return knot * 1.150779;
}
///////////////////////////////////////////////////////////////////////////////
function Fosberg(temperature,wind_speed,relh){
  /// FOSBERG FIRE WEATHER INDEX
  // based on the equation/infomation found here:
  // https://a.atmos.washington.edu/wrfrt/descript/definitions/fosbergindex.html
  // need to convert wind in knots to mph
  wind_speed = knot2mph(wind_speed);
  // find the equilibrium moisture content
  if (relh < 10.0){
    m = 0.03229 + (0.281073 * relh) - (0.000578*relh*temperature);
  } else if (relh < 50.0){
    m = 2.22749 + (0.160107*relh) - (0.01478 * temperature);
  } else {
    m = 21.0606 + (0.005565*relh*relh) - (0.00035*relh*temperature) - (0.483199*relh);
  }
  // use this m value to find the moisture damping coefficient (n)
  m = m/30.0;
  var m2 = m * m;
  var m3 = m * m * m;
  var n = 1.0 - (2.0 * m) + (1.5 * m2) - (0.5*m3);
  // now find fosberg value:
  var fosberg = n * Math.sqrt(1.0 + (wind_speed * wind_speed)) / 0.3002;
  return fosberg;
}
///////////////////////////////////////////////////////////////////////////////
function HeatIndex(temperature,relh){
  // heat index function, based off formula found here:
  // https://www.weather.gov/media/ffc/ta_htindx.PDF
  if (temperature < 80.0){
    return temperature;
  } else {
    var t = temperature;
    var r = relh;
    var t2 = t * t;
    var r2 = r * r;
    var heat_index = -42.379 + 2.04901523*t + 10.14333127*r - 0.22475541*t*r - 0.00683783*t2 - 0.05481717*r2 + 0.00122874*t2*r + 0.00085282*t*r2 - 0.00000199*t2*r2;
    return heat_index;
  }
}
///////////////////////////////////////////////////////////////////////////////
function WindChill(temperature,wind_speed){
  // Wind Chill function, based off the formula found here:
  // https://www.weather.gov/media/epz/wxcalc/windChill.pdf
  // wind speed must be in mph
  if (temperature > 60.0){
    return temperature;
  } else {
    wind_speed = knot2mph(wind_speed);
    wind_speed = Math.pow(wind_speed,0.16);
    var wind_chill = 35.74 + (0.6215*temperature) - (35.75 * wind_speed) + (0.4275 * temperature * wind_speed);
    return wind_chill;
  }
}
///////////////////////////////////////////////////////////////////////////////
function dewpointDepression(temp,dewp){
  if (temp == -999.0 || dewp == -999.0){
    return -999.0; // return missing if either temp or dewp are missing.
  } else {
    return temp - dewp;
  }
}
///////////////////////////////////////////////////////////////////////////////
function dewpDepressionColor(dewpoint_depression){
  var color = "#3584DE";
  if (dewpoint_depression >= 50.0){
    color = "#DE35D8";
  } else if (dewpoint_depression >= 40.0){
    color = "#DE3535";
  } else if (dewpoint_depression >= 30.0){
    color = "#DE9535";
  } else if (dewpoint_depression >= 20.0) {
    color = "#DED835";
  } else if (dewpoint_depression >= 10.0) {
    color = "#37F344";
  }
  return color;
}
///////////////////////////////////////////////////////////////////////////////
function pressureTendencyDecoder(code){
  if (code == -999){
    return -999;
  } else {
    var string_code = String(code);
    if (string_code.length < 4){
      return -999;
    } else {
      var tendency_code = parseInt(string_code.substring(0,1));
      var change = parseFloat(string_code.substring(1,))/10.0; // change value is given in 10th of mb. Convert to mb.
      if ([5,6,7,8].includes(tendency_code)){
        // pressure is falling, make the change value negative.
        change = -1.0 * change;
      }
      //console.log(`Code: ${code}, Tendency: ${tendency_code}, change: ${change}`);
      return change;
    }
  }
}
///////////////////////////////////////////////////////////////////////////////
function pressTendencyColor(change){
  var color = "#DADADA";
  if (change < -2.0){
    color = "#FF51B4"; // strong pressure falls
  } else if (change < 0.0) {
    color = "#FF5168"; // weak pressure falls.
  } else if (change > 2.0){
    color = "#1171FF"; // strong pressure rise
  } else if (change > 0.0){
    color = "#54E5F5"; // weak pressure rise
  }
  return color;
}
///////////////////////////////////////////////////////////////////////////////
function altSettingColor(altsetting){
  var color = "#DADADA";
  if (altsetting <= 28.0){
    color = "#7B00D8";
  } else if (altsetting <= 28.5){
    color = "#A96FD5";
  } else if (altsetting <= 29.0){
    color = "#220DDA";
  } else if (altsetting <= 29.5){
    color = "#5A4DD4";
  } else if (altsetting <= 30.0){
    color = "#4A4676";
  } else if (altsetting <= 30.5){
    color = "#91DDE5";
  } else if (altsetting <= 31.0){
    color = "#BA739B";
  } else if (altsetting <= 31.5){
    color = "#D75B5B";
  } else if (altsetting <= 32.0){
    color = "#E82424";
  } else if (altsetting <= 32.5){
    color = "#B30505";
  } else {
    // higher than 32.5
    color = "#B305A8";
  }
  return color;
}
///////////////////////////////////////////////////////////////////////////////
function determineFlightCat(visibility,ceiling){
  var category = "VFR";
  // check for missing ceiling (which indicates clear skies)
  if (ceiling == -999.0){
    ceiling = 25000.0 // ft
  }
  if (visibility < 0.0){
      category = "MISSING";
  } else if (visibility < 1.0 || ceiling < 500.0){
    category = "LIFR";
  } else if (visibility < 3.0 || ceiling < 1000.0){
    category = "IFR";
  } else if (visibility < 5.0 || ceiling < 3000.0) {
    category = "MVFR";
  }
  return category;
}
///////////////////////////////////////////////////////////////////////////////
function RH(temp,dewp){
  // Note that this uses the August-Roche-Magnus approximation.
  // Formula comes from the online-calculator on https://bmcnoldy.rsmas.miami.edu/Humidity.html
  // T and Td must be in Celsius
  let num = Math.exp( (17.625*dewp) / (243.04+dewp) );
  let denom = Math.exp( (17.625*temp) / (243.05+temp) );
  let relh = 100.0 * (num/denom);
  return Math.round(relh);
}
///////////////////////////////////////////////////////////////////////////////
function relhColor(relh){
  colors = ["#FF9BF9","#FF6A06", "#e67e22", "#f5b041","#d4ac0d",
            "#f7dc6f","#34495e","#1abc9c","#138d75","#1a5276",
            "#633974"];
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
  else if (relh >= 40.0 && relh < 70.0) {
    return colors[6];
  }
  else if (relh >= 70.0 && relh < 80.0) {
    return colors[7];
  }
  else if (relh >= 80.0 && relh < 90.0) {
    return colors[8];
  }
  else if (relh >= 90.0 && relh < 95.0) {
    return colors[9];
  }
  else if (relh >= 95.0) {
    return colors[10];
  }
  else{
    console.log("Could not find matching color for relh: "+relh.toString());
    return "#fdfefe";
  }
} // end relhColor function

///////////////////////////////////////////////////////////////////////////////
function visbColor(visb){
  colors = ["#FF6BF1","#D58EF3", "#c39bd3", "#2e86c1","#5dade2",
            "#aed6f1","#bfc9ca","#eaeded"];
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
///////////////////////////////////////////////////////////////////////////////
function mslpColor(mslp){
  if (mslp <= 980.0){
    return  "#4a235a";
  }
  else if (mslp > 980.0 && mslp <= 984.0) {
    return colors[1];
  }
  else if (mslp > 984.0 && mslp <= 988.0) {
    return "#154360";
  }
  else if (mslp > 988.0 && mslp <= 992.0) {
    return "#1a5276";
  }
  else if (mslp > 992.0 && mslp <= 996.0) {
    return "#1f618d";
  }
  else if (mslp > 996.0 && mslp <= 1000.0) {
    return "#2471a3";
  }
  else if (mslp > 1000.0 && mslp <= 1004.0) {
    return "#5499c7";
  }
  else if (mslp > 1004.0 && mslp <= 1008.0) {
    return "#a9cce3";
  }
  else if (mslp > 1008.0 && mslp <= 1012.0) {
    return "#f2d7d5";
  }
  else if (mslp > 1012.0 && mslp <= 1016.0) {
    return "#e6b0aa";
  }
  else if (mslp > 1016.0 && mslp <= 1020.0) {
    return "#cd6155";
  }
  else if (mslp > 1020.0 && mslp <= 1024.0) {
    return "#c0392b";
  }
  else if (mslp > 1024.0 && mslp <= 1028.0) {
    return "#a93226";
  }
  else if (mslp > 1028.0 && mslp <= 1032.0) {
    return "#922b21";
  }
  else if (mslp > 1032.0 && mslp <= 1036.0) {
    return "#7b241c";
  }
  else if (mslp > 1036.0 && mslp <= 1040.0) {
    return "#641e16";
  }
  else if (mslp > 1040.0) {
    return "#512e5f";
  }
  else{
    console.log("Could not find matching color for mslp: "+mslp.toString());
    return "#fdfefe";
  }
} // end mslpColor function

function monthday_from_date(datestring){
	var list = datestring.split(" ");
  var date = list[0];
  var parts = date.split("/");
  var month = parts[0];
  var day = parts[1];
  if (parseInt(month) < 10){
    month = "0"+month;
  }
  if (parseInt(day) < 10){
    day = "0"+day;
  }
  return month+day;
}
