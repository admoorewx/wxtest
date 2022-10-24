///////////////////////////////////////////////////////////////////////////////////////////////////////////
// quick function for centering the meteogram/form container
function center(){
  var width = window.innerWidth;
  var container = document.getElementById("container");
  var container_width = container.offsetWidth;
  var left = (width - container_width) / 2.0;
  container.style.left = `${left}px`;
}
window.onload = center;
window.addEventListener('resize',function(){
  center();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function changeSite(site){
  document.getElementById("currentStation").innerHTML = "Current Station: "+site;
  initializeClimo();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function average(data){
  // find a simple average, return the Mean
  const sum = data.reduce(function(total,a){return total += a;})
  return sum/data.length;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    if (typeof p !== 'number') throw new TypeError('p must be a number');
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = (arr.length - 1) * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function Quartile(data, q) {
  data=Array_Sort_Numbers(data);
  var pos = ((data.length) - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if( (data[base+1]!==undefined) ) {
    return data[base] + rest * (data[base+1] - data[base]);
  } else {
    return data[base];
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function Array_Sort_Numbers(inputarray){
  return inputarray.sort(function(a, b) {
    return a - b;
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function dataOnDate(date,valid,data){
  var collection = [];
  valid.forEach((time, i) => {
    if (time.substr(5,5).includes(date)){
      if (data[i] != "M"){
        collection.push(parseFloat(data[i]));
      }
    }
  });
  return collection;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function getDates(){
  // function that generates a list of days of the year. Note: this is slow.
  const months = range(1,12);
  const days = range(1,31);
  const bad_dates = ["02-30","02-31","04-31","06-31","09-31","11-31"];
  const dates = [];
  months.forEach((mon, m) => {
    if (mon < 10){
      mon = "0"+mon.toString();
    } else { mon = mon.toString(); }
    days.forEach((day,d)=> {
      if (day < 10) {
        day = "0"+day.toString();
      } else { day = day.toString(); }
      date = mon+"-"+day;
      if (bad_dates.includes(date) == false){
        dates.push(date);
      }
    }) // end day loop
  }); // end month loop
  return dates;
}// end function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function range(start, end) {
  // Return an array of ints from the start to the end (inclusive).
  return Array.from({ length: end - start + 1 }, (_, i) => start+i)
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function quickDates(){
  // returns a pre-generated list of days of the year. This is a bit faster.
  return [ "01-01","01-02","01-03","01-04","01-05","01-06","01-07","01-08","01-09","01-10","01-11","01-12","01-13","01-14","01-15","01-16","01-17", "01-18","01-19","01-20","01-21","01-22","01-23","01-24",
            "01-25","01-26","01-27","01-28","01-29","01-30","01-31","02-01","02-02","02-03","02-04","02-05","02-06","02-07","02-08","02-09","02-10","02-11","02-12","02-13","02-14","02-15","02-16","02-17",
            "02-18","02-19","02-20","02-21","02-22","02-23","02-24","02-25","02-26","02-27","02-28","02-29","03-01","03-02","03-03","03-04","03-05","03-06","03-07","03-08","03-09","03-10","03-11","03-12",
            "03-13","03-14","03-15","03-16","03-17","03-18","03-19","03-20","03-21","03-22","03-23","03-24","03-25","03-26","03-27","03-28","03-29","03-30","03-31","04-01","04-02","04-03","04-04","04-05",
            "04-06","04-07","04-08","04-09","04-10","04-11","04-12","04-13","04-14","04-15","04-16","04-17","04-18","04-19","04-20","04-21","04-22","04-23","04-24","04-25","04-26","04-27","04-28","04-29",
            "04-30","05-01","05-02","05-03","05-04","05-05","05-06","05-07","05-08","05-09","05-10","05-11","05-12","05-13","05-14","05-15","05-16","05-17","05-18","05-19","05-20","05-21","05-22","05-23",
            "05-24","05-25","05-26","05-27","05-28","05-29","05-30","05-31","06-01","06-02","06-03","06-04","06-05","06-06","06-07","06-08","06-09","06-10","06-11","06-12","06-13","06-14","06-15","06-16",
            "06-17","06-18","06-19","06-20","06-21","06-22","06-23","06-24","06-25","06-26","06-27","06-28","06-29","06-30","07-01","07-02","07-03","07-04","07-05","07-06","07-07","07-08","07-09","07-10",
            "07-11","07-12","07-13","07-14","07-15","07-16","07-17","07-18","07-19","07-20","07-21","07-22","07-23","07-24","07-25","07-26","07-27","07-28","07-29","07-30","07-31","08-01","08-02","08-03",
            "08-04","08-05","08-06","08-07","08-08","08-09","08-10","08-11","08-12","08-13","08-14","08-15","08-16","08-17","08-18","08-19","08-20","08-21","08-22","08-23","08-24","08-25","08-26","08-27",
            "08-28","08-29","08-30","08-31","09-01","09-02","09-03","09-04","09-05","09-06","09-07","09-08","09-09","09-10","09-11","09-12","09-13","09-14","09-15","09-16","09-17","09-18","09-19","09-20",
            "09-21","09-22","09-23","09-24","09-25","09-26","09-27","09-28","09-29","09-30","10-01","10-02","10-03","10-04","10-05","10-06","10-07","10-08","10-09","10-10","10-11","10-12","10-13","10-14",
            "10-15","10-16","10-17","10-18","10-19","10-20","10-21","10-22","10-23","10-24","10-25","10-26","10-27","10-28","10-29","10-30","10-31","11-01","11-02","11-03","11-04","11-05","11-06","11-07",
            "11-08","11-09","11-10","11-11","11-12","11-13","11-14","11-15","11-16","11-17","11-18","11-19","11-20","11-21","11-22","11-23","11-24","11-25","11-26","11-27","11-28","11-29","11-30","12-01",
            "12-02","12-03","12-04","12-05","12-06","12-07","12-08","12-09","12-10","12-11","12-12","12-13","12-14","12-15","12-16","12-17","12-18","12-19","12-20","12-21","12-22","12-23","12-24","12-25",
            "12-26","12-27","12-28","12-29","12-30","12-31"
          ]
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function kmh2knots(kmh){
  // convert km/h to knots
  return Math.round(kmh * 0.5399565);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function tempQC(temp){
  // note: works for dewpoint as well
  temp = C2F(temp);
  if (temp == "--" || temp > 200.0 || temp < -100.0){
    return "NA";
  }
  else {
    return Math.round(temp).toString();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wspdQC(wspd){
  if (wspd < 0.0){
    return "NA";
  }
  else {
    return Math.round(kmh2knots(wspd)).toString();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function relhQC(relh){
  if (relh > 100.0 || relh < 0.0){
    return "NA";
  }
  else {
    return Math.round(relh).toString();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mslpQC(mslp){
  mslp = Math.round(mslp/100.0);
  if (mslp > 1100.0 || mslp < 900.0) {
    return "NA";
  }
  else {
    return mslp.toString();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function C2F(tempC) {
  // convert C to F
  if (tempC == null){
    return "--"
  } // end if
  else {
    tempF = (1.8 * tempC) + 32.0
    return Math.round(tempF);
  } // end else
} // end C2F
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateTable(data){
  document.getElementById("tempValue").innerHTML = data[0]+" F";
  document.getElementById("dewpValue").innerHTML = data[1]+" F";
  document.getElementById("relhValue").innerHTML = data[4]+" %";
  document.getElementById("wspdValue").innerHTML = data[2]+" knots";
  document.getElementById("mslpValue").innerHTML = data[3]+" mb";
  document.getElementById("obsTimestamp").innerHTML = "Latest Observation: "+data[5]+" UTC";
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////
function setCurrentValue(obs,variable,currentValue){
  console.log(variable);
  if (variable == "tmpf"){
    globalThis.currentValue = obs[0];
  }
  else if (variable == "dwpf") {
    globalThis.currentValue = obs[1];
  }
  else if (variable == "relh") {
    globalThis.currentValue = obs[4];
  }
  else if (variable == "sknt") {
    globalThis.currentValue = obs[2];
  }
  else if (variable == "mslp") {
    globalThis.currentValue = obs[3];
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function formatTime(timestamp){
  var year = timestamp.substr(0,4);
  var month = timestamp.substr(5,2);
  var day = timestamp.substr(8,2);
  var time = timestamp.substr(11,5);
  return month+"/"+day+"/"+year+" "+time;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function formatDate(date){
  // expects a string date in the format "MMDD"
  return date.substr(0,2)+"-"+date.substr(2,4);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
