////////////////////////////////////////////////////////////////////////////////////////////
  function wx2text(wx){
    let adj = "";
    let noun = "";
    if (wx.includes("-")){
      adj = "LIGHT";
    }
    else if (wx.includes("+")) {
      adj = "HEAVY";
    }
    else {
    }
    if (wx.includes("SN")){
      noun = "SNOW";
    }
    else if (wx.includes("RA")) {
      noun = "RAIN";
    }
    else if (wx.includes("DZ")) {
      noun = "DRIZZLE";
    }
    else if (wx.includes("BR")) {
      noun = "MIST";
    }
    else if (wx.includes("FG")) {
      noun = "FOG";
    }
    if (wx.includes("FZ") && (wx.includes("SN") == false)){
      return adj + " FREEZING " +noun;
    }
    else {
      return adj + " " + noun;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
  function getReportColor(rptType){
    if (rptType.includes("HEAVY SNOW")){
      return "#00CCFF";
    }
    else if (rptType.includes("FREEZING RAIN")) {
      return "#FF9CF6";
    } else if (rptType.includes("FREEZING") || rptType.includes("SNOW")) {
      return "#B0F0FF";
    } else {
      return "#FFFFFF";
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
  function checkForBlizzard(temp,vis,wspd,gust){
    blizz_vis = 0.5 // miles
    blizz_wind = 35.0 // knots
    max_temp = 34.0 // F
    if (temp < max_temp && vis <= blizz_vis && (wspd >= blizz_wind || gust >= blizz_wind)){
      return true;
    }
    else{
      return false;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
  function checkForNearBlizzard(temp,vis,wspd,gust){
    blizz_vis = 1.0 // miles
    blizz_wind = 25.0 // knots
    max_temp = 34.0 // F
    if (temp < max_temp && vis <= blizz_vis && (wspd >= blizz_wind || gust >= blizz_wind)){
      return true;
    }
    else{
      return false;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
  function checkForBlowingSnow(temp,vis,wspd,gust,wx){
    // first, check to see if "BLSN" is in the wx string
    if (wx.includes("BLSN")){
      return true;
    }
    // if not, get the blowing snow probs
    // assume 0.0 in/hour snow rate and 0.0 hour old snow pack
    blsn_prob = BLSN_model(temp,wspd,0.0,0.0);
    // if the blsn_prob is above a certain threshold and visbility is reduced, then report BLSN
    blsn_vis = 5.0; // miles
    blsn_wind = 20.0; // knots
    min_blsn = 30.0; // % (set to a low threshold to capture low-end BLSN events)
    if (blsn_prob > min_blsn && vis <= blsn_vis && (wspd >= blsn_wind || gust >= blsn_wind)){
      return true;
    }
    else{
      return false;
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
function F2C(tempF) {
  return ((tempF-32.0) / 1.8);
} // end F2C
///////////////////////////////////////////////////////////////////////////////
function F2K(tempF) {
  tempC = F2C(tempF);
  return tempC + 273.15;
} // end F2K
///////////////////////////////////////////////////////////////////////////////
function KNT2MS(knt) {
  return knt * 0.5144447;
} // end KNT2MS
///////////////////////////////////////////////////////////////////////////////
function BLSN_model(temp,wspd,snowRate,snowAge) {

/////// This is a general form of the BLSN model. This particular implementation
/////// temp = temperature in F
/////// wspd = wind speed in knots
/////// snowRate = rate of falling snow in inches/hour
/////// snowAge = age of the blowable snow pack in hours
/////// returns the probability of visibility reduction to 1/2 mile.
  // Convert temp to K
  temp = F2K(temp);

  // convert knots to m/s
  wspd = KNT2MS(wspd);

  if (snowRate > 0.0){
    // if snow is falling:
    // Multiply the snowrate to convert from in/hr to cm/hr
    snowRate = snowRate * 2.54;

    // Calculate visibility due to falling snow.
    var Vsby_SN = (-1.6/1.35) * (Math.log(snowRate/2.55)); // with conversion factor to SM
    //var Vsby_SN = (-1.0/1.35) * (Math.log(snowRate/2.55));   // without conversion factor to SM

    if (Vsby_SN <= 0.0) {
        Vsby_SN = 0.0; // for situations when snow rate is > 2.55 cm/hour.

    } else if (Vsby_SN > 8.0) {
       Vsby_SN = 8; // set max to 8 km

    }

    if (Vsby_SN < 0.8) {
        Vsby_SN = 0.8; // Don't allow vis less than 0.8 km (target visibility)
    }

    // Now calculate the amount of additional reduction to visibility due to blowing snow
    if (Vsby_SN == 0.8) {
        var Vsby_BLSN = 8.0;
    } else {
        var Vsby_BLSN = 1.0/((1.0/0.8) - (1.0/Vsby_SN));
    }

    if (Vsby_BLSN > 8.0) {
        Vsby_BLSN = 8.0;
    }

    // Calculate the Visibility ratio
    var Vsby_Ratio = 1.0 - ((8.0 - Vsby_BLSN)/7.0);

    // Set the coefficients for ongoing snow and blowing snow //
    var A1_1 = 135.5781;
    var B1_1 = -1.0567;
    var C1_1 = 0.002178;

    var A2_1 = 545.7681;
    var B2_1 = -4.41531;
    var C2_1 = 0.009132;

    var A1_8 = 333.511324;
    var B1_8 = -2.616279;
    var C1_8 = 0.005218;

    var A2_8 = 625.451921;
    var B2_8 = -5.043698;
    var C2_8 = 0.010354;

    // Calculate the thresholds
    var Prob1_5 = (A1_1) + (B1_1 * temp) + (C1_1 * (temp*temp));
    var Prob8_5 = (A1_8) + (B1_8 * temp) + (C1_8 * (temp*temp));

    var Prob1_95 = (A2_1) + (B2_1 * temp) + (C2_1 * (temp*temp));
    var Prob8_95 = (A2_8) + (B2_8 * temp) + (C2_8 * (temp*temp));

    var Prob_5  = (Vsby_Ratio * Prob8_5) + ((1.0-Vsby_Ratio)*Prob1_5);
    var Prob_95 = (Vsby_Ratio * Prob8_95) + ((1.0-Vsby_Ratio)*Prob1_95);

    if (Prob_95 <= Prob_5) {
        Prob_95 = Prob_5 + 1.0;
    }
    // Calculate the Probability for blowing snow to reduce vis to 0.8 km or less.
    var Prob = Math.trunc( ( ( ( (wspd - Prob_5) / (Prob_95 - Prob_5) ) * 0.90) + 0.05)*100.0);
    // if wind speed is greater than prob_95 is likely to occur then set Prob to 1.
    // if wind speed is less than prob_5 is likely to occur then set Prob to 0.
    if (wspd > Prob_95) {
        Prob = 100.0;
    } else if (wspd < Prob_5) {
        Prob = 0.0;
    }

    // NOTE: commented out for testing purposes. - AM 03/07/19
    // If the visibility is already reduced due to 0.5 mile due to the falling snow,
    // then the probability of vis < 0.5, 1, and 3 miles is already 100%.
    //if (Vsby_SN == 0.8){
    //    Prob = 100.0;
    //}

    return Prob
  }

  else{
    // set initial coefficients based on input snow age
    if (snowAge <= 3.0){
      var A1 = 722.5678;
      var B1 = -5.73729;
      var C1 = 0.01153;

      var A2 = 413.0132;
      var B2 = -3.44011;
      var C2 = 0.007376;
    } // end if 3 hours

    else if (snowAge <= 6.0) {
        var A1 = 402.3755;
        var B1 = -3.21806;
        var C1 = 0.006583;

        var A2 = 391.6439;
        var B2 = -3.29534;
        var C2 = 0.007136;
    } // end if 6 hrs

    else if (snowAge <= 12.0) {
        var A1 = 485.0122;
        var B1 = -3.88134;
        var C1 = 0.007915;

        var A2 = 445.6496;
        var B2 = -3.64166;
        var C2 = 0.00766;
    } // end if 12 hrs

    else if (snowAge <= 24.0) {
        var A1 = 411.4914;
        var B1 = -3.36769;
        var C1 = 0.007039;

        var A2 = -48.261;
        var B2 = 0.293256;
        var C2 = -0.00016;
    } // end if 24 hrs

    else if (snowAge <= 48.0) {
        var A1 = 466.1447;
        var B1 = -3.85486;
        var C1 = 0.008115;

        var A2 = 627.8094;
        var B2 = -5.13465;
        var C2 = 0.010726;
    } // end if 48 hrs

    else {
        // assumes snow pack age > 48 hours
        var A1 = 593.415;
        var B1 = -4.83758;
        var C1 = 0.010005;

        var A2 = 460.0506;
        var B2 = -3.8516;
        var C2 = 0.008281;
    } // end if >48 hrs

    // Calculate the thresholds
    var Prob_5_nosnow = (A1) + (B1 * temp) + (C1 * (temp*temp));
    var Prob_95_nosnow = (A2) + (B2 * temp) + (C2 * (temp*temp));

    if (Prob_95_nosnow <= Prob_5_nosnow) {
        Prob_95_nosnow = Prob_5_nosnow + 1.0;
    }

    // Calculate the Probability for blowing snow to reduce vis to 0.8 km or less.
    var Prob_nosnow = (((wspd - Prob_5_nosnow)/(Prob_95_nosnow - Prob_5_nosnow)) * 0.90) + 0.05;

    // if wind speed is greater than prob_95 is likely to occur then set Prob to 1.
    // if wind speed is less than prob_5 is likely to occur then set Prob to 0.

    if (wspd > Prob_95_nosnow) {
        Prob_nosnow = 1.0;
    } else if (wspd < Prob_5_nosnow) {
        Prob_nosnow = 0.0;
    }

    // Multiply by 100 to get the percent.
    Prob_nosnow = Prob_nosnow*100.0;

    // return value
    return Prob_nosnow;
  } // end else
} // end of Blowing Snow generic
////////////////////////////////////////////////////////////////////////////////
