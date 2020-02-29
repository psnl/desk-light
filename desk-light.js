//import DlUi from './dl-ui';
//const DlUi = require('./dl-ui');
var brightnessChar = null;

const dlState = {
    NOT_CONNECTED: "not_connected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    DISCONNECTING: "disconnecting"
  };


class DlBluetooth
{
  constructor () {
    this._bleDevice = null;
    this._onConnect = null;
    this._onDisconnect = null;
    this._onError = null;
    this._server = null;

  }

  connect(onConnect, onDisconnect, onError) {
    this._onConnect = onConnect;
    this._onDisconnect = onDisconnect;
    this._onError = onError;
    console.log('ble:connect');
    var requestDeviceParms = {
        filters: [
            {
                name: ["DeskLight"]
            }
        ],
        optionalServices: ["4c68970c-7145-415e-b4ca-b47d132e62dd"]
    };
    let options = {filters: []};
    options.filters.push({services: ["4c68970c-7145-415e-b4ca-b47d132e62dd"]});

    navigator.bluetooth.requestDevice(options).then(device => {
      this._bleDevice = device;
      //this._bleDevice.addEventListener('gattserverconnected', () => console.log('ooo'));
      if (this._onDisconnect != null) {
        this._bleDevice.addEventListener('gattserverdisconnected', this._onDisconnect);
      }
      this._bleDevice.gatt.connect().then(server => {
        console.log('ble:connected');
        this._server = server;
        if (this._onConnect != null)
        {
          this._onConnect();
        }
      }).catch(error => {
        console.log('ble:connect error ' + error);
        if (this._onError != null)
        {
          this._onError();
        }
        })
    }).catch(error => {
      console.log('ble:request device error ' + error);
      if (this._onError != null)
      {
        this._onError();
      }
    });
  }

  disconnect() {
    console.log('ble:disconnect');
    if (!this._bleDevice) {
      return;
    }
    if (this._bleDevice.gatt.connected) {
      this._bleDevice.gatt.disconnect();
    } 
    this._bleDevice = null;
    this._onConnect = null;
    this._onDisconnect = null;
    this._onError = null;
    this._server = null;
  }

  get server()
  {
    return this._server;
  }
}

// class DlUi
// {
//     constructor() {

//   }

//   btnConnection(elem, text) {
//     console.log('btn:Connection');
//     elem.innerHTML=text;
//   };
// }

class DeskLight
{
  constructor() {
    this._ui = new DlUi();
    this._ble = new DlBluetooth(this);
    this._state = dlState.NOT_CONNECTED;
  }
  // get ui() {
  //   return this._ui;
  // } 
  // get ble() {
  //   return this._ble;
  // } 

  btnConnection() {
    console.log('btnConnection pressed');
    console.log('State:' + this._state);
    switch (this._state)
    {
      case dlState.NOT_CONNECTED:
        this._state = dlState.CONNECTING;
        this._ui.btnConnection(event.srcElement, this.State2ButtonText(this._state))
        // async
        this._ble.connect(this.onBleConnected, this.onBleDisconnected, this.onBleDisconnected);
        break;
      case dlState.CONNECTED:
        this.onBleDisconnected();
        break;
      case dlState.CONNECTING:
        this.onBleDisconnected();
        break;
    }
  }

  btnZigbee() {
    console.log('btnZigbee pressed');
    var elem = event.srcElement;
    var range = document.getElementById("brightnessControl")
    if (elem.innerHTML == "Manual")
    {
      elem.innerHTML = "Zigbee"
      range.disabled = true;
      if (brightnessChar != null){
        var buffer = new ArrayBuffer(2)
        //var buffer = new Uint16Array(1);
        var dv = new DataView(buffer, 0);
        dv.setUint16(0, 256, true);
        brightnessChar.writeValue(dv);
      }
    }
    else
    {
      elem.innerText = "Manual"
      range.disabled = false;

      var buffer = new ArrayBuffer(2)
      //var buffer = new Uint16Array(1);
      var dv = new DataView(buffer, 0);
      dv.setUint16(0, range.value, true);
      brightnessChar.writeValue(dv);

    }

  }

