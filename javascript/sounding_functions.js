///////////////////////////////////////////////////////////////////////////////////////////////////////////
////// CONSTANTS /////
const gravity = 9.81 // m/s2
const rho = 1.293 // kg/m3
const rho_water_vapor = 0.013 // kg/m3
const rho_water_liquid = 997.0 // kg/m3
const e = 621.97; // unknown
const k = 0.285; // Poisson constant for dry air
const p0 = 100000.0;// 1000 hPa in Pa
const cp = 1005.0; // J/kgK
const cv = 1996.0 // J/kgK
const Rd = 287.05; // J/kgK
const Rv = 461.0; // J/kgK
const Lv = 2260.0 * 1000.0; // J/kg
const epsilon = 0.622;
const P0 = 1000.0; // hPa
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function arange(start,end,inc){
  array = [];
  val = start;
  while (val <= end){
    array.push(val);
    val = val + inc;
  }
  return array;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_dry_adiabat(start_temp,pres_grid){
  // find initial pot temp at 1000 hPa
  var theta = C2K(start_temp);
  // declare relevant variables
  var adiabat = [];
  // loop through the pressure grid and find each temp value
  // since theta must remain the same along an adiabat.
  for (i=0;i<pres_grid.length;i++){
    let pres = hPa2Pa(pres_grid[i]);
    temp = theta * Math.pow((pres/p0),k);
    adiabat.push(K2C(temp));
  } // end for loop
  return adiabat;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_moist_adiabat(temp,stnd_pres,pres_grid){
  // get the base theta-e
  var adiabat = [];
  var theta_e = equivalent_potential_temperature(temp,stnd_pres);
  pres_grid.forEach(function(pres){
    // find theta
    let theta = poisson_equation(temp,pres);
    let termA = (theta_e - theta)/cp;
    let termB = Math.log(theta)/Math.log(theta_e);
    let t = termA * termB;
    adiabat.push(K2C(t));
  });
  return adiabat;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function equivalent_potential_temperature(temp,dewp,pres){
  // from: G. Petty, "A first course in Atmospheric Thermodynamics" page 203.
  // find a more appropriate value of Lv
  if (temp <= -40.0){
    lvapor = 2600.0 * 1000.0;
  } else if (temp <= 0.0){
    lvapor = 2500.0 * 1000.0;
  } else {
    lvapor = 2400.0 * 1000.0;
  }
  // find mixing ratio
  var w = mixing_ratio_from_dewpoint(dewp,pres)/1000.0; // convert to kg/kg
  // find theta
  let theta = poisson_equation(temp,pres);
  let theta_e = (1.0 + (lvapor*w)/(cp*C2K(temp))) * theta;
  return theta_e;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function equivalent_potential_temperature_2(temp,dewp,pres){
  // from: djburnette.com/waether/wxcalc/thetae.html
  // find mixing ratio
  var w = mixing_ratio_from_dewpoint(dewp,pres);
  // find theta
  let theta = poisson_equation(temp,pres);
  let theta_e = theta + 3*w;
  return theta_e;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function sat_vapor_pres(temp){
  // input temp must be in deg C!
  //var power = (17.67*temp)/(243.5+temp);
  //return Math.pow(611.2,power);
  var power = (7.5 * temp)/(237.5 + temp);
  //return hPa2Pa(6.11 * Math.pow(10,power));
  return hPa2Pa(6.11 * Math.exp(power));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixing_ratio(es,pres){
  pres = hPa2Pa(pres);
  return (epsilon*es)/pres;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function create_isotherm(temp,stnd_pres,pres_grid,slope){
  var isotherm = [];
  pres_grid.forEach(function(pres){
    let t = temp_transform(temp,stnd_pres,pres,slope)
    isotherm.push(t);
  });
  return isotherm;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function poisson_equation(temp,pres){
  // Return the potential temperature of a temperature value at a given
  // pressure level. Assumes input temp is in C and input pres in hPa
  const k = 0.285; // Poisson constant for dry air
  const p0 = 100000.0;// 1000 hPa in Pa
  // Do conversions
  pres = pres * 100.0; // hPa to Pa
  temp = C2K(temp); // F to Kelvin
  // Do the calculation
  var pres_term = pres/p0;
  pres_term = Math.pow(pres_term,-k);
  return temp * pres_term;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function relh_from_temp_dewp(temp,dewp){
  // Assumes temp/dewp are in deg C.
  // Based off the formula here: http://bmcnoldy.rsmas.miami.edu/Humidity.html
  // 100 * (EXP((17.625*TD) / (243.04+TD)) / EXP((17.625*T) / (243.04+T))
  //           Term 1           term 2           term 3          term 4
  var term1 = 17.625 * dewp;
  var term2 = 243.04 + dewp;
  var term3 = 17.625 * temp;
  var term4 = 243.04 + temp;
  relh = 100.0 * (Math.exp(term1/term2) / Math.exp(term3/term4));
  return relh;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function hPa2Pa(pres){
  // convert pressure in hPa to Pa
  return pres * 100.0;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function F2C(temp){
  // convert temperature in F to C
  return (temp - 32.0) * (5.0/9.0)
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function C2K(temp){
  // convert temperature in C to Kelvin
  return temp + 273.15
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function C2F(temp){
  // convert temperature in C to F
  return (temp * (9.0/5.0)) + 32.0
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function F2K(temp){
  // convert temp in F to Kelvin
  return C2K(F2C(temp))
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function K2F(temp){
  // convert temperature in Kelvin to F
  return C2F(temp - 273.15);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function K2C(temp){
  // convert temperature in Kelvin to C
  return temp - 273.15;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function knot2ms(knot){
  return knot * 0.514444;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function ms2knot(ms){
  return ms * 1.943844;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function dewpoint_depression(data){
  return C2F(data.temperature[0]) - C2F(data.dewpoint[0]);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_closest(values,target){
  // function that returns the index of the element that has
  // the smallest element-wise difference from the target value.
  // If an exact match is found, the index of the first exact match is returned.
  let smallest_diff = 10000.0;
  let closest_ind = 0;
  for(i=0;i<values.length;i++){
    let diff = Math.abs(values[i]-target);
    if (diff == 0.0){
      return i;
    }
    else if (diff < smallest_diff){
      smallest_diff = diff;
      closest_ind = i;
    }
  }
  return closest_ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function bulk_wind_difference(u,v,heights,lower_level,upper_level){
  // Returns the bulk wind difference between two height levels.
  // Output BWD is in the same units as the input u and v wind speeds.
  //// First, find the index of the lower and upper height levels.
  let lower_ind = find_closest(heights,lower_level);
  let upper_ind = find_closest(heights,upper_level);
  //// Find the u difference between the upper and lower levels.
  let u_diff = u[upper_ind] - u[lower_ind];
  //// Find the v difference between the upper and lower levels.
  let v_diff = v[upper_ind] - v[lower_ind];
  //// Find the magnitude of this shear vector
  let magnitude = Math.sqrt(Math.pow(u_diff,2)+Math.pow(v_diff,2))
  return magnitude;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lapse_rate(temperatures,heights,lower_level,upper_level,pressures=null){
  // Returns the lapse rate between the upper and lower levels.
  if (pressures != null){
    lower_ind = find_closest(pressures,lower_level);
    upper_ind = find_closest(pressures,upper_level);
  } else {
    lower_ind = find_closest(heights,lower_level);
    upper_ind = find_closest(heights,upper_level);
  }
  let temp_diff = temperatures[upper_ind] - temperatures[lower_ind];
  let height_diff = (heights[upper_ind] - heights[lower_ind])/1000.0;
  return -1.0*temp_diff/height_diff;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixing_ratio_from_dewpoint(dewpoint,pressure){
  // using equation 7.22 from G. Petty "A First Course in Atmospheric Thermodynamics" p. 185
  vapor_pres = vapor_pressure(dewpoint)
  return epsilon * (vapor_pres/(hPa2Pa(pressure)-vapor_pres)) * 1000.0; // return value in g/kg
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function vapor_pressure(temp){
  // using equation 7.19 from G. Petty "A First Course in Atmospheric Thermodynamics" p. 183
  // Temperature must be in C. Returns e in Pa, not hPa
  let power = (17.67 * temp)/(temp + 243.5);
  return 611.2*Math.exp(power);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function vapor_pressure_2(temp){
  let diff = (1.0/273.16) - (1.0/C2K(temp));
  return 611.12 * Math.exp((Lv/Rd)*diff);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function specific_humidity_from_mixing_ratio(mixing_ratio){
  mixing_ratio = mixing_ratio / 1000.0 // convert to kg/kg
  return mixing_ratio/(1.0+mixing_ratio);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function total_precipitable_water(mixing_ratios,pressures){
  // returns total column precipitable water.
  var sum = 0;
  for (i=0;i<mixing_ratios.length-1;i++){
    // add up [(average mixing ratio in layer) * depth of layer] for each layer
    sum = sum + (((mixing_ratios[i]+mixing_ratios[i+1])/2.0) * (pressures[i] - pressures[i+1]));
  }
  // since we're not converting pressure from hPa to Pa, the result is given in dm instead of mm.
  var pwat = sum / (rho_water_liquid * gravity);
  return pwat * 3.93701; // convert from dm to inches and return
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function trapezoid_integration(x,y){
  // adapted from the python version of trapezoidal integration from here:
  // https://pythonnumericalmethods.berkeley.edu/notebooks/chapter21.03-Trapezoid-Rule.html
  let h = (x[0] - x[x.length-1])/(x.length-1);
  let last_ind = y.length - 1;
  let sum = sum_loop(y.slice(1,last_ind));
  return (h/2.0) * (y[0] + (2.0 * sum) + y[last_ind]);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function sum_loop(values){
  let accum = 0;
  for(i=0;i<values.length;i++){
    accum = accum + values[i];
  }
  return accum;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mixed_layer_mean_mixing_ratio(mixing_ratios,pressures,layer_depth_mb=100.0){
  // return the mean mixing ratio of the mixed-layer parcel (defaults to a depth of 100mb).
  var mixed_layer_top = pressures[0] - layer_depth_mb;
  var top_ind = find_closest(pressures,mixed_layer_top);
  var sum = 0;
  for (i=0;i<top_ind;i++){
    sum = sum + mixing_ratios[i];
  }
  return sum/top_ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function parcel_trace(temps,dewps,pressures,heights,theta_es,type="surface"){
  // Lift a parcel dry adiabatically until the saturation vapor pressure is the
  // same as the initial vapor pressure. Then lift the parcel moist adiabatically
  // through the rest of the profile.
  // parcel type is determined by the "type" variable.
  if (type == "surface"){
    // lift a surface-based parcel
    let parcel_temp = temps[0];
    let parcel_dewp = dewps[0];
    let e = vapor_pressure(parcel_dewp);
    let es = vapor_pressure(parcel_temp);
    parcel_temps = [virtual_temperature_from_vapor_pressure(parcel_temp,pressures[0],e)];
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,pressures[0]);
    // we know for dry adiabatic ascent, theta is constant at each pressure level.
    // So, find temperature from each theta/pressure combo and check for saturation.
    for (i=1;i<pressures.length;i++){
      if (e <= es){
        // unsaturated, lift dry adiabatically
        parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
        //es = sat_vapor_pres(parcel_temp);
        es = vapor_pressure(parcel_temp);
        tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],e);
      } else {
        // saturated, lift moist/psuedo adiabatically
        //lr = psuedo_adiabatic_lapse_rate(parcel_temp,pressures[i]);
        //parcel_temp = parcel_temp - (lr * ((heights[i] - heights[i-1])/1000.0));
        parcel_temp = iterative_moist_ascent(parcel_temp,pressures[i-1],pressures[i]);
        // update es and virtual temp
        es = vapor_pressure(parcel_temp);
        tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],es);
      }
      parcel_temps.push(tv);
    }
    return parcel_temps;

  } else if (type == "mixed"){
    // lift a mixed-layer parcel using the lowest 100 mb
    // First, find the temp, dewp, and pressure of the mixed-layer parcel.
    // We'll lift it from the ml parcel pressure (may or may not be a good assumption).
    let ml_top_pres = pressures[0] - 100.0;
    // to cut down on search time, only search through the lowest 10 pressures.
    let ml_top_ind = find_closest(pressures.slice(0,10),ml_top_pres);
    // Find the average theta and the average mixing ratio
    // thetas = 0.0;
    // mixrs = 0.0;
    // for (j=0;j<ml_top_ind;j++){
    //   thetas = thetas + poisson_equation(temps[j],pressures[j]);
    //   mixrs = mixrs + mixing_ratio_from_dewpoint(temps[j],dewps[j]);
    // }
    let parcel_temp = average(temps.slice(0,ml_top_ind));
    let parcel_dewp = average(dewps.slice(0,ml_top_ind));
    let parcel_pres = average(pressures.slice(0,ml_top_ind));
    // find the middle pressure of the mixed layer.
    // That's where we'll start lifting from
    let ml_middle_ind = find_closest(pressures.slice(0,ml_top_ind),parcel_pres);
    let e = vapor_pressure(parcel_dewp);
    let es = vapor_pressure(parcel_temp);
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,parcel_pres);
    parcel_vt = virtual_temperature_from_vapor_pressure(parcel_temp,parcel_pres,e);
    parcel_temps = [parcel_vt];
    parcel_press = [pressures[ml_middle_ind]];
    // start lifting!
    for (i=ml_middle_ind+1;i<pressures.length;i++){
      if (pressures[i] >= 100.0){
        if (e <= es){
          // unsaturated, lift dry adiabatically
          parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
          es = vapor_pressure(parcel_temp);
          tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],e);
        } else {
          // saturated, lift moist/psuedo adiabatically
          parcel_temp = iterative_moist_ascent(parcel_temp,pressures[i-1],pressures[i]);
          es = vapor_pressure(parcel_temp);
          tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],es);
        }
        parcel_temps.push(tv);
        parcel_press.push(pressures[i]);
      } // end if pressure > 100 mb
    } // end for loop
    return [parcel_temps,parcel_press];

  } else if (type == "most_unstable"){
    // Note that we need to return the pressure levels associated with each
    // temperature level since the MU parcel may or may not be at the surface.
    // lift the layer with the max theta-e within the lowest 300 mb (in line with SPC methodology)
    let ind_top = find_closest(pressures,(pressures[0]-300.0));
    let max_ind = find_max(theta_es.slice(0,ind_top));
    parcel_temps = [];
    parcel_press = [];
    let parcel_temp = temps[max_ind];
    let parcel_dewp = dewps[max_ind];
    let e = vapor_pressure(parcel_dewp);
    let es = vapor_pressure(parcel_temp);
    // find the starting theta.
    parcel_theta = poisson_equation(parcel_temp,pressures[max_ind]);
    // if (max_ind == 0){
    //   i = 1;
    // } else {
    //   i = max_ind;
    // }
    for (i=max_ind;i<heights.length;i++){
      if (pressures[i] >= 100.0){
        //console.log(e,es,pressures[i],parcel_temp);
        if (e <= es){
          // unsaturated, lift dry adiabatically
          parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
          es = vapor_pressure(parcel_temp);
          tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],e);
        } else {
          // saturated, lift moist/psuedo adiabatically
          parcel_temp = iterative_moist_ascent(parcel_temp,pressures[i-1],pressures[i]);
          es = vapor_pressure(parcel_temp);
          tv = virtual_temperature_from_vapor_pressure(parcel_temp,pressures[i],es);
        }
        parcel_temps.push(tv);
        parcel_press.push(pressures[i]);
      } // end if press > 100 mb
    } // end for loop
    return [parcel_temps,parcel_press];
  } else {
    // return error message
    console.error("ERROR: Invalid parcel type!")
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_temperature(temp,dewp,heights){
  // We know that the mixing ratio remains the same in dry adiabatic ascent. So, we can cool the parcel
  // adiabatically until the saturation vapor pressure is the same as the vapor pressure of the parcel
  // at the surface.
  var e = sat_vapor_pres(dewp);
  var es = sat_vapor_pres(temp);
  for (i=1;i<heights.length;i++){
    temp = temp - (9.8 * ((heights[i] - heights[i-1])/1000.0));
    es = sat_vapor_pres(temp);
    if (e >= es){
      return temp;
    }
  }
  return undefined;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_height(start_temp,start_dewp,start_pres,pressures,heights){
  let parcel_theta = poisson_equation(start_temp,start_pres);
  let e = sat_vapor_pres(start_dewp);
  let es = sat_vapor_pres(start_temp);
  let start_ind = find_closest(pressures,start_pres);
  for (i=start_ind;i<heights.length;i++){
    if (e >= es){
      return heights[i];
    } else {
      parcel_temp = K2C(theta_to_temp(parcel_theta,pressures[i]));
      es = sat_vapor_pres(parcel_temp);
    }
  }
  console.log("Warning: Could not find LCL height!")
  return null;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function lcl_pressure(temp,lcl_temp,pressure){
  // Returns LCL pressure level, taken from here: https://weathercsi.net/uploads/3/1/8/6/3186623/rh_q_e_lcl_overview.pdf
  pressure = hPa2Pa(pressure);
  lcl_pres = pressure * Math.pow((C2K(lcl_temp)/C2K(temp)),(cp/Rd));
  return lcl_pres / 100.0; // convert from Pa to hPa
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function psuedo_adiabatic_lapse_rate(temperature,pressure){
  // from G. Petty "A First Course in Atmospheric Thermodynamics" p. 201
  mixing_ratio = mixing_ratio_from_dewpoint(temperature,pressure); // mixing ratio in g/kg
  mixing_ratio = mixing_ratio / 1000.0; // convert to kg/kg
  dry_adiabatic_lr = 9.8; // dT/dz
  numerator = 1.0 + ((Lv*mixing_ratio)/(Rd*C2K(temperature)));
  denominator = 1.0 + (Math.pow(Lv,2)*mixing_ratio)/(Rv*cp*Math.pow(C2K(temperature),2.0));
  return dry_adiabatic_lr * numerator/denominator;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function psuedo_adiabatic_lapse_rate_2(temperature,pressure){
  // from glossary.ametsoc.org/wiki/Adiabatic_lapse_rate
  // currently does not work properly
  mixing_ratio = mixing_ratio_from_dewpoint(temperature,pressure); // mixing ratio in g/kg
  mixing_ratio = mixing_ratio / 1000.0; // convert to kg/kg
  numerator = Rd*C2K(temperature) + Lv*mixing_ratio;
  denominator = cp + (Math.pow(Lv,2)*mixing_ratio*epsilon)/(Rd*Math.pow(C2K(temperature),2));
  return numerator/denominator/hPa2Pa(pressure);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function wobus_function(temperature){
  // from sharppy.github.io/SHARPpy/_modules/sharppy/sharptab/thermo.html
  temperature = temperature - 20.0;
  if (temperature <= 0.0){
    correction = 1.0 + temperature * (-8.41660499999*Math.pow(10,-3) + temperature * (1.4714143*Math.pow(10,-4) + temperature * (-9.671989000000001*Math.pow(10,-7) + temperature * (-3.2607217*Math.pow(10,-8) + temperature * -3.8598073*Math.pow(10,-10)))));
    correction = 15.13/Math.pow(correction,4);
    return correction;
  } else {
    correction = temperature * (4.9618922*Math.pow(10,-7) + temperature * (-6.1059365*Math.pow(10,-9) + temperature * (3.9401551*Math.pow(10,-11) + temperature * (-1.2588129*Math.pow(10,-13) + temperature * (1.6688280*Math.pow(10,-16))))));
    correction = 1.0 + temperature * (3.6182989*Math.pow(10,-5) + temperature * (-1.3603273*Math.pow(10,-5) + correction));
    correction = (29.93/Math.pow(correction,4)) + (0.96 * temperature) - 14.8;
    return correction;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function iterative_moist_ascent(temperature,pressure1,pressure2){
  // This routine is an iterative approach to moist parcel ascent by finding
  // the theta-e using the initial temperature and pressure level 1, and then
  // interatively testing until you match that same theta-e value with the 2nd
  // pressure level and a new temperature
  increment = 0.1 // Deg C or K
  error = 100.0;
  max_tries = 1000; // maximum number of tries before giving up!
  total_tries = 0;
  target_theta_e = equivalent_potential_temperature_2(temperature,temperature,pressure1);
  while (error > 0.0 && total_tries < max_tries){
    temperature = temperature - increment;
    new_theta_e = equivalent_potential_temperature_2(temperature,temperature,pressure2);
    error = new_theta_e - target_theta_e;
    total_tries = total_tries + 1;
    //console.log(target_theta_e,new_theta_e,error,total_tries)
  }
  return temperature;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function saturation_specific_humidity(es,p){
  // from: https://blogs.millersville.edu/adecaria/files/2021/11/esci341_lesson16_pseudoadiabatic_processes.pdf
  p = p * 100.0; // convert to Pa
  return (epsilon*es)/p;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function virtual_temperature(temperature,mixing_ratio){
  // from G. Petty "A First Course in Atmospheric Thermodynamics" p. 76
  // will return virtual temp in C.
  return K2C(C2K(temperature) * (1.0 + (0.61*mixing_ratio/1000.0)));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function virtual_temperature_from_vapor_pressure(temperature,pressure,vapor_pressure){
  // from G. Petty "A First Course in Atmospheric Thermodynamics" p. 76
  // will return virtual temp in C.
  let mixing_ratio = (621.97*vapor_pressure)/(hPa2Pa(pressure)-vapor_pressure)/1000.0;
  return K2C(C2K(temperature) * (1.0 + (0.61*mixing_ratio)));
  //return K2C(C2K(temperature)/(1.0-(vapor_pressure/hPa2Pa(pressure)*(1.0-epsilon))));
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_max(array){
  let max = 0;
  let ind = 0;
  for (i=0;i<array.length;i++){
    if (array[i] > max){
      max = array[i];
      ind = i;
    }
  }
  return ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function find_min(array){
  let min = 0;
  let ind = 0;
  for (i=0;i<array.length;i++){
    if (array[i] < min){
      max = array[i];
      ind = i;
    }
  }
  return ind;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function average(values){
  sum = 0;
  for (i=0;i<values.length;i++){
    sum = sum + values[i];
  }
  return sum/values.length;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function cape_cin(env_pres,env_height,env_temp,parcel_pres,parcel_temp){
  // using the formulation from here: https://www.inscc.utah.edu/~krueger/5300/CAPE.pdf
  // first, we'll want to find the EL so we can know when to stop (i.e. we dont' want
  // to include the area above the EL in our CIN calculation).
  let start = find_closest(env_pres,parcel_pres[0]);
  let el_ind = el_index(env_pres,env_temp,parcel_pres,parcel_temp)
  //console.log(start,el_ind);
  //console.log(env_temp[start],parcel_temp[start])
  // Now we can start to calculate cape/cin, starting from the start ind and
  // stopping at the el_ind.
  let cape = 0;
  let cin = 0;
  for (i=start+1;i<el_ind;i++){
    dz = env_height[i] - env_height[i-1];
    b = gravity * (parcel_temp[i-start]-env_temp[i])/C2K(env_temp[i]);
    if (b*dz < 0){
      cin = cin + (b*dz);
    } else {
      cape = cape + (b*dz);
    }
  }
  return [cape,cin];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function el_index(env_pres,env_temp,parcel_pres,parcel_temp){
  // To find the EL we'll see where the env temp and parcel temps are the same, then
  // find the lowest pressure for each zero point.
  let start = find_closest(env_pres,parcel_pres[0]);
  let min_pressure = 100.0 // mb - pressure level at which to stop looking for EL
  let el_ind = 0;
  global_sign = true;
  local_sign = true;
  for (i=start;env_pres[i] >= min_pressure;i++){
    diff = env_temp[i] - parcel_temp[i-start];
    if (diff < 0){
      local_sign = false;
    } else {
      local_sign = true;
    }
    if (local_sign != global_sign){
      el_ind = i;
      global_sign = local_sign;
    }
    //console.log(env_pres[i],parcel_pres[i-start]);
    //console.log(i,env_temp[i],parcel_temp[i],diff,local_sign,global_sign,el_ind,env_pres[el_ind]); // for debugging
  }
  if (el_ind == 0){
    el_ind = find_closest(env_pres,min_pressure);
  }
  return el_ind;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function theta_to_temp(theta,pres){
  // an inversion of the poisson equation for temperature (returned in K).
  return Math.pow((P0/pres),(-Rd/cp)) * theta;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function storm_motions(u,v,pressure,height){
  // My own formulation for bunker's storm motions. Similar to the Metpy version, this follows Bunkers et al. 2000
  // and returns the U and V components of the right, left, and mean storm motions in m/s.
  // There are two exceptions: The first is that pressure-weighting is used as described in Bunkers et al. 2014.
  // The second is that here I'm using the 0-6 km shear vector instead of the 0-0.5 to 5.5-6 km shear vector in
  // order to cut down on computational time (these vectors are typically fairly similar).
  let deviation = 7.5 // m/s
  let pressure_weighted_u = [];
  let pressure_weighted_v = [];
  let mmr_u = []; // mean motion realtive
  let mmr_v = [];
  // first, find the height level closest to 6 km
  ind_6k = find_closest(height,6000.0);
  ind_12k = find_closest(height,12000.0);
  // find the mean pressure in this layer
  mean_pressure = average(pressure.slice(0,ind_6k));
  // Find the pressure weighted U and V wind profiles (be sure to convert to m/s).
  for (i=0;i<=ind_6k;i++){
    pressure_weighted_u.push(knot2ms(u[i])*pressure[i]/mean_pressure);
    pressure_weighted_v.push(knot2ms(v[i])*pressure[i]/mean_pressure);
  }
  // find the mean pressure weighted wind u/v values
  mean_u = average(pressure_weighted_u);
  mean_v = average(pressure_weighted_v);
  // convert the profile from ground-relative to mean-storm-motion relative
  for (i=0;i<pressure_weighted_u.length;i++){
    mmr_u.push(u[i] - mean_u);
    mmr_v.push(v[i] - mean_v);
  }
  // Find the 0-6 km bulk shear vector
  u_shear = mmr_u[ind_6k] - mmr_u[0];
  v_shear = mmr_v[ind_6k] - mmr_v[0];
  // find the orthogonal angle between the shear vector and the mean motion (now at the origin);
  theta_s = Math.atan2(v_shear,u_shear) * (180.0/Math.PI); // convert from radians to degrees
  // find the right-mover
  angle = (Math.PI/180.0) * (180.0-(theta_s-90.0));
  rmv = deviation * Math.sin(angle);
  rmu = -1.0 * deviation * Math.cos(angle);
  // find the left mover
  angle = (Math.PI/180.0) * (180.0-(theta_s+90.0));
  lmv = deviation * Math.sin(angle);
  lmu = -1.0 * deviation * Math.cos(angle);
  // convert all motions back to ground-relative and to knots
  rmu = ms2knot(rmu + mean_u);
  rmv = ms2knot(rmv + mean_v);
  lmu = ms2knot(lmu + mean_u);
  lmv = ms2knot(lmv + mean_v);
  mean_u = ms2knot(mean_u);
  mean_v = ms2knot(mean_v);
  return [average(u.slice(0,ind_12k)),average(v.slice(0,ind_12k)),rmu,rmv,lmu,lmv];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function storm_relative_helicity(u,v,storm_u,storm_v,height,layer_bottom,layer_top){
  // Find the storm relative helicity given a storm motion of (storm_u,storm_v).
  // Follows the formulation from metPy: https://unidata.github.io/MetPy/latest/api/generated/metpy.calc.storm_relative_helicity.html
  // Have a check to make sure the dept of the layer makes sense
  if (layer_top > height[height.length-1]){
    console.error("ERROR: the requested layer for the SRH calculation is greater than the height of the input data!");
    return null;
  }
  // Find the height of the desired depth
  ind_bottom = find_closest(height,layer_bottom);
  ind_top = find_closest(height,layer_top);
  srh = 0;
  // loop through the layer and find SRH (don't forget to convert from knots to m/s!)
  for(i=ind_bottom;i<ind_top;i++){
    layer_value = (knot2ms(u[i+1])-knot2ms(storm_u))*(knot2ms(v[i])-knot2ms(storm_v)) - (knot2ms(u[i])-knot2ms(storm_u))*(knot2ms(v[i+1])-knot2ms(storm_v));
    srh = srh + layer_value;
  }
  return srh;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function effective_inflow_layer(temp,dewp,pressure,height){
  // Return the bottom and top indices of the effective inflow layer
  // We'll do this by lifting every parcel and seeing if it satisfies our cape/cin criteria.
  min_cape = 100.0;
  min_cin = -250.0;
  start = -999;
  end = -999;
  eff_layer_found = false;
  // first, find the index of the 100 mb level since we don't care about instability above this level.
  ind_100 = find_closest(pressure,100.0);
  for (j=0;j<ind_100;j++){
    t = temp.slice(j,ind_100);
    d = dewp.slice(j,ind_100);
    p = pressure.slice(j,ind_100);
    h = height.slice(j,ind_100);
    if (t.length > 5){ // added this check to make sure there's a sufficent amount of data.
      parcel_temps = parcel_trace(t,d,p,h,t,"surface");
      params = cape_cin(p,h,t,p,parcel_temps);
      //console.log(j,pressure[j],start,eff_layer_found,params[0],params[1]);
      if (eff_layer_found == false && params[0] >= min_cape && params[1] >= min_cin){
        eff_layer_found = true;
        start = j;
      } else if (eff_layer_found == true && params[0] < min_cape || params[1] < min_cin){
        return [start,j-1]
      } else {
        // continue searching
      }
    }
  } // end loop
  return [start,end];
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function effective_bulk_shear(eff_base_ind,u,v,heights,env_temp,env_pres,parcel_temp,parcel_pres){
  // Following the formulation from here: https://www.spc.noaa.gov/exper/mesoanalysis/help/help_eshr.html
  // find the EL
  el_ind = el_index(env_pres,env_temp,parcel_pres,parcel_temp)
  // Find 50% of the depth between the effective inflow base and the EL

  halfway_height = (heights[el_ind] + heights[eff_base_ind])/2.0;
  halfway_ind = find_closest(heights,halfway_height);
  // Find the BWD between the effective inflow layer base and 50% of the eff. inf. layer base and the EL layer.
  bwd = bulk_wind_difference(u,v,heights,heights[eff_base_ind],heights[halfway_ind]);
  return bwd;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function supercell_composite_parameter(eff_bwd,eff_srh,mu_cape,mu_cin){
  // Following the methodology from here: https://www.spc.noaa.gov/exper/mesoanalysis/help/help_scp.html
  // Note that I'm converting the scaling factors in the eff BWD term to knots to match units.
  if (eff_bwd < 19.43){
    return 0.0;
  } else if (eff_bwd > 38.876){
    if (mu_cin > -40.0){
      return (mu_cape/1000.0) * (eff_srh/50.0);
    } else {
      return (mu_cape/1000.0) * (eff_srh/50.0) * (-40.0/mu_cin);
    }
  } else {
    if (mu_cin > -40.0){
      return (mu_cape/1000.0) * (eff_srh/50.0) * (eff_bwd/38.876);
    } else {
      return (mu_cape/1000.0) * (eff_srh/50.0) * (eff_bwd/38.876) * (-40.0/mu_cin);
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function significant_tornado_parameter(lcl_height,eff_layer_base,eff_bwd,eff_srh,mlcape,mlcin){
  // Effective layer STP. Using formulation from here: https://www.spc.noaa.gov/exper/mesoanalysis/help/help_stpc.html
  // Note that I convert all of the eff bwd scaling factors from m/s to knots.
  // Note that I also allow for eff. inflow layers to start up to 100 m off the ground.
  // peform checks to make sure STP does not need to be set to zero.
  if (lcl_height > 2000.0 || eff_layer_base > 100.0 || mlcin < -200.0 || eff_bwd < 24.298){
    return 0.0;
  } else {
    // LCL Check
    if (lcl_height < 1000.0){
      lcl_term = 1.0;
    } else {
      lcl_term = (2000.0-lcl_height)/1000.0;
    }
    // Eff BWD Check
    if (eff_bwd > 58.3153){
      eff_bwd_term = 1.5;
    } else {
      eff_bwd_term = eff_bwd / 38.876;
    }
    // MLCIN Check
    if (mlcin > -50.0){
      mlcin_term = 1.0;
    } else {
      mlcin_term = (200.0+mlcin)/150.0;
    }
    return (mlcape/1500.0) * lcl_term * (eff_srh/150.0) * eff_bwd_term * mlcin_term;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
function wet_microburst_parameter(env_temp,env_pres,parcel_temp,parcel_pres,mlcin,bwd_1km){
  // Based on pesonal reseach, no current citation available (besides my own mind!).
  // Find the ML EL Temp first, it's the only component we don't have.
  let el_ind = el_index(env_pres,env_temp,parcel_pres,parcel_temp);
  let ml_el_temp = env_temp[el_ind];
  // get surface temperature
  let sfc_temp  = env_temp[0];
  // find product of terms
  // note that the bwd_1km term is scaled by 2.0 m/s converted to knots (3.887 knots).
  let wmp = (ml_el_temp/-60.0) * (sfc_temp/30.0) * ((50.0+mlcin)/25.0) * (bwd_1km/3.887);
  if (wmp < 0.0){
    return 0.0;
  } else {
    return wmp;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
