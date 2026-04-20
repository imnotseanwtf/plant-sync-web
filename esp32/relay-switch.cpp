const int pin = 16;

void setup() {
  pinMode(pin, OUTPUT);
  Serial.begin(9600); // Initialize serial communication
}

void loop() {
  digitalWrite(pin, HIGH);    // Turn pin ON
  Serial.println("Pin is ON");
  delay(10000);              // Wait for 10 seconds
  
  digitalWrite(pin, LOW);     // Turn pin OFF
  Serial.println("Pin is OFF");
  delay(10000);              // Wait for 10 seconds
}