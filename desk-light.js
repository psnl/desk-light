var glbBluetoothDevice;
var glbGattCharMode;
var glbModeOptions = [];

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

    glbBluetoothDevice = null;
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice(options)
    .then(device => {
    glbBluetoothDevice = device;
    glbBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    return connect();
    })
    .catch(error => {
    console.log('Argh! ' + error);
    });
}

function connect() {
    console.log('Connecting to Bluetooth Device...');
    return glbBluetoothDevice.gatt.connect()
    .then(server => {
      console.log('> Bluetooth Device connected');
      document.getElementById("btnConnect").disabled = true;
      document.getElementById("btnDisconnect").disabled = false;
      document.getElementById("bluetoothStatus").textContent = "bluetooth_connected";
      server.getPrimaryService("4c68970c-7145-415e-b4ca-b47d132e62dd").then(gattService=>{
        console.log('> Service started');
        gattService.getCharacteristic("e0de3de1-0cb6-4f11-bb40-446445a2448b").then(gattCharacteristic=>{
            console.log('> gattCharGetSetMode');
            gattCharGetSetMode = gattCharacteristic;
            gattService.getCharacteristic("2a8ed03b-d99a-4e7b-bcf5-be33882577d8").then(gattCharacteristic=>{
              console.log('> gattCharQueryMode');
              gattCharQueryMode = gattCharacteristic;
              var modeString = query_mode(gattCharQueryMode, 0, glbModeOptions);
            });
          });
      });
      //document.getElementById("btnConnect").value="Connected";
      //document.getElementById("btnConnect").disabled = true;
    });
}

function colorButton(number) {
  var test = document.getElementById("testfield");
  test.textContent = number.toString();
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
    console.log('> query_mode');
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
              gattCharGetSetMode.startNotifications().then(gattCharacteristic=>{
                  console.log('> Notifications started');
                  gattCharacteristic.addEventListener("characteristicvaluechanged", event=>{
                      var value = event.target.value.getUint8(0);
                      colorButton(value);
                      //$("#notifiedValue").text("" + value);
                  });
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

function createButtonNew(number, name) {
  var btn = document.createElement("BUTTON");   // Create a <button> element
  btn.name = "modeButton";                      // Insert text
  btn.id = number;
  btn.value = name;
  btn.class = "btn btn-info";
  btn.onclick= "newButtonClickListener(this.id, this.value)";
  document.body.appendChild(btn);               // Append <button> to <body>
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
  if (!glbBluetoothDevice) {
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (glbBluetoothDevice.gatt.connected) {
    glbBluetoothDevice.gatt.disconnect();
  } else {
    console.log('> Bluetooth Device is already disconnected');
    document.getElementById("btnConnect").disabled = false;
    document.getElementById("btnDisconnect").disabled = true;
    document.getElementById("bluetoothStatus").textContent = "bluetooth_disabled";
    removeButtons();

  }
}
