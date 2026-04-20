// Define the analog pin connected to the soil moisture sensor
const int sensorPin = 34;  // Example: GPIO 34 (ADC1_CH6)
int moistureValue = 0;     // Variable to store the sensor reading

void setup() {
  // Initialize serial communication at 115200 baud rate
  Serial.begin(115200);
  delay(1000);  // Small delay to stabilize
  Serial.println("Soil Moisture Sensor Test");
}

void loop() {
  // Read the analog value from the sensor (0-4095 for ESP32's 12-bit ADC)
  moistureValue = analogRead(sensorPin);

  // Print the raw value to the Serial Monitor
  Serial.print("Moisture Raw Value: ");
  Serial.println(moistureValue);

  // Optional: Convert to percentage (calibrate based on dry and wet values)
  int moisturePercentage = map(moistureValue, 4095, 0, 0, 100); // Adjust based on your sensor
  Serial.print("Moisture Percentage: ");
  Serial.print(moisturePercentage);
  Serial.println("%");

  delay(1000);  // Wait 1 second before the next reading
}