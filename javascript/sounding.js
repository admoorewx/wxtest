class Sounding{
  constructor(data){
    if (data == null){
      this.stid = "None";
      this.datetime = "None";
      this.lat = "None";
      this.lon = "None";
      this.elevation = "None";
      this.pressure = [];
      this.height = [];
      this.temperature = [];
      this.dewpoint = [];
      this.u = [];
      this.v = [];
    }
    else {
      this.stid = data.id;
      this.datetime = data.datetime;
      this.lat = data.lat;
      this.lon = data.lon;
      this.elevation = data.elevation;
      this.pressure = data.pressure;
      this.height = data.height;
      this.temperature = data.temperature;
      this.dewpoint = data.dewpoint;
      this.u = data.u_wind;
      this.v = data.v_wind;
    }
  } // end constructor

  print(){
    console.log(`${this.stid} valid at ${this.datetime}.`);
    console.log(`Lat: ${this.lat}, Lon: ${this.lon}`);
    console.log(`Number of data levels: ${this.pressure.length}`);
  } // end print

  derived_profiles(){
    // Create additional derived profiles. Use a single loop to cut down on computation time.
    this.theta_e = [];
    this.virtual_temp = [];
    this.mixing_ratio = [];
    // be sure to check for the null sounding case.
    if (this.pressure.length > 0){
      for (i=0;i<this.pressure.length;i++){
        this.theta_e.push(equivalent_potential_temperature_2(this.temperature[i],this.dewpoint[i],this.pressure[i]));
        this.mixing_ratio.push(mixing_ratio_from_dewpoint(this.dewpoint[i],this.pressure[i]));
        this.virtual_temp.push(virtual_temperature_from_vapor_pressure(this.temperature[i],this.pressure[i],vapor_pressure(this.dewpoint[i])));
      } // end loop
    }
  } // end derived profiles

  get_mean_mixing_ratio(){
    // determine the mean mixing ratio. By deafult, this is the mean mixing ratio of the lowest 100 mb.
    try{
      this.ml_mixing_ratio = mixed_layer_mean_mixing_ratio(this.mixing_ratio,this.pressure,100.0);
    } catch {
      console.error("ERROR: A mixing ratio profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end mixed layer mean mixing ratio

  get_pwat(){
    // determine the total column precipitable water from the sounding
    try{
      this.pwat = total_precipitable_water(this.mixing_ratio,this.pressure);
    } catch {
      console.error("ERROR: A mixing ratio profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end get_pwat

  get_bulk_wind_differences(){
    // determine the bulk wind differences for the 0-1, 0-3, and 0-6 km layers.
    this.bwd_01 = bulk_wind_difference(this.u,this.v,this.height,0.0,1000.0);
    this.bwd_03 = bulk_wind_difference(this.u,this.v,this.height,0.0,3000.0);
    this.bwd_06 = bulk_wind_difference(this.u,this.v,this.height,0.0,6000.0);
  } // end get_bulk_wind_differences

  get_dewpoint_depression(){
    // determine the dewpoint depression in F
    this.dewpoint_depression = C2F(this.temperature[0]) - C2F(this.dewpoint[0]);
  } // end get_dewpoint_depression

  get_lapse_rates(){
    // determine the lapse rates for the 0-3 km layer and the 700-500 mb layer
    this.lr_03 = lapse_rate(this.temperature,this.height,0.0,3000.0);
    this.lr_700_500 = lapse_rate(this.temperature,this.height,700.0,500.0,this.pressure);
  } // end get_lapse_rates

  get_sb_parcel_trajectory(){
    // determine the surface-based parcel trajectory/temperature trace.
    // Note that the pressure levels that correspond to each temperature value
    // is the same as this.pressure.
    //try {
      // check for the null sounding case
    if (this.pressure.length > 0){
      this.sb_parcel_trace = parcel_trace(this.temperature,this.dewpoint,this.pressure,this.height,this.theta_e,"surface");
    } else {
      this.sb_parcel_trace = [];
    }
    // } catch {
    //   console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    // }
  } // end get_sb_parcel_trajectory
  get_mu_parcel_trajectory(){
    // determine the most-unstable parcel trajectory/temperature trace.
    // Note that we need to save the pressure levels associated with each
    // temperature level since the MU parcel may not be at the surface.
    try {
      // check for the null sounding case.
      if (this.pressure.length > 0){
        this.mu_parcel_info = parcel_trace(this.temperature,this.dewpoint,this.pressure,this.height,this.theta_e,"most_unstable");
      } else {
        this.mu_parcel_info = [];
      }
    } catch {
      console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    }
  } // end get_sb_parcel_trajectory
  get_ml_parcel_trajectory(){
    // determine the mixed-layer parcel trajectory/temperature trace.
    // Note that we need to save the pressure levels associated with each
    // temperature level since the ML parcel may not be at the surface.
    // try {
      // check for the null sounding case.
    if (this.pressure.length > 0){
      this.ml_parcel_info = parcel_trace(this.temperature,this.dewpoint,this.pressure,this.height,this.theta_e,"mixed");
    } else {
      this.ml_parcel_info = [];
    }
    // } catch {
    //   console.error("ERROR: A theta-e profile has not be created for this sounding! Run derived_profiles first.");
    // }
  }
  get_sbcape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.sb_cape = cape_cin(this.pressure,this.height,this.virtual_temp,this.pressure,this.sb_parcel_trace);
    } else {
      this.sb_cape = [0.0,0.0];
    }
  } // end get_sbcape
  get_mlcape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.ml_cape = cape_cin(this.pressure,this.height,this.virtual_temp,this.ml_parcel_info[1],this.ml_parcel_info[0]);
    } else {
      this.ml_cape = [0.0,0.0];
    }
  } // end get_mlcape
  get_mucape(){
    // check for the null case
    if (this.pressure.length > 0){
      this.mu_cape = cape_cin(this.pressure,this.height,this.virtual_temp,this.mu_parcel_info[1],this.mu_parcel_info[0]);
    } else {
      this.mu_cape = [0.0,0.0];
    }
  } // end get_mucape
  get_storm_motions(){
    this.storm_motions = storm_motions(this.u,this.v,this.pressure,this.height);
    this.mean_storm_motion  = [this.storm_motions[0],this.storm_motions[1]];
    this.right_storm_motion = [this.storm_motions[2],this.storm_motions[3]];
    this.left_storm_motion  = [this.storm_motions[4],this.storm_motions[5]];
  } // end get storm motions
  get_srh(){
    if (this.mean_storm_motion[0] == undefined){
      get_storm_motions();
    }
    this.srh_01 = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,0.0,1000.0);
    this.srh_03 = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,0.0,3000.0);
  } // end get SRH
  get_effective_inflow_layer(){
    this.eff_layer = effective_inflow_layer(this.virtual_temp,this.dewpoint,this.pressure,this.height);
  }
  get_effective_srh(){
    this.eff_srh = storm_relative_helicity(this.u,this.v,this.right_storm_motion[0],this.right_storm_motion[1],this.height,this.height[this.eff_layer[0]],this.height[this.eff_layer[1]]);
  }
  get_effective_bwd(){
    if (this.temperature.length > 0){
      try {
        this.eff_bwd = effective_bulk_shear(this.eff_layer[0],this.u,this.v,this.height,this.temperature,this.pressure,this.ml_parcel_info[0],this.ml_parcel_info[1]);
      } catch {
        console.error("Error: either the effective inflow layer or the mixed-layer parcel information has not been found for this sounding.");
      }
    }
  }
  get_scp(){
    if (this.temperature.length > 0){
      try {
        this.scp = supercell_composite_parameter(this.eff_bwd,this.eff_srh,this.mu_cape[0],this.mu_cape[1]);
      } catch {
        this.get_mu_parcel_trajectory();
        this.get_mucape();
        this.get_effective_inflow_layer();
        this.get_effective_bwd();
        this.get_effective_srh();
        this.scp = supercell_composite_parameter(this.eff_bwd,this.eff_srh,this.mu_cape[0],this.mu_cape[1]);
      }
    } else {
      this.scp = 0.0;
    }
  } // end get_scp
  get_stp(){
    if (this.temperature.length > 0){
      try{
        // need to get the LCL height, it's the only piece that hasn't been found yet.
        this.lcl_height = lcl_height(this.temperature[0],this.dewpoint[0],this.pressure[0],this.pressure,this.height);
        this.stp = significant_tornado_parameter(this.lcl_height,this.eff_layer[0],this.eff_bwd,this.eff_srh,this.ml_cape[0],this.ml_cape[1]);
      } catch {
        this.get_ml_parcel_trajectory();
        this.get_mlcape();
        this.get_effective_bwd();
        this.get_effective_inflow_layer();
        this.get_effective_srh();
        // need to get the LCL height, it's the only piece that hasn't been found yet.
        this.lcl_height = lcl_height(this.temperature[0],this.dewpoint[0],this.pressure,this.height);
        this.stp = significant_tornado_parameter(this.lcl_height,this.eff_layer[0],this.eff_bwd,this.eff_srh,this.ml_cape[0],this.ml_cape[1]);
      }
    } else {
      this.stp = 0.0;
    }
  } // end get_stp
  get_wmp(){
    if (this.temperature.length > 0){
      try{
        this.wmp = wet_microburst_parameter(this.temperature,this.pressure,this.ml_parcel_info[0],this.ml_parcel_info[1],this.ml_cape[1],this.bwd_01);
      } catch {
        this.get_ml_parcel_trajectory();
        this.get_mlcape();
        this.get_bulk_wind_differences();
        this.wmp = wet_microburst_parameter(this.temperature,this.pressure,this.ml_parcel_info[0],this.ml_parcel_info[1],this.ml_cape[1],this.bwd_01);
      }
    } else {
      this.wmp = 0.0;
    }
  } // end get WMP
}
