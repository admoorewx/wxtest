///////////////////////////////////////////////////////////////////////////////////////////////////////////
function changeProduct(){
  var office = document.getElementById("currentOffice").innerHTML.substr(16,3);
  if (office == "SPC"){
    getSPCproductID();
  } else if (office == "NHC") {
    getNHCproductID();
  } else if (office == "WPC") {
    console.log("WPC");
  } else {
    getProductID();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function markerClicked(){
  var office = document.getElementById("currentOffice").innerHTML.substr(16,3);
  console.log(office);
  if (office == "SPC"){
    spcOptions();
    getSPCproductID();
    console.log(office);
  } else if (office == "NHC") {
    nhcOptions();
    getNHCproductID();
  } else if (office == "WPC") {
    console.log("WPC");
  } else {
    getProductID();
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function removeOptions(){
  var selectMenu = document.getElementById("ProductSelection");
  while (selectMenu.firstChild){
    selectMenu.removeChild(selectMenu.lastChild);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wfoOptions(){
  removeOptions();
  document.getElementById("currentOffice").innerHTML = "Current Office: OUN";
  var selectMenu = document.getElementById("ProductSelection");
  var values = ["AFD","FWF","HWO"];
  var inner = ["Area Forecast Discussion","Fire Weather Forecast", "Hazardous Weather Outlook"];
  for (i=0;i<values.length;i++){
    var opt = document.createElement('option');
    opt.value = values[i];
    opt.innerHTML = inner[i];
    selectMenu.appendChild(opt);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function spcOptions(){
  removeOptions();
  document.getElementById("currentOffice").innerHTML = "Current Office: SPC";
  var selectMenu = document.getElementById("ProductSelection");
  var values = ["ACUS01","ACUS02","ACUS03","ACUS48","ACUS11"];
  var inner = ["Day 1 Convective Outlook","Day 2 Convective Outlook", "Day 3 Convective Outlook", "Day 4-8 Convective Outlook","Latest MCD"];
  for (i=0;i<values.length;i++){
    var opt = document.createElement('option');
    opt.value = values[i];
    opt.innerHTML = inner[i];
    selectMenu.appendChild(opt);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function nhcOptions(){
  removeOptions();
  document.getElementById("currentOffice").innerHTML = "Current Office: NHC";
  var selectMenu = document.getElementById("ProductSelection");
  var values = ["AXNT20","AXPZ20"];
  var inner = ["Tropical Weather Discussion - Atlantic/G.O.M.","Tropical Weather Discussion - Eastern Pacific"];
  for (i=0;i<values.length;i++){
    var opt = document.createElement('option');
    opt.value = values[i];
    opt.innerHTML = inner[i];
    selectMenu.appendChild(opt);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function getSPCproductID(){
  var wfo = "KWNS";
  var header = "SWO";
  var product = document.getElementById("ProductSelection").value;
  var request = new XMLHttpRequest();
  request.open('GET','https://api.weather.gov/products/types/'+header,true);
  request.onload = function() {
    var data = JSON.parse(this.response);
    if (request.status == 200) {
      for (i=0;i<data['@graph'].length;i++){
        if (data['@graph'][i].wmoCollectiveId == product){
          var productID = data["@graph"][i].id;
          getProduct(productID);
          break; // exit the loop
        } /// end if
      } // end for
    } // end if request
  } // end request
  request.send();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function getNHCproductID(){
  var wfo = "KNHC";
  var header = "TWD";
  var product = document.getElementById("ProductSelection").value;
  var request = new XMLHttpRequest();
  request.open('GET','https://api.weather.gov/products/types/'+header,true);
  request.onload = function() {
    var data = JSON.parse(this.response);
    if (request.status == 200) {
      for (i=0;i<data['@graph'].length;i++){
        if (data['@graph'][i].wmoCollectiveId == product){
          var productID = data["@graph"][i].id;
          getProduct(productID);
          break; // exit the loop
        } /// end if
      } // end for
    } // end if request
  } // end request
  request.send();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function getProductID(){
  var wfo = document.getElementById("currentOffice").innerHTML.substr(16,3);
  var product = document.getElementById("ProductSelection").value;
  //console.log(product);
  var request = new XMLHttpRequest();
  //request.open('GET','https://api.weather.gov/stations/KGFK/observations/latest?require_qc=true',true);
  request.open('GET','https://api.weather.gov/products/types/'+product+'/locations/'+wfo+'/',true);
  //request.open('GET','https://api.weather.gov/products/types/FWF/locations/'+wfo+'/',true);
  console.log("Requesting Product From: ");
  console.log('https://api.weather.gov/products/types/'+product+'/locations/'+wfo+'/');
  request.onload = function() {
    var data = JSON.parse(this.response);
    // if (request.status >= 200 && request.status < 400) {
    if (request.status == 200) {
      console.log(data);
      if (data['@graph'].length > 0){
        var productID = data["@graph"][0].id;
        getProduct(productID);
      } else {
        var errorMessage = "There was an error trying to retrieve the "+product+" product from the "+wfo+" office. \nYou may be able to find the product at www.weather.gov/"+wfo;
        displayProduct(errorMessage);
      }
    } else {
      var errorMessage = "There was an error trying to retrieve this product. \nYou may be able to find the product at www.weather.gov/"+wfo;
      displayProduct(errorMessage);
    };
  };
  request.send();
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////
function getProduct(productID){
  var request = new XMLHttpRequest();
  request.open('GET','https://api.weather.gov/products/'+productID,true);
  request.onload = function() {
    var data = JSON.parse(this.response);
    if (request.status >= 200 && request.status < 400) {
      text = data.productText;
      displayProduct(text);
    } else {
      var wfo = document.getElementById("currentOffice").innerHTML.subst(13,3)
      var errorMessage = "There was an error trying to retrieve this product. \n You may be able to find the product at www.weather.gov/"+wfo;
      displayProduct(errorMessage);
    };
  };
  request.send();
  // commands for voice reading
  globalThis.playing = false;
  stop();
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////
function displayProduct(text){
  text = text.replace(/\n/gi, "<br>&nbsp")
  document.getElementById("textarea").innerHTML = text;
  document.getElementById("textarea").readOnly = true;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////
function clearPreviousSearch(){
  // clear out previously searched/highlighted words by removing the highlight/marking markup tags
  var text = document.getElementById("textarea").innerHTML;
  var mark1 = '<mark>';
  var mark2 = '</mark>';
  text = text.replace( new RegExp(mark1, 'gi'), function (mark1) {
     return '';
  });
  var new_text = text.replace( new RegExp(mark2, 'gi'), function (mark2) {
     return '';
  });
  document.getElementById("textarea").innerHTML = new_text;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
function searchForText(){
  clearPreviousSearch();
  var phrase = document.getElementById("fname").value;
  if (phrase == ""){
    console.log("No phrase input. Ignoring");
    document.getElementById("TextNotFound").innerHTML = "";
  }
  else {
    var text = document.getElementById("textarea").innerHTML;
    var new_text = text.replace( new RegExp(phrase, 'gi'), function (phrase) {
       return '<mark>'+phrase+'</mark>';
    });
    //$("textarea").html(new_text);
    document.getElementById("textarea").innerHTML = new_text;
    //document.getElementById("textarea").readOnly = true;

    var match, matches = [];
    for(match = text.indexOf(phrase); match !== -1; match = text.indexOf(phrase,match+1)){
      matches.push(match);
    };

    if (matches.length == 0) {
      var notFound = document.getElementById("TextNotFound").innerHTML = "Text Not Found.";
    } else {
      // add in loop here to find all instances of the phrase and change HTML style for highlighting
      var notFound = document.getElementById("TextNotFound").innerHTML = matches.length.toString() + " instances found.";
    }
  } // end else
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function createReadProduct(){
  var voices = window.speechSynthesis.getVoices();
  var product = document.getElementById("ProductSelection").value;
  var start = 5;
  if (product.includes("ACUS")){
    start = 6;
  }

  let text = document.getElementById("textarea").innerHTML;
  text = cleanText(text);
  let lines = text.split("\n");
  // Remove the header text and deal with HWO if needed.
  if (product == "HWO"){
    lines = parseHWO(lines.slice(start,lines.length));
  } else {
    lines = lines.slice(start, lines.length);
  }

  text = "";
  for (i=0;i<lines.length;i++){
    if (i == 0){
      text = text + "Here is the "+lines[i];
    }
     else if (i == 1){
      text = text + " from the " + lines[i];
    }
    else if (i == 2){
      text = text + " issued at " + lines[i];
    }
    else if (lines[i] == ""){
      text = text + "..."
    } else{
      text = text + " " + lines[i];
    } // end if empty line
  } // end for

  message = new SpeechSynthesisUtterance(text);
  message.pitch = 1.4;
  message.rate = 1.2;
  message.volume = 9.0;
  message.voice = voices[0];
  return message;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function parseHWO(lines){
  var new_lines = [];
  // first get the header information
  for (i=0;i<4;i++){
    new_lines.push(lines[i]);
  }
  // now loop through and look for the start and end signals
  var start_signal = "This hazardous weather outlook";
  var end_signal = "$$";
  let add = false;
  for (i=0;i<lines.length;i++){
    if (lines[i].toLowerCase().includes(start_signal.toLowerCase())){
      add = true;
      new_lines.push(lines[i]);
    } else if (lines[i].includes(end_signal)){
      add = false;
    } else {
      if (add){
        new_lines.push(lines[i]);
      } // end if
    } // end else
  } // end for loop
  return new_lines;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function controlVolume(){
  const volText = document.getElementById("volumeText");
  const volControl = document.getElementById("volume");
  var value = volControl.value;
  volText.innerHTML = "Volume: "+value.toString();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function play(){
  readButton.innerHTML = "Stop Discussion";
  message = createReadProduct();
  window.speechSynthesis.speak(message);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function stop(){
  readButton.innerHTML = "Read Discussion";
  window.speechSynthesis.cancel();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function cleanText(text){
  text = text.replace(/<br>&nbsp;/gi,"\n")
  text = text.replace(/fa /gi,"forecast area ");
  text = text.replace(/CAA/gi,"cold air advection");
  text = text.replace(/WAA/gi,"warm air advection");
  text = text.replace(/ N /g," north ");
  text = text.replace(/ S /g," south ");
  text = text.replace(/ E /g," east ");
  text = text.replace(/ W /g," west ");
  //text = text.replace(/ NE /g," north east "); // commented out due to NE = Nebraska sometimes.
  text = text.replace(/ NW /g," north west ");
  text = text.replace(/ NNE /g," north north east ");
  text = text.replace(/ NNW /g," north north west ");
  text = text.replace(/ SE /g," south east ");
  text = text.replace(/ SW /g," south west ");
  text = text.replace(/ SSE /g," south south east ");
  text = text.replace(/ SSW /g," south south west ");
  text = text.replace(/mesoscale/gi,"mezz oscale");
  text = text.replace(/- /g,"to ");
  var jkg = new RegExp("J/kg");
  text = text.replace(/jkg/g,"joolz per kilogram");
  var ckm = new RegExp("C/km");
  text = text.replace(/ckm/g,"celsius per kilometer");
  text = text.replace(/kts/gi,"knots");
  text = text.replace(/ mph /gi,"miles per hour");
  text = text.replace(/MLCAPE/gi,"mixed layer CAPE");
  text = text.replace(/MUCAPE/gi,"most unstable CAPE");
  text = text.replace(/SBCAPE/gi,"surface based CAPE");
  text = text.replace(/ F /g," fahrenheit ");
  text = text.replace(/ C /g," celsius ");
  text = text.replace(/ K /g," kelvin ");
  text = text.replace(/NWS/gi,"National Weather Service");
  text = text.replace(/wx/gi,"weather");
  text = text.replace(/&amp;&amp;/gi,"...");
  text = text.replace(/$$/gi,"...");
  text = text.replace(/&amp;/g,"and");
  text = text.replace(/cig/gi,"ceiling");
  text = text.replace(/ mb /g," millibar ");
  text = text.replace(/vsby/gi,"visibility");
  text = text.replace(/EST/g,"eastern standard time");
  text = text.replace(/EDT/g,"eastern daylight time");
  text = text.replace(/CDT/g,"central daylight time");
  text = text.replace(/CST/g,"central standard time");
  text = text.replace(/MDT/g,"mountain daylight time");
  text = text.replace(/MST/g,"mountain standard time");
  text = text.replace(/PDT/g,"pacific daylight time");
  text = text.replace(/PST/g,"pacific standard time");

  return text;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
