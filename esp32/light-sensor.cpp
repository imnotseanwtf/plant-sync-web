#include <Wire.h>
#include <BH1750.h>

// Define pins
const int soilMoisturePin = 14;  // Soil moisture sensor on GPIO 34 (ADC1_CH6)
BH1750 lightMeter;               // BH1750 object

void setup() {
  // Initialize Serial communication
  Serial.begin(115200);
  delay(1000);
  Serial.println("BH1750 and Soil Moisture Sensor Test");

  // Initialize I2C for BH1750 (default SDA: GPIO 21, SCL: GPIO 22)
  Wire.begin();
  
  // Initialize BH1750
  if (lightMeter.begin()) {
    Serial.println("BH1750 initialized successfully");
  } else {
    Serial.println("Error initializing BH1750");
  }
}

void loop() {
  // Read soil moisture (raw ADC value, 0-4095)
  int moistureValue = analogRead(soilMoisturePin);
  int moisturePercentage = map(moistureValue, 4095, 0, 0, 100); // Calibrate as needed

  // Read light intensity from BH1750 (in lux)
  float lux = lightMeter.readLightLevel();

  // Print results
  Serial.print("Soil Moisture Raw: ");
  Serial.print(moistureValue);
  Serial.print(" | Moisture Percentage: ");
  Serial.print(moisturePercentage);
  Serial.println("%");

  Serial.print("Light Intensity: ");
  Serial.print(lux);
  Serial.println(" lux");

  delay(1000);  // Wait 1 second
}