  rangeBrightness() {
    var elem = event.srcElement;
    console.log('rangeBrightness changed (' + elem.value + ')');
    if (document.getElementById("btnZigbee").innerHTML == "Manual")
    {
    
      if (brightnessChar != null){
        var buffer = new ArrayBuffer(2)
        //var buffer = new Uint16Array(1);
        var dv = new DataView(buffer, 0);
        dv.setUint16(0, elem.value, true);
        brightnessChar.writeValue(dv);
      }
    }

  }

  onBleConnected() {
    console.log('dl:onConnected');    
    desklight._state = dlState.CONNECTED;
    desklight._ui.btnConnection(document.getElementById("btnConnection"), desklight.State2ButtonText(desklight._state))

    desklight.fetchService();
  }

  onBleDisconnected() {
    console.log('dl:onDisconnected');
    if (desklight._state == dlState.NOT_CONNECTED) {
      return;
    }
    // Use global variable
    desklight._state = dlState.NOT_CONNECTED;
    desklight._ble.disconnect();
    desklight._ui.btnConnection(document.getElementById("btnConnection"), desklight.State2ButtonText(desklight._state))
    desklight.Brightness(false);
  }

  onBleError() {
    console.log('dl:onError');
  }

  fetchService() {
    console.log('dl:fetchService');
    this._ble.server.getPrimaryService("4c68970c-7145-415e-b4ca-b47d132e62dd").then(gattService=>{
      desklight.fetchCharBrightness(gattService);
    }).catch(error => {
      console.log('dl:fetchService error ' + error);
    });
  }

  fetchCharBrightness(gattService) {
    console.log('dl:fetchCharBrightness');
    gattService.getCharacteristic("5a028edd-5f36-4aef-8b53-ed3ee2805b09").then(gattCharacteristic=>{
      gattCharacteristic.readValue().then(value => {
        brightnessChar = gattCharacteristic;
        var brightness = value.getUint16(0, true);
        this.Brightness(true);
        this.BrightnessUpdate(brightness);
        //console.log(brightnessRaw);
      }).catch(error => {
        console.log('dl:fetchCharBrightness value error ' + error);
      });
      gattCharacteristic.startNotifications().then(gattCharacteristic=>{
          console.log('> Notifications started');
          gattCharacteristic.addEventListener("characteristicvaluechanged", event=>{
            this.BrightnessUpdate(event.target.value.getUint16(0, true));
          });
      });

    }).catch(error => {
      console.log('dl:fetchCharBrightness error ' + error);
    });
  }

  //         gattService.getCharacteristic("e0de3de1-0cb6-4f11-bb40-446445a2448b").then(gattCharacteristic=>{
//             console.log('> gattCharGetSetMode');
//             gattCharGetSetMode = gattCharacteristic;
//             gattService.getCharacteristic("2a8ed03b-d99a-4e7b-bcf5-be33882577d8").then(gattCharacteristic=>{
//               console.log('> gattCharQueryMode');
//               gattCharQueryMode = gattCharacteristic;
//               var modeString = query_mode(gattCharQueryMode, 0, glbModeOptions);
//             });

  Brightness(enable)
  {
    var zigbee = document.getElementById("btnZigbee");
    var range = document.getElementById("brightnessControl")
    if (enable) {
      zigbee.hidden = false;
      range.hidden = false;
    }
    else{
      zigbee.hidden = true;
      range.hidden = true;
    }
  }


  BrightnessUpdate(value)
  {
    var zigbee = document.getElementById("btnZigbee");
    var range = document.getElementById("brightnessControl")
    range.value = 0xFF & value;
    if (value >= 256) {
      range.disabled = true;
      zigbee.innerHTML = "Zigbee";
    }
    else {
      range.disabled = false;
      zigbee.innerHTML = "Manual";
    }
  }

  State2ButtonText(state)
  {
    switch (this._state)
    {
      case dlState.NOT_CONNECTED:
        return "Connect";
      case dlState.CONNECTING:
        return "Connecting";
      case dlState.CONNECTED:
        return "Disconnect";
      case dlState.DISCONNECTING:
        return "Disconnecting";
      default:
        return "Error";
      
    }
  }

}

