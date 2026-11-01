#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Wi-Fi Configuration
const char* ssid = "YOUR_WIFI_NAME";  // 2.4 GHz band, the ESP8266 cannot use 5 GHz
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const String apiUrl = "https://plant-sync-web.vercel.app/api";

// Device identifier
const String deviceIdentifier = "YOUR_DEVICE_ID";

// Relay configuration
#define RELAY_ACTIVE_LOW true  // Set relay logic (LOW = ON for most 5V relays)

// Define pins (NodeMCU labels)
const int soilMoisturePin = A0;  // Soil moisture sensor on A0 (only analog pin)
const int dhtPin = D5;           // DHT22 data pin on D5 (GPIO 14)
const int relayPin = D6;         // Relay IN pin on D6 (GPIO 12)
#define DHTTYPE DHT22            // Specify DHT22 sensor

// Soil sensor calibration: check the "raw" value in Serial Monitor and adjust
const int SOIL_DRY = 1024;  // raw reading with the probe in dry air / dry soil
const int SOIL_WET = 300;   // raw reading with the probe in a glass of water

// Initialize sensor objects
BH1750 lightMeter;
const int I2C_SDA = D2;  // I2C SDA pin (GPIO 4)
const int I2C_SCL = D1;  // I2C SCL pin (GPIO 5)

DHT dht(dhtPin, DHTTYPE);
WiFiClientSecure wifiClient;
int moistureValue = 0;

void setRelay(bool on) {
  if (RELAY_ACTIVE_LOW) {
    // A 3.3V HIGH is not enough to switch a 5V relay module off,
    // so for OFF release the pin and let the module pull IN up to 5V itself.
    if (on) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW);
    } else {
      pinMode(relayPin, INPUT);
    }
  } else {
    pinMode(relayPin, OUTPUT);
    digitalWrite(relayPin, on ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Initializing...");

  // Initialize relay pin first so the pump stays off while Wi-Fi connects
  setRelay(false);  // Start with relay OFF

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi, IP: " + WiFi.localIP().toString());

  // Initialize I2C for BH1750
  Wire.begin(I2C_SDA, I2C_SCL);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 initialized");
  } else {
    Serial.println("BH1750 error");
  }
  dht.begin();

  // ponytail: skips HTTPS certificate check, pin the certificate fingerprint if security matters
  wifiClient.setInsecure();
}

void loop() {
  moistureValue = analogRead(soilMoisturePin);
  int moisturePercentage = constrain(map(moistureValue, SOIL_DRY, SOIL_WET, 0, 100), 0, 100);

  float lux = lightMeter.readLightLevel();
  bool lightOk = lux >= 0;  // the library returns -1 or -2 when the sensor is missing or failed
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Print sensor data
  Serial.print("Moisture: ");
  Serial.print(moisturePercentage);
  Serial.print("% (raw ");
  Serial.print(moistureValue);
  Serial.print(") | Light: ");
  if (lightOk) {
    Serial.print(lux);
    Serial.print(" lux");
  } else {
    Serial.print("no reading");
  }
  Serial.print(" | Temp: ");
  Serial.print(temperature);
  Serial.print("°C | Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  if (WiFi.status() == WL_CONNECTED) {
    // First, send sensor data to the API
    JsonDocument jsonDoc;
    jsonDoc["device_identifier_id"] = deviceIdentifier;
    jsonDoc["moisture_level"] = moisturePercentage;
    jsonDoc["humidity"] = humidity;
    jsonDoc["temperature"] = temperature;
    if (lightOk) jsonDoc["light_intensity"] = lux;
    else jsonDoc["light_intensity"] = nullptr;  // stored as "no reading" on the site

    String jsonPayload;
    serializeJson(jsonDoc, jsonPayload);

    HTTPClient httpSensor;
    httpSensor.begin(wifiClient, apiUrl + "/store-sensor-values");
    httpSensor.addHeader("Content-Type", "application/json");

    int httpResponseCode = httpSensor.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = httpSensor.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpSensor.errorToString(httpResponseCode));
    }

    httpSensor.end();

    // Now, check if irrigation is needed
    HTTPClient httpIrrigation;
    httpIrrigation.begin(wifiClient, apiUrl + "/irrigation-control/" + deviceIdentifier);

    int irrigationResponseCode = httpIrrigation.GET();

    if (irrigationResponseCode > 0) {
      String irrigationResponse = httpIrrigation.getString();
      irrigationResponse.trim();
      Serial.println("Irrigation check response code: " + String(irrigationResponseCode));
      Serial.println("Irrigation needed: " + irrigationResponse);

      // Parse the response to determine if irrigation is needed
      bool irrigationNeeded = (irrigationResponse == "true");

      // Control the relay based on irrigation needs
      if (irrigationNeeded) {
        Serial.println("Starting irrigation...");
        setRelay(true);

        // Update the is_irrigating status to true
        JsonDocument irrigationDoc;
        irrigationDoc["device_identifier_id"] = deviceIdentifier;
        irrigationDoc["moisture_level"] = moisturePercentage;
        irrigationDoc["humidity"] = humidity;
        irrigationDoc["temperature"] = temperature;
        if (lightOk) irrigationDoc["light_intensity"] = lux;
        else irrigationDoc["light_intensity"] = nullptr;
        irrigationDoc["is_irrigating"] = true;

        String irrigationPayload;
        serializeJson(irrigationDoc, irrigationPayload);

        HTTPClient httpUpdateStatus;
        httpUpdateStatus.begin(wifiClient, apiUrl + "/store-sensor-values");
        httpUpdateStatus.addHeader("Content-Type", "application/json");
        httpUpdateStatus.POST(irrigationPayload);
        httpUpdateStatus.end();
      } else {
        Serial.println("Irrigation not needed.");
        setRelay(false);
      }
    } else {
      Serial.print("Error checking irrigation status: ");
      Serial.println(httpIrrigation.errorToString(irrigationResponseCode));
    }

    httpIrrigation.end();
  } else {
    Serial.println("WiFi Disconnected, cannot send sensor data");
  }

  delay(3000);
}
