// Packest from the Estimote family (Telemetry, Connectivity, etc.) are
// broadcast as Service Data (per "§ 1.11. The Service Data - 16 bit UUID" from
// the BLE spec), with the Service UUID 'fe9a'.
var ESTIMOTE_SERVICE_UUID = 'fe9a';
var id;
var output1 = {
  temp: Number,
  light: Number,
  pres: Number,
  x: Number,
  y: Number,
  z: Number,
  Anom: 0,
  beacon:0,
  frameA: 0,
  frameB: 0,
  rssi: Number
};
var output2 = {
  temp: Number,
  light: Number,
  pres: Number,
  x: Number,
  y: Number,
  z: Number,
  Anom: 0,
  beacon:0,
  frameA: 0,
  frameB: 0,
  rssi: Number
};
var output3 = {
  temp: Number,
  light: Number,
  pres: Number,
  x: Number,
  y: Number,
  z: Number,
  Anom: 0,
  beacon:0,
  frameA: 0,
  frameB: 0,
  rssi: Number
};
var Dataset_count=0;
// connecting to Database and creating schema and model
var mongoose=require('mongoose');
mongoose.connect('mongodb+srv://GP:gp123@cluster0-1bn53.mongodb.net/GP?retryWrites=true');
var schema=mongoose.Schema({
  temp : Number,
  pres: Number,
  light: Number,
  x: Number,
  y: Number,
  z: Number,
  Anom: Number
});
var model=mongoose.model('Asset',schema);
// Once you obtain the "Estimote" Service Data, here's how to check if it's
// a Telemetry packet, and if so, how to parse it.
function parseEstimoteTelemetryPacket(data) { // data is a 0-indexed byte array/buffer

  // byte 0, lower 4 bits => frame type, for Telemetry it's always 2 (i.e., 0b0010)
  var frameType = data.readUInt8(0) & 0b00001111;
  var ESTIMOTE_FRAME_TYPE_TELEMETRY = 2;
  if (frameType != ESTIMOTE_FRAME_TYPE_TELEMETRY) { return; }

  // byte 0, upper 4 bits => Telemetry protocol version ("0", "1", "2", etc.)
  var protocolVersion = (data.readUInt8(0) & 0b11110000) >> 4;
  // this parser only understands version up to 2
  // (but at the time of this commit, there's no 3 or higher anyway :wink:)
  if (protocolVersion > 2) { return; }

  // bytes 1, 2, 3, 4, 5, 6, 7, 8 => first half of the identifier of the beacon
  var shortIdentifier = data.toString('hex', 1, 9);
  if(shortIdentifier=='bbd1e10a7a9706aa')
  id=1;
  else if(shortIdentifier=='ce47df7ef2774cdc')
  id=2;
  else if(shortIdentifier=='c24f14ebde3c97o4')
  id=3;

  // byte 9, lower 2 bits => Telemetry subframe type
  // to fit all the telemetry data, we currently use two packets, "A" (i.e., "0")
  // and "B" (i.e., "1")
  var subFrameType = data.readUInt8(9) & 0b00000011;

  var ESTIMOTE_TELEMETRY_SUBFRAME_A = 0;
  var ESTIMOTE_TELEMETRY_SUBFRAME_B = 1;

  // ****************
  // * SUBFRAME "A" *
  // ****************
  if (subFrameType == ESTIMOTE_TELEMETRY_SUBFRAME_A) {
    if(shortIdentifier=='bbd1e10a7a9706aa')
      if (output1.frameA==0) output1.frameA=1;
    else if(shortIdentifier=='ce47df7ef2774cdc')
      if (output2.frameA==0) output2.frameA=1;
    else if(shortIdentifier=='c24f14ebde3c97o4')
      if (output3.frameA==0) output3.frameA=1;
    // ***** ACCELERATION
    // byte 10 => acceleration RAW_VALUE on the X axis
    // byte 11 => acceleration RAW_VALUE on the Y axis
    // byte 12 => acceleration RAW_VALUE on the Z axis
    // RAW_VALUE is a signed (two's complement) 8-bit integer
    // RAW_VALUE * 2 / 127.0 = acceleration in "g-unit" (http://www.helmets.org/g.htm)
    var acceleration = {
      x: data.readInt8(10) * 2 / 127.0,
      y: data.readInt8(11) * 2 / 127.0,
      z: data.readInt8(12) * 2 / 127.0
    };
    if(shortIdentifier=='bbd1e10a7a9706aa')
    {
    output1.x=acceleration.x;
    output1.y=acceleration.y;
    output1.z=acceleration.z;
    }
    if(shortIdentifier=='ce47df7ef2774cdc')
    {
    output2.x=acceleration.x;
    output2.y=acceleration.y;
    output2.z=acceleration.z;
    }
    if(shortIdentifier=='c24f14ebde3c97o4')
    {
    output3.x=acceleration.x;
    output3.y=acceleration.y;
    output3.z=acceleration.z;
    }
    // ***** ATMOSPHERIC PRESSURE
    var pressure;
    if (protocolVersion == 2) {
      // added in protocol version "2"
      // bytes 16, 17, 18, 19 => atmospheric pressure RAW_VALUE
      // RAW_VALUE is an unsigned 32-bit integer, little-endian encoding,
      //   i.e., least-significant byte comes first
      //   e.g., if bytes are 16th = 0x12, 17th = 0x34, 18th = 0x56, 19th = 0x78
      //         then the value is 0x78563412
      // RAW_VALUE / 256.0 = atmospheric pressure in pascals (Pa)
      // note that unlike what you see on the weather forecast, this value is
      // not normalized to the sea level!
      pressure = data.readUInt32LE(16) / 256.0;
    }
    if(shortIdentifier=='bbd1e10a7a9706aa')
    output1.pres=pressure;
    else if(shortIdentifier=='ce47df7ef2774cdc')
    output2.pres=pressure;
    else if(shortIdentifier=='c24f14ebde3c97o4')
    output3.pres=pressure;
    if(shortIdentifier=='bbd1e10a7a9706aa')
    {
      if(output1.frameB==1)
      {
        output1.frameA=0;
        output1.frameB=0;
        var insert=new model({temp: output1.temp,
                              pres: output1.pres,
                              light: output1.light,
                              x: output1.x,
                              y: output1.y,
                              z: output1.z,
                              Anom: output1.Anom
        }).save();
      }
      return output1;
    }
    else if(shortIdentifier=='ce47df7ef2774cdc')
    {
      if(output2.frameB==1)
      {
        output2.frameA=0;
        output2.frameB=0;
        var insert=new model({temp: output2.temp,
                              pres: output2.pres,
                              light: output2.light,
                              x: output2.x,
                              y: output2.y,
                              z: output2.z,
                              Anom: output2.Anom
        }).save();
      }
      return output2;
    }
    else if(shortIdentifier=='c24f14ebde3c97o4')
    {
      if(output3.frameB==1)
      {
        output3.frameA=0;
        output3.frameB=0;
        var insert=new model({temp: output3.temp,
                              pres: output3.pres,
                              light: output3.light,
                              x: output3.x,
                              y: output3.y,
                              z: output3.z,
                              Anom: output3.Anom
        }).save();
      }
      return output3;
    }


  // ****************
  // * SUBFRAME "B" *
  // ****************
  } else if (subFrameType == ESTIMOTE_TELEMETRY_SUBFRAME_B) {
    if(shortIdentifier=='bbd1e10a7a9706aa')
      if (output1.frameB==0) output1.frameB=1;
    else if(shortIdentifier=='ce47df7ef2774cdc')
      if (output2.frameB==0) output2.frameB=1;
    else if(shortIdentifier=='c24f14ebde3c97o4')
      if (output3.frameB==0) output3.frameB=1;
    // ***** MAGNETIC FIELD
    // byte 10 => normalized magnetic field RAW_VALUE on the X axis
    // byte 11 => normalized magnetic field RAW_VALUE on the Y axis
    // byte 12 => normalized magnetic field RAW_VALUE on the Z axis
    // RAW_VALUE is a signed (two's complement) 8-bit integer
    // RAW_VALUE / 128.0 = normalized value, between -1 and 1
    // the value will be 0 if the sensor hasn't been calibrated yet
    var magneticField = {
      x: data.readInt8(10) / 128.0,
      y: data.readInt8(11) / 128.0,
      z: data.readInt8(12) / 128.0
    };

    // ***** AMBIENT LIGHT
    // byte 13 => ambient light level RAW_VALUE
    // the RAW_VALUE byte is split into two halves
    // pow(2, RAW_VALUE_UPPER_HALF) * RAW_VALUE_LOWER_HALF * 0.72 = light level in lux (lx)
    var ambientLightUpper = (data.readUInt8(13) & 0b11110000) >> 4;
    var ambientLightLower = data.readUInt8(13) & 0b00001111;
    var ambientLightLevel = Math.pow(2, ambientLightUpper) * ambientLightLower * 0.72;
    if(shortIdentifier=='bbd1e10a7a9706aa')
      output1.light=ambientLightLevel;
    else if(shortIdentifier=='ce47df7ef2774cdc')
      output2.light=ambientLightLevel;
    else if(shortIdentifier=='c24f14ebde3c97o4')
      output3.light=ambientLightLevel;
    // ***** AMBIENT TEMPERATURE
    // upper 2 bits of byte 15 + byte 16 + lower 2 bits of byte 17
    // => ambient temperature RAW_VALUE, signed (two's complement) 12-bit integer
    // RAW_VALUE / 16.0 = ambient temperature in degrees Celsius
    var temperatureRawValue =
      ((data.readUInt8(17) & 0b00000011) << 10) |
       (data.readUInt8(16)               <<  2) |
      ((data.readUInt8(15) & 0b11000000) >>  6);
    if (temperatureRawValue > 2047) {
      // a simple way to convert a 12-bit unsigned integer to a signed one (:
      temperatureRawValue = temperatureRawValue - 4096;
    }
    temperature = temperatureRawValue / 16.0;
    if(shortIdentifier=='bbd1e10a7a9706aa')
      output1.temp=temperature;
    else if(shortIdentifier=='ce47df7ef2774cdc')
      output2.temp=temperature;
    else if(shortIdentifier=='c24f14ebde3c97o4')
      output3.temp=temperature;
    if(shortIdentifier=='bbd1e10a7a9706aa')
    {
    if(output1.frameA==1)
    {
      output1.frameA=0;
      output1.frameB=0;
      var insert=new model({temp: output1.temp,
                            pres: output1.pres,
                            light: output1.light,
                            x: output1.x,
                            y: output1.y,
                            z: output1.z,
                            Anom: output1.Anom
      }).save();
    }
    return output1;
    }
    else if(shortIdentifier=='ce47df7ef2774cdc')
    {
    if(output2.frameA==1)
    {
      output2.frameA=0;
      output2.frameB=0;
      var insert=new model({temp: output2.temp,
                            pres: output2.pres,
                            light: output2.light,
                            x: output2.x,
                            y: output2.y,
                            z: output2.z,
                            Anom: output2.Anom
      }).save();
    }
    return output2;
    }
    else if(shortIdentifier=='c24f14ebde3c97o4')
    {
    if(output3.frameA==1)
    {
      output3.frameA=0;
      output3.frameB=0;
      var insert=new model({temp: output3.temp,
                            pres: output3.pres,
                            light: output3.light,
                            x: output3.x,
                            y: output3.y,
                            z: output3.z,
                            Anom: output3.Anom
      }).save();
    }
    return output3;
    }
  }
}

// example how to scan & parse Estimote Telemetry packets with noble

var noble = require('noble');

noble.on('stateChange', function(state) {
  console.log('state has changed', state);
  if (state == 'poweredOn') {
    var serviceUUIDs = [ESTIMOTE_SERVICE_UUID]; // Estimote Service
    var allowDuplicates = true;
    noble.startScanning(serviceUUIDs, allowDuplicates, function(error) {
      if (error) {
        console.log('error starting scanning', error);
      } else {
        console.log('started scanning');
      }
    });
  }
});

noble.on('discover', function(peripheral) {
  var serviceData = peripheral.advertisement.serviceData.find(function(el) {
    return el.uuid == ESTIMOTE_SERVICE_UUID;
  });
  if (serviceData === undefined) { return; }
  var data = serviceData.data;

  var telemetryPacket = parseEstimoteTelemetryPacket(data);
  if (id==1)
  {
    output1.rssi=peripheral.rssi;
    if (telemetryPacket) { console.log(output1); }
  }
  else if (id==2)
  {
    output2.rssi=peripheral.rssi;
    if (telemetryPacket) { console.log(output2); }
  }
  else if (id==3)
  {
      output3.rssi=peripheral.rssi;
      if (telemetryPacket) { console.log(output3); }
  }
});