const desklight = new DeskLight();

// var glbBluetoothDevice;
// var glbGattCharMode;
// var glbModeOptions = [];



// function connect() {
//     console.log('Connecting to Bluetooth Device...');
//     return glbBluetoothDevice.gatt.connect()
//     .then(server => {
//       console.log('> Bluetooth Device connected');
//       document.getElementById("btnConnect").disabled = true;
//       //document.getElementById("btnConnect").value = "Disconnect";
//       document.getElementById("btnDisconnect").disabled = false;
//       document.getElementById("bluetoothStatus").textContent = "bluetooth_connected";
//       server.getPrimaryService("4c68970c-7145-415e-b4ca-b47d132e62dd").then(gattService=>{
//         console.log('> Service started');
//         gattService.getCharacteristic("e0de3de1-0cb6-4f11-bb40-446445a2448b").then(gattCharacteristic=>{
//             console.log('> gattCharGetSetMode');
//             gattCharGetSetMode = gattCharacteristic;
//             gattService.getCharacteristic("2a8ed03b-d99a-4e7b-bcf5-be33882577d8").then(gattCharacteristic=>{
//               console.log('> gattCharQueryMode');
//               gattCharQueryMode = gattCharacteristic;
//               var modeString = query_mode(gattCharQueryMode, 0, glbModeOptions);
//             });
//           });
//       });
//     });
// }



//  function query_mode(gattCharacteristic, number, data) {
//     console.log('> query_mode');
//     gattCharacteristic.writeValue(string_to_buffer(number.toString())).then(result => {
//         gattCharacteristic.readValue().then(value1 => {
//             var value2 = buffer_to_string(value1.buffer);
//             if (value2!="")
//             {
//                 data.push(value2);
//                 createButton(number, value2);
//                 query_mode(gattCharacteristic, ++number, data)
//             }
//             else
//             {
//                 //Done add buttons
//               gattCharGetSetMode.startNotifications().then(gattCharGetSetMode=>{
//                   console.log('> Notifications started');
//                   gattCharGetSetMode.addEventListener("characteristicvaluechanged", event=>{
//                       console.log('> Event');
//                       var value = event.target.value.getUint8(0);
//                       colorButton(value);
//                       //$("#notifiedValue").text("" + value);
//                   });
//               });
   
//             }
//         });
//     });
// }

// function string_to_buffer(src) {
//     return (new Uint8Array([].map.call(src, function(c) {
//       return c.charCodeAt(0)
//     }))).buffer;
// }

// function buffer_to_string(buf) {
//     return String.fromCharCode.apply(null, new Uint8Array(buf));
// }

// function write(value) {
//     var buffer = new Uint8Array(1);
//     buffer[0] = value;
//     gattCharGetSetMode.writeValue(buffer);
// }

// /*
// function newButtonClickListener(number, value) {
//     console.log("Button ");
//     write(parseInt(number));
// }


// function onDisconnected(event) {
//   // Object event.target is Bluetooth Device getting disconnected.
//     console.log('> Bluetooth Device disconnected');
//     document.getElementById("btnConnect").disabled = false;
//     document.getElementById("btnDisconnect").disabled = true;
//     document.getElementById("bluetoothStatus").textContent = "bluetooth_disabled";
//     removeButtons();
// }

// function btnDisconnect() {
//   if (!glbBluetoothDevice) {
//     return;
//   }
//   console.log('Disconnecting from Bluetooth Device...');
//   if (glbBluetoothDevice.gatt.connected) {
//     glbBluetoothDevice.gatt.disconnect();
//   } 
//   else {
//     console.log('> Bluetooth Device is already disconnected');
//     // document.getElementById("btnConnect").disabled = false;
//     // document.getElementById("btnDisconnect").disabled = true;
//     // document.getElementById("bluetoothStatus").textContent = "bluetooth_disabled";
//     // removeButtons();
//   }
// }
// */

