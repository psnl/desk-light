var bluetoothDevice;
var gattCharMode;
var modeOptions = [];

var requestDeviceParms = {
        filters: [
            {
                name: ["DeskLight"]
            }
        ],
        optionalServices: ["4c68970c-7145-415e-b4ca-b47d132e62dd"]
    };

function btnConnect() {
    console.log('Connect pressed');
    let options = {filters: []};

    options.filters.push({services: ["4c68970c-7145-415e-b4ca-b47d132e62dd"]});

    bluetoothDevice = null;
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(options)
    .then(device => {
    bluetoothDevice = device;
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    return connect();
    })
    .catch(error => {
    console.log('Argh! ' + error);
    });
}

function connect() {
    console.log('Connecting to Bluetooth Device...');
    return bluetoothDevice.gatt.connect()
    .then(server => {
      console.log('> Bluetooth Device connected');
      document.getElementById("btnConnect").disabled = true;
      document.getElementById("btnDisconnect").disabled = false;
      document.getElementById("bluetoothStatus").textContent = "bluetooth_connected";
      server.getPrimaryService("4c68970c-7145-415e-b4ca-b47d132e62dd").then(gattService=>{
          gattService.getCharacteristic("2a8ed03b-d99a-4e7b-bcf5-be33882577d8").then(gattCharacteristic=>{
            gattCharQueryMode = gattCharacteristic;
            var modeString = query_mode(gattCharacteristic, 0, modeOptions);
          });
          
          gattService.getCharacteristic("e0de3de1-0cb6-4f11-bb40-446445a2448b").then(gattCharacteristic=>{
            gattCharGetSetMode = gattCharacteristic;
            gattCharacteristic.startNotifications().then(gattCharacteristic=>{
                gattCharacteristic.addEventListener("characteristicvaluechanged", event=>{
                      var value = event.target.value.getUint8(0);
                      colorButton(value);
                      //$("#notifiedValue").text("" + value);
                  });
              });
          });

      });
      //document.getElementById("btnConnect").value="Connected";
      //document.getElementById("btnConnect").disabled = true;
    });
}

function colorButton(number) {
  var btns = document.getElementsByName("modeButton");
  var i;
  for (i = 0; i < btns.length; i++) {
      if (parseInt(btns[i].attributes.id.nodeValue) == number) {
          btns[i].className = "btn btn-warning";
      }
      else {
          btns[i].className = "btn btn-info";
      }
  }
}

function removeButtons() {
  var btns = document.getElementsByName("modeButton");
  var i;
  var length = btns.length;
  for (i = 0; i < length; i++) {
    btns[0].remove();
  }
}


 function query_mode(gattCharacteristic, number, data) {
    gattCharacteristic.writeValue(string_to_buffer(number.toString())).then(result => {
        gattCharacteristic.readValue().then(value1 => {
            var value2 = buffer_to_string(value1.buffer);
            if (value2!="")
            {
                data.push(value2);
                createButton(number, value2);
                query_mode(gattCharacteristic, ++number, data)
            }
            else
            {
                //Done add buttons
                gattCharGetSetMode.readValue().then(value1 => {
                    colorButton(value1.getUint8(0));
                });    
    
            }
        });
    });
}

function string_to_buffer(src) {
    return (new Uint8Array([].map.call(src, function(c) {
      return c.charCodeAt(0)
    }))).buffer;
}

function buffer_to_string(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function write(value) {
    var buffer = new Uint8Array(1);
    buffer[0] = value;
    gattCharGetSetMode.writeValue(buffer);
}
function newButtonClickListener(number, value) {
    console.log("Button ");
    write(parseInt(number));
}

function createButton(number, name) {
    var r = $('<input/>').attr({
                 type: "button",
                 id: number,
                 name: "modeButton",
                 value: name,
                 class:"btn btn-info",
                 onclick: "newButtonClickListener(this.id, this.value)"
            });
            $("body").append(r);
        }

function onDisconnected(event) {
  // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
    document.getElementById("btnConnect").disabled = false;
    document.getElementById("btnDisconnect").disabled = true;
    document.getElementById("bluetoothStatus").textContent = "bluetooth_disabled";
    removeButtons();
}

function btnDisconnect() {
  if (!bluetoothDevice) {
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  } else {
    console.log('> Bluetooth Device is already disconnected');
    document.getElementById("btnConnect").disabled = false;
    document.getElementById("btnDisconnect").disabled = true;
    document.getElementById("bluetoothStatus").textContent = "bluetooth_disabled";
    removeButtons();

  }
}
