const mqtt = require('mqtt');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
const mqttClient = mqtt.connect(MQTT_BROKER);

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