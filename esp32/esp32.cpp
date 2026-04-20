#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Configuration
const String ssid = "nigglers";
const String password = "123456789";

// API Configuration
const String ipAddress = "192.168.43.100";
const String apiUrl = "http://" + ipAddress + "/api";

// Device identifier
const String deviceIdentifier = "0196ec6f-ed60-7298-93ae-bf70a9c4e203";

// Relay configuration
#define RELAY_ACTIVE_LOW true  // Set relay logic (LOW = ON for most 5V relays)

// Define pins
const int soilMoisturePin = 34;  // Soil moisture sensor on GPIO 34
const int dhtPin = 25;           // DHT22 data pin on GPIO 25
const int relayPin = 14;         // Relay IN pin on GPIO 14
#define DHTTYPE DHT22            // Specify DHT22 sensor

// Initialize sensor objects
BH1750 lightMeter;
const int I2C_SDA = 21;  // I2C SDA pin
const int I2C_SCL = 22;  // I2C SCL pin

DHT dht(dhtPin, DHTTYPE);
int moistureValue = 0;

void setup() {
  Serial.begin(9600);
  delay(1000);
  Serial.println("Initializing...");

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");

  // Initialize relay pin
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, RELAY_ACTIVE_LOW ? HIGH : LOW);  // Start with relay OFF

  // Initialize I2C for BH1750
  Wire.begin(I2C_SDA, I2C_SCL);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 initialized");
  } else {
    Serial.println("BH1750 error");
  }
  dht.begin();
}

void loop() {
  moistureValue = analogRead(soilMoisturePin);
  int moisturePercentage = map(moistureValue, 4095, 0, 0, 100);

  float lux = lightMeter.readLightLevel();
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Print sensor data
  Serial.print("Moisture: ");
  Serial.print(moisturePercentage);
  Serial.print("% | Light: ");
  Serial.print(lux);
  Serial.print(" lux | Temp: ");
  Serial.print(temperature);
  Serial.print("°C | Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  if (WiFi.status() == WL_CONNECTED) {
    // First, send sensor data to the API
    StaticJsonDocument<200> jsonDoc;
    jsonDoc["device_identifier_id"] = deviceIdentifier;
    jsonDoc["moisture_level"] = moisturePercentage;
    jsonDoc["humidity"] = humidity;
    jsonDoc["temperature"] = temperature;
    jsonDoc["light_intensity"] = lux;

    String jsonPayload;
    serializeJson(jsonDoc, jsonPayload);

    HTTPClient httpSensor;
    httpSensor.begin(apiUrl + "/store-sensor-values");
    httpSensor.addHeader("Content-Type", "application/json");

    int httpResponseCode = httpSensor.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = httpSensor.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    httpSensor.end();

    // Now, check if irrigation is needed
    HTTPClient httpIrrigation;
    httpIrrigation.begin(apiUrl + "/irrigation-control/" + deviceIdentifier);

    int irrigationResponseCode = httpIrrigation.GET();

    if (irrigationResponseCode > 0) {
      String irrigationResponse = httpIrrigation.getString();
      Serial.println("Irrigation check response code: " + String(irrigationResponseCode));
      Serial.println("Irrigation needed: " + irrigationResponse);

      // Parse the response to determine if irrigation is needed
      bool irrigationNeeded = (irrigationResponse == "true");

      // Control the relay based on irrigation needs
      if (irrigationNeeded) {
        Serial.println("Starting irrigation...");
        digitalWrite(relayPin, RELAY_ACTIVE_LOW ? LOW : HIGH);  // Turn relay ON

        // Update the is_irrigating status to true
        StaticJsonDocument<100> irrigationDoc;
        irrigationDoc["device_identifier_id"] = deviceIdentifier;
        irrigationDoc["moisture_level"] = moisturePercentage;
        irrigationDoc["humidity"] = humidity;
        irrigationDoc["temperature"] = temperature;
        irrigationDoc["light_intensity"] = lux;
        irrigationDoc["is_irrigating"] = true;

        String irrigationPayload;
        serializeJson(irrigationDoc, irrigationPayload);

        HTTPClient httpUpdateStatus;
        httpUpdateStatus.begin(apiUrl + "/store-sensor-values");
        httpUpdateStatus.addHeader("Content-Type", "application/json");
        httpUpdateStatus.POST(irrigationPayload);
        httpUpdateStatus.end();
      } else {
        Serial.println("Irrigation not needed.");
        digitalWrite(relayPin, RELAY_ACTIVE_LOW ? HIGH : LOW);  // Turn relay OFF
      }
    } else {
      Serial.print("Error checking irrigation status: ");
      Serial.println(irrigationResponseCode);
    }

    httpIrrigation.end();
  } else {
    Serial.println("WiFi Disconnected, cannot send sensor data");
  }

  delay(3000);
}