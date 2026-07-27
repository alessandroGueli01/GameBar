const mqtt = require('mqtt');

// Usa solo il broker locale (offline-first)
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://mosquitto:1883';
const mqttClient = mqtt.connect(MQTT_BROKER, {
  reconnectPeriod: 5000,
  connectTimeout: 10000
});

mqttClient.on('connect', () => {
  console.log('Match Service: Connesso al broker MQTT');
  mqttClient.subscribe(['games/+/start', 'games/+/goal', 'games/+/end']);
});

mqttClient.on('error', (err) => {
  console.warn('Match Service: errore broker MQTT:', err.message || err);
});

mqttClient.on('offline', () => {
  console.warn('Match Service: broker MQTT offline');
});

module.exports = mqttClient;