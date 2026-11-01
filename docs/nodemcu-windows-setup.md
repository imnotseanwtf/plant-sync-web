# NodeMCU Setup on Windows (Arduino IDE)

This guide is for the **NodeMCU v1.0 (ESP8266, CP2102 USB chip)**, on Windows 10 or 11.

## 1. Install the Arduino IDE

1. Go to <https://www.arduino.cc/en/software>.
2. Download **Arduino IDE 2** for Windows and run the installer.
3. If Windows asks to install drivers for the IDE, click **Install**.

## 2. Set up the USB connection

1. Plug the NodeMCU into the laptop with a USB **data** cable. Many charging cables have no data wires.
2. Right-click **Start** and open **Device Manager**.
3. Expand **Ports (COM & LPT)**.
4. Look for **Silicon Labs CP210x USB to UART Bridge (COMx)**. Write down the COM number, for example `COM3`.

If it's listed, go to step 3. If not, find what you see here:

| What Device Manager shows | What to do |
|---|---|
| **CP2102 USB to UART Bridge Controller** with a yellow warning icon, under Other devices | Install the driver (below) |
| **Unknown USB Device (Device Descriptor Request Failed)** | Bad cable or USB port, or a wiring short. Take all wires off the board and try another cable and port |
| Nothing changes when you plug it in | The cable is probably charge-only. Use another cable |

**To install the driver:**

1. Go to <https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers>.
2. Download **CP210x Universal Windows Driver** and unzip it.
3. Right-click `silabser.inf` and click **Install**. On Windows 11, you may need **Show more options** first.
4. Unplug the board, plug it back in, and check Device Manager again.

If your board has a **CH340** USB chip instead, install the CH340 driver from <https://www.wch-ic.com/downloads/CH341SER_EXE.html>.

## 3. Add ESP8266 support to the IDE

1. Open **File → Preferences**.
2. In **Additional boards manager URLs**, paste:
   ```
   https://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Click **OK**.
4. Open **Tools → Board → Boards Manager**.
5. Search for `esp8266` and install **esp8266 by ESP8266 Community**.

## 4. Choose the board and port

1. **Tools → Board → esp8266 → NodeMCU 1.0 (ESP-12E Module)**
2. **Tools → Port →** the COM number from step 2

Don't choose an ESP32 board. The upload will fail with `This chip is ESP8266, not ESP32`.

## 5. Install the libraries

Open **Tools → Manage Libraries**, then search for and install each one. If it asks about dependencies, click **Install All**.

| Search for | Install |
|---|---|
| `BH1750` | **BH1750** by Christopher Laws |
| `DHT sensor library` | **DHT sensor library** by Adafruit |
| `Adafruit Unified Sensor` | **Adafruit Unified Sensor** by Adafruit |
| `ArduinoJson` | **ArduinoJson** by Benoit Blanchon (version 7) |

## 6. Test the board

Before you wire anything, upload this test with only the USB cable connected.

1. Open **File → New Sketch**, delete everything, and paste:
   ```cpp
   void setup() {
     Serial.begin(115200);
     pinMode(LED_BUILTIN, OUTPUT);
   }

   void loop() {
     digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
     Serial.printf("hello from esp8266, uptime %lu ms\n", millis());
     delay(1000);
   }
   ```
2. Click **Upload** (→) and wait for `Hard resetting via RTS pin...`.
3. Open **Tools → Serial Monitor** and set the speed to **115200 baud**.

The LED should blink, and you should see a new line every second:

```
hello from esp8266, uptime 5080 ms
```

## 7. Wire the sensors

Unplug USB before changing any wires. Add one part at a time, and check that nothing gets hot after you plug back in.

| Part | Part pin | NodeMCU pin |
|---|---|---|
| Soil module (YL-69) | AO | **A0** |
| | VCC | 3V3 |
| | GND | GND |
| DHT22 | DATA | **D5** |
| | VCC | 3V3 |
| | GND | GND |
| BH1750 | SCL | **D1** |
| | SDA | **D2** |
| | VCC | 3V3 |
| | GND | GND |
| Relay module | IN | **D6** |
| | VCC | **VIN** (5V) |
| | GND | GND |

- A bare 4-pin DHT22 needs a 10 kΩ resistor between VCC and DATA. The 3-pin module already has one.
- Never put 5V on A0 or any D pin.
- Keep D3, D4 and D8 free. They affect whether the board boots.
- Power the pump from its own adapter, through the relay's COM and NO terminals. Don't power it from the board.

## 8. Upload the plant code

1. Open `esp32/nodemcu-plant-monitor.ino` in the IDE. If the IDE asks to move it into a folder, click **OK**.
2. Check these lines near the top:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   const String deviceIdentifier = "YOUR_DEVICE_ID";
   ```
   - **Wi-Fi:** the network must be **2.4 GHz**. The ESP8266 can't connect to 5 GHz.
   - **Device ID:** copy it from **Device Identifiers** on the dashboard. A correct ID has 36 characters.
3. On the dashboard, make sure the device has a **plant** linked to it. Without one, the site always answers `false` and the pump never runs.
4. Click **Upload**, then open the Serial Monitor at **115200 baud**.

A working board shows:

```
Connected to Wi-Fi, IP: 192.168.x.x
BH1750 initialized
Moisture: 45% (raw 690) | Light: 245.00 lux | Temp: 29.40°C | Humidity: 68.20%
HTTP Response code: 201
Irrigation check response code: 200
Irrigation not needed.
```

## 9. Calibrate the soil sensor

The Serial Monitor shows a `raw` number next to the moisture percentage.

1. Hold the probe in the air and put its `raw` number in `SOIL_DRY`.
2. Put the probe tips in a glass of water and put its `raw` number in `SOIL_WET`.
3. Upload again.

Keep the pump disconnected until the probe is in real soil. A dry or loose probe reads close to 0%, so the site may tell the pump to run.

## Troubleshooting

| Problem | What to do |
|---|---|
| **Port** is greyed out or has no COM port | Go back to step 2. Check the cable, then the driver |
| `Access is denied` or `port is busy` | Close other programs using the COM port, including a second IDE window. Then unplug and replug the board |
| `Failed to connect to ESP8266` or stuck on `Connecting...` | Hold the **FLASH** button on the board when the upload starts, and release it once writing begins |
| `This chip is ESP8266, not ESP32` | Choose **NodeMCU 1.0 (ESP-12E Module)** as the board |
| `WiFi.h` or `HTTPClient.h` errors | That code was written for the ESP32. Use the NodeMCU version |
| `No such file or directory` for `DHT.h`, `BH1750.h` or `ArduinoJson.h` | Install the libraries in step 5 |
| Serial Monitor shows garbage characters | Set it to **115200 baud**. A short burst right after a reset is normal |
| Stuck on `Connecting to Wi-Fi....` | Check the name and password, and that the network is 2.4 GHz |
| `Device not found` or response code `404` | Copy the device ID again from the dashboard |
| `DHT22` shows `nan` | Check VCC, GND and DATA on D5. A bare sensor also needs its resistor |
| `[BH1750] ERROR` or `BH1750 error` | Check SDA and SCL. If it got hot earlier, it may need replacing |
| Relay stays on all the time | Check for an H/L jumper and set it to L, or use a 3.3V relay module |
| Board restarts when the relay switches on | Put the relay's VCC on **VIN**, not 3V3, and use a good USB cable |
| A part gets hot | **Unplug USB immediately.** Check that VCC and GND aren't swapped, and look for shorts |
