var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
}


function BSmodel() {

    // This part reads in the input data.

    var x = document.getElementById("inputdata");
    var text = "";
    var i;
    for (i = 0; i < x.length ;i++) {
        text += x.elements[i].value + "<br>";
    }

    var temp = parseFloat(x.elements[0].value);
    var wspd = parseFloat(x.elements[1].value);

    // For the 1/2 mile table
    document.getElementById("crustWind").innerHTML = wspd.toString();
    document.getElementById("crustProb").innerHTML = CrustBreaker(wspd).toString()+" %";
    // For the 1 mile table
    document.getElementById("crustWind2").innerHTML = wspd.toString();
    document.getElementById("crustProb2").innerHTML = CrustBreaker(wspd).toString()+" %";
    // For the 3 mile table
    document.getElementById("crustWind3").innerHTML = wspd.toString();
    document.getElementById("crustProb3").innerHTML = CrustBreaker(wspd).toString()+" %";

    // Put in the constant wind speed
    var color = "blue";
    document.getElementById("ctemp1").innerHTML = "<font color="+color+">Constant Temperature = "+temp.toString()+" F</font>";

    // Create an array with a list of snow ages to get probs for.
    // The "50" hour snow age is used to represent all snow ages > 48 hours.
    var snowAge = [3.0, 6.0, 12.0, 24.0, 48.0];

    // Specify snowfall rate based off slider input
    var snowRate = parseFloat(slider.value);

    // Create an array of +/- 10 for and wind speed
    var tempRange = [];
    var windRange = [];
    var newWind;
    var w;
    for (w=-10; w <= 10; w++) {
        tempRange.push((temp+w));

        newWind = wspd + w;
        if (newWind < 0.0){
          newWind = 0.0;
        } // end if newWind

        windRange.push(newWind);
    }

//// 0.5 Mile Visibility Probs /////

    // Put in the constant wind speed
    //document.getElementById("ctemp1").innerHTML = "<font color="blue">Constant Temperature = "+temp.toString()+" F</font>";

    // Loop through each wind speed
    var WIND = "WIND";
    var count;
    var visStandard = 0.5;
    var windText = [["Wind Speed (knots)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (count=0; count < windRange.length; count++){

      windText.push(BlowingSnow(temp,windRange[count],snowRate,snowAge,WIND,visStandard));
    }

    // Trying to make a table....

    // get the table in the html
    table = document.getElementById("WStable");

    // rows
    for (var t=2; t < table.rows.length; t++) {

        // cells
        for (var f=0; f < table.rows[t].cells.length; f++) {


	    ////// Shading the cells based on impacts //////
	    // Shade it purple for high impact
            if ( (parseFloat(windText[t-1][f]) >= 90) && (f > 0) ){

		var cellID = (t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor='#FF33F9';

            }

	    // Shade it red for moderate impact
            if ( (parseFloat(windText[t-1][f]) >= 80) && ( parseFloat(windText[t-1][f]) < 90 ) && (f > 0) ) {

		var cellID = (t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="red";
            }

	    // Shade it orange for enh. impact
            if ( (parseFloat(windText[t-1][f]) >= 60) && ( parseFloat(windText[t-1][f]) < 80 ) && (f > 0) ){

		var cellID = (t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="orange";

            }

	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(windText[t-1][f]) >= 15) && ( parseFloat(windText[t-1][f]) < 60 ) && (f > 0) ){

		var cellID = (t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
	    }

            if ( (parseFloat(windText[t-1][f]) < 15) && (f > 0) ) {

                var cellID = (t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                table.rows[t].cells[f].innerHTML = "<b>"+windText[t-1][f]+"</b>";
            }

            else {
                table.rows[t].cells[f].innerHTML = windText[t-1][f];
            }

        } // end for cell
    } // end for row

    // Loop through each temperature
    var TEMP = "TEMP";
    var Tcount;
    var tempText = [["Temperature (F)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (Tcount=0; Tcount < tempRange.length; Tcount++){

      tempText.push(BlowingSnow(tempRange[Tcount],wspd,snowRate,snowAge,TEMP,0.5));
    }


    // Trying to make a table....

    // get the table in the html
    Ttable = document.getElementById("Ttable");

    // Put in the constant wind speed
    document.getElementById("cwspd1").innerHTML = "<font color="+color+">Constant Wind Speed = "+wspd.toString()+" kts</font>";

    // rows
    for (var t=2; t < Ttable.rows.length; t++) {

        // cells
        for (var f=0; f < Ttable.rows[t].cells.length; f++) {


	    ////// Shading the cells based on impacts //////
	    // Shade it purple for high impact
            if ( (parseFloat(tempText[t-1][f]) >= 90) && (f > 0) ){
		var cellID = "T"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor='#FF33F9';
            }

	    // Shade it red for moderate impact
            if ( (parseFloat(tempText[t-1][f]) >= 80) && ( parseFloat(tempText[t-1][f]) < 90 ) && (f > 0) ) {
		var cellID = "T"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="red";
            }

	    // Shade it orange for enh. impact
            if ( (parseFloat(tempText[t-1][f]) >= 60) && ( parseFloat(tempText[t-1][f]) < 80 ) && (f > 0) ){
		var cellID = "T"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="orange";
            }

	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(tempText[t-1][f]) >= 15) && ( parseFloat(tempText[t-1][f]) < 60 ) && (f > 0) ){

		var cellID = "T"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
            }

            if ( (parseFloat(tempText[t-1][f]) < 15) && (f > 0) ) {

                var cellID = "T"+(t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                Ttable.rows[t].cells[f].innerHTML = "<b>"+tempText[t-1][f]+"</b>";
            }

            else {


                Ttable.rows[t].cells[f].innerHTML = tempText[t-1][f];
            }

        } // end for cell
    } // end for row


//// 1.0 Mile Visibility Probs /////

    // Loop through each wind speed
    var WIND = "WIND";
    var count;
    var windText = [["Wind Speed (knots)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (count=0; count < windRange.length; count++){

      windText.push(BlowingSnow(temp,windRange[count],snowRate,snowAge,WIND,1.0));
    }


    // Trying to make a table....

    // get the table in the html
    table = document.getElementById("WStable2");


    // Put in the constant wind speed
    document.getElementById("ctemp2").innerHTML = "<font color="+color+">Constant Temperature = "+temp.toString()+" F</font>";


    // rows
    for (var t=2; t < table.rows.length; t++) {

        // cells
        for (var f=0; f < table.rows[t].cells.length; f++) {


	    ////// Shading the cells based on impacts //////


	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(windText[t-1][f]) >= 30) && (f > 0) ){

		var cellID = "WW"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
	    }

            if ( (parseFloat(windText[t-1][f]) < 30) && (f > 0) ) {

                var cellID = "WW"+(t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                table.rows[t].cells[f].innerHTML = "<b>"+windText[t-1][f]+"</b>";
            }

            else {
                table.rows[t].cells[f].innerHTML = windText[t-1][f];
            }



        } // end for cell
    } // end for row


    // Loop through each temperature
    var TEMP = "TEMP";
    var Tcount;
    var tempText = [["Temperature (F)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (Tcount=0; Tcount < tempRange.length; Tcount++){

      tempText.push(BlowingSnow(tempRange[Tcount],wspd,snowRate,snowAge,TEMP,1.0));
    }


    // Trying to make a table....

    // get the table in the html
    Ttable = document.getElementById("Ttable2");

    // Put in the constant wind speed
    document.getElementById("cwspd2").innerHTML = "<font color="+color+">Constant Wind Speed = "+wspd.toString()+" kts</font>";

    // rows
    for (var t=2; t < Ttable.rows.length; t++) {

        // cells
        for (var f=0; f < Ttable.rows[t].cells.length; f++) {


	    ////// Shading the cells based on impacts //////

	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(tempText[t-1][f]) >= 30) && (f > 0) ){

		var cellID = "TT"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
            }

            if ( (parseFloat(tempText[t-1][f]) < 30) && (f > 0) ) {

                var cellID = "TT"+(t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                Ttable.rows[t].cells[f].innerHTML = "<b>"+tempText[t-1][f]+"</b>";
            }

            else {


                Ttable.rows[t].cells[f].innerHTML = tempText[t-1][f];
            }

        } // end for cell
    } // end for row


//// 3.0 Mile Visibility Probs /////

    // Loop through each wind speed
    var WIND = "WIND";
    var count;
    var windText = [["Wind Speed (knots)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (count=0; count < windRange.length; count++){

      windText.push(BlowingSnow(temp,windRange[count],snowRate,snowAge,WIND,3.0));
    }

    // Trying to make a table....

    // get the table in the html
    table = document.getElementById("WStable3");

    // Put in the constant wind speed
    document.getElementById("ctemp3").innerHTML = "<font color="+color+">Constant Temperature = "+temp.toString()+" F</font>";


    // rows
    for (var t=2; t < table.rows.length; t++) {

        // cells
        for (var f=0; f < table.rows[t].cells.length; f++) {

	    ////// Shading the cells based on impacts //////
	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(windText[t-1][f]) >= 10) && (f > 0) ){

		var cellID = "WWW"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
	    }

            if ( (parseFloat(windText[t-1][f]) < 10) && (f > 0) ) {

                var cellID = "WWW"+(t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                table.rows[t].cells[f].innerHTML = "<b>"+windText[t-1][f]+"</b>";
            }

            else {
                table.rows[t].cells[f].innerHTML = windText[t-1][f];
            }

        } // end for cell
    } // end for row

    // Loop through each temperature
    var TEMP = "TEMP";
    var Tcount;
    var tempText = [["Temperature (F)","Falling/Fresh","3 Hr Snow", "6 Hr Snow", "12 Hr Snow","24 Hr Snow","48 Hr Snow","48+ Hr Snow"]];
    for (Tcount=0; Tcount < tempRange.length; Tcount++){

      tempText.push(BlowingSnow(tempRange[Tcount],wspd,snowRate,snowAge,TEMP,3.0));
    }

    // Trying to make a table....
    // get the table in the html
    Ttable = document.getElementById("Ttable3");

    // Put in the constant wind speed
    document.getElementById("cwspd3").innerHTML = "<font color="+color+">Constant Wind Speed = "+wspd.toString()+" kts</font>";

    // rows
    for (var t=2; t < Ttable.rows.length; t++) {

        // cells
        for (var f=0; f < Ttable.rows[t].cells.length; f++) {


	    ////// Shading the cells based on impacts //////

	    // Shade it yellow for slight impact - no shading for low impact
            if ( (parseFloat(tempText[t-1][f]) >= 10) && (f > 0) ){

		var cellID = "TTT"+(t-1).toString()+(f+1).toString();
	        document.getElementById(cellID).style.backgroundColor="yellow";
            }

            if ( (parseFloat(tempText[t-1][f]) < 10) && (f > 0) ) {

                var cellID = "TTT"+(t-1).toString()+(f+1).toString();
 	        document.getElementById(cellID).style.backgroundColor="white";
            }

            /////// Done with shading  /////////


            if (t==12){
                Ttable.rows[t].cells[f].innerHTML = "<b>"+tempText[t-1][f]+"</b>";
            }

            else {


                Ttable.rows[t].cells[f].innerHTML = tempText[t-1][f];
            }

        } // end for cell
    } // end for row

} // end of BS cover function




function F2K(temp){
    return (((temp-32.0)*(5/9))+273.15);
} // end of F2K


function K2F(temp){
    return (((temp-273.15)*(9/5))+32.0);
}

function KNT2MS(wspd){
    return wspd/1.942615;
} // end of KNT2MS

function MS2KNT(wspd){
    return wspd*1.942615;
} // end of MS2KNT



function BlowingSnow(temp,wspd,snowRate,snowAge,TYPE,visStandard) {

/////// Here's the Blowing Snow Model code for javascript //////
////// Note that this particular implementation is designed for the
////// Blowing Snow table specifically. A more general form of the
///// BLSN model can be found below (BLSN_model).

    // Keep the original temperature if looping through different temps
    // The reason for this is that there is a rounding error when converting from
    // F to K and back to F. The %s are correct, the temps just look off.
    var OGtemp = temp;

    // Keep the original snow rate. This will be used to make sure that all probs for
    // falling snow are set to zero.
    var OGsnowRate = snowRate;

    // Convert temp to K
    temp = F2K(temp);

    // convert knots to m/s
    wspd = KNT2MS(wspd);

    // Multiply the snowrate to convert from in/hr to cm/hr
    snowRate = snowRate * 2.54;

    if (snowRate == 0.0) {
        snowRate = 0.00001;
    }


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

        if (visStandard == 0.5) {
            var Vsby_BLSN = 1.0/((1.0/0.8) - (1.0/Vsby_SN));
        }
        if (visStandard == 1.0) {
            var Vsby_BLSN = 1.0/((1.0/1.6) - (1.0/Vsby_SN));
        }
        if (visStandard == 3.0) {
            var Vsby_BLSN = 1.0/((1.0/4.8) - (1.0/Vsby_SN));
        }
    }


    if (Vsby_BLSN > 8.0) {
        Vsby_BLSN = 8.0;
    }

    // Calculate the Visibility ratio
    var Vsby_Ratio = 1.0 - ((8.0 - Vsby_BLSN)/7.0);

    // Set the coefficients for ongoing snow and blowing snow //
    // Set these according to the visStandard.

    if (visStandard == 0.5){

        var A1_1 = 135.5781;
        var B1_1 = -1.0567;
        var C1_1 = 0.002178;

        var A2_1 = 545.7681;
        var B2_1 = -4.41531;
        var C2_1 = 0.009132;
    } // end if 0.5 mile


    if (visStandard == 1.0){

        var A1_1 = 167.2874;
        var B1_1 = -1.28368;
        var C1_1 = 0.002564;

        var A2_1 = 481.0611;
        var B2_1 = -3.88727;
        var C2_1 = 0.00805;
    } // end if 1 mile


    if (visStandard == 3.0){

        var A1_1 = 324.06194;
        var B1_1 = -2.541495;
        var C1_1 = 0.005073;

        var A2_1 = 625.920749;
        var B2_1 = -5.052157;
        var C2_1 = 0.0010381;
    } // end if 3 mile



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

    // set to zero if there is no falling snow.
    if (OGsnowRate == 0.0) {
        Prob = 0.0;
    }

    // If the temp is greater than 37F then set the probs to zero.
    // hard to have blowing snow when it's mostly liquid!
    if (OGtemp >= 37){
        Prob = 0.0;
    }

    // NOTE: commented out for testing purposes. - AM 03/07/19
    // If the visibility is already reduced due to 0.5 mile due to the falling snow,
    // then the probability of vis < 0.5, 1, and 3 miles is already 100%.
    //if (Vsby_SN == 0.8){
    //    Prob = 100.0;
    //}

    // Now we need to handle the case when there is no falling snow. Loop through
    // each of the snow ages and find the prob. of blowing snow.

    // first create an array to store the probs.
    var NoSnowProbs = [];


    // Begin loop through each snow age.

    var age;
    for (age = 0; age < snowAge.length; age++){

        // For snowAge == 3.0 hours
        if (visStandard == 0.5){

            var A1 = 722.5678;
            var B1 = -5.73729;
            var C1 = 0.01153;

            var A2 = 413.0132;
            var B2 = -3.44011;
            var C2 = 0.007376;
        } // end if 0.5 mile

        if (visStandard == 1.0){

            var A1 = 655.121615;
            var B1 = -5.231261;
            var C1 = 0.010565;

            var A2 = 493.160319;
            var B2 = -4.054318;
            var C2 = 0.00855;
        } // end if 1 mile

        if (visStandard == 3.0){

            var A1 = 555.357273;
            var B1 = -4.403037;
            var C1 = 0.008833;

            var A2 = 446.126027;
            var B2 = -3.710887;
            var C2 = 0.007921;
        } // end if 3 mile

        if (snowAge[age] == 6.0) {
        // Coefficients for no falling snow

            if (visStandard == 0.5){

                var A1 = 402.3755;
                var B1 = -3.21806;
                var C1 = 0.006583;

                var A2 = 391.6439;
                var B2 = -3.29534;
                var C2 = 0.007136;
            } // end if 0.5 mile

            if (visStandard == 1.0){

                var A1 = 460.01558;
                var B1 = -3.666544;
                var C1 = 0.00744;

                var A2 = 412.908488;
                var B2 = -3.45604;
                var C2 = 0.007435;
            } // end if 1.0 mile

            if (visStandard == 3.0){

                var A1 = 709.586066;
                var B1 = -5.68819;
                var C1 = 0.011509;

                var A2 = 321.113071;
                var B2 = -2.736123;
                var C2 = 0.006021;
            } // end if 3.0 mile

        } // end if 6 hrs

        if (snowAge[age] == 12.0) {
        // Coefficients for no falling snow

            if (visStandard == 0.5){
                var A1 = 485.0122;
                var B1 = -3.88134;
                var C1 = 0.007915;

                var A2 = 445.6496;
                var B2 = -3.64166;
                var C2 = 0.00766;
            } //end if 0.5 mile

            if (visStandard == 1.0){
                var A1 = 548.625731;
                var B1 = -4.368439;
                var C1 = 0.00883;

                var A2 = 297.297067;
                var B2 = -2.437072;
                var C2 = 0.005214;
            } //end if 1.0 mile

            if (visStandard == 3.0){
                var A1 = 563.48367;
                var B1 = -4.492308;
                var C1 = 0.009068;

                var A2 = 546.547852;
                var B2 = -4.452869;
                var C2 = 0.009281;
            } //end if 3.0mile

        } // end if 12 hrs

        if (snowAge[age] == 24.0) {
        // Coefficients for no falling snow

            if (visStandard == 0.5){
                var A1 = 411.4914;
                var B1 = -3.36769;
                var C1 = 0.007039;

                var A2 = -48.261;
                var B2 = 0.293256;
                var C2 = -0.00016;
            } // end if 0.5 mile

            if (visStandard == 1.0){
                var A1 = 443.951599;
                var B1 = -3.616849;
                var C1 = 0.007501;

                var A2 = -28.699519;
                var B2 = 0.130213;
                var C2 = 0.000176;
            } // end if 1.0 mile

            if (visStandard == 3.0){
                var A1 = 553.03718;
                var B1 = -4.503094;
                var C1 = 0.00928;

                var A2 = -4.055327;
                var B2 = -0.064788;
                var C2 = 0.000555;
            } // end if 3.0 mile

        } // end if 24 hrs


        if (snowAge[age] == 48.0) {
        // Coefficients for no falling snow

            if (visStandard == 0.5){
                var A1 = 466.1447;
                var B1 = -3.85486;
                var C1 = 0.008115;

                var A2 = 627.8094;
                var B2 = -5.13465;
                var C2 = 0.010726;
            } // end if 0.5 mile

            if (visStandard == 1.0){
                var A1 = 606.25489;
                var B1 = -4.981435;
                var C1 = 0.010363;

                var A2 = 453.173312;
                var B2 = -3.719025;
                var C2 = 0.007857;
            } // end if 1.0 mile

            if (visStandard == 3.0){
                var A1 = 543.496953;
                var B1 = -4.447625;
                var C1 = 0.009215;

                var A2 = 346.228862;
                var B2 = -2.863132;
                var C2 = 0.006142;
            } // end if 3.0 mile
        } // end if 48 hrs

        if (snowAge[age] > 48.0) {
            // Coefficients for no falling snow
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

        // If the temp is greater than 37F then set the probs to zero.
        // hard to have blowing snow when it's mostly liquid!
        if (OGtemp >= 37.0){
            Prob_nosnow = 0.0;
        }
        // add to the array
        NoSnowProbs.push(Math.trunc(Prob_nosnow));

    } // end for snow age loop

    // Output the data.
    var text2 = [];
    // add on the wind speed or temp
    if (TYPE == "WIND"){
       text2.push(Math.trunc(MS2KNT(wspd)).toString()+" knts");
    }
    else {
        text2.push(OGtemp.toString()+" F");
    }
    // add on the prob for falling snow
    text2.push(Prob.toString()+" %");

    // add on the probs for no falling snow
    for (var p = 0; p < NoSnowProbs.length ;p++) {
        // do an integrity check to make sure that prob[older time] !> prob[newer time]
        // this is needed due to some weird issue with the one mile probs sometimes being higher
        // for the 6,12, and 24 hour ages than the younger ages.
        if ( p > 0 ){
            if (NoSnowProbs[p] > NoSnowProbs[p-1]) {

                text2.push(NoSnowProbs[p-1].toString() + " %");
                NoSnowProbs[p] = NoSnowProbs[p-1];
            } else {
                text2.push(NoSnowProbs[p].toString() + " %");
            }
        } else {
                text2.push(NoSnowProbs[p].toString() + " %");
        }
    } // end for p
    return text2
} // end of Blowing Snow





function CrustBreaker(wspd) {
    // This equation gives the probability of breaking a wet snow/icy "crust" layer on the snow in order to cause
    // blowing snow. It is based on Essery et al. (1999) - "A Distributed Model of Blowing Snow Over Complex Terrain"
    var expo = (Math.sqrt(Math.PI) * (21.0 - KNT2MS(wspd)) ) / 7.0;
    var prob = 1.0 + (Math.E ** expo);
    return Math.trunc((prob ** -1.0) * 100.0);
} // end of Crust Breaker
