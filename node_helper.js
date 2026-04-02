/*
 * MagicMirror²
 * Module: MMM-MultiGauge - node_helper
 * By late4marshmellow
 */


const NodeHelper = require("node_helper");
let mqttLib = null;

module.exports = NodeHelper.create({
  start () {
    // eslint-disable-next-line no-console
    console.log("[MMM-MultiGauge] node_helper started");
    this.mqttClient = null;
    this.config = null;
    this.pollingIntervals = {};
  },

  socketNotificationReceived (notification, payload) {
    if (notification === "MG_CONFIG") {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] Received config with", payload.gauges.length, "gauges");
      this.config = payload;
      this.setupConnections();
    }
  },

  setupConnections () {
    if (!this.config || !this.config.gauges) {
      return;
    }

    // Setup MQTT if any gauge uses it (check mqtt, mqtt_boolean, OR mqtt_secondary)
    const mqttGauges = this.config.gauges.filter((gauge) => gauge.mqtt?.topic || gauge.mqtt_boolean?.topic || gauge.mqtt_secondary?.topic);

    if (mqttGauges.length > 0 && this.config.mqtt && this.config.mqtt.url) {
      // Pass all gauges; subscribeMQTTTopics filters by configured topics.
      this.setupMQTT(this.config.gauges);
    }

    // Setup API polling for gauges that use it
    this.config.gauges.forEach((gauge) => {
      if (gauge.api && gauge.api.baseUrl) {
        this.setupAPIPolling(gauge);
      }
      if (gauge.api_secondary && gauge.api_secondary.baseUrl) {
        this.setupAPISecondaryPolling(gauge);
      }
    });
  },

  setupMQTT (gauges) {
    if (this.mqttClient) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log("[MMM-MultiGauge] MQTT already connected, re-subscribing to topics");
      }
      // Re-subscribe to all topics (handles browser refresh without server restart)
      gauges.forEach((gauge) => {
        this.subscribeMQTTTopics(gauge);
      });
      return;
    }

    try {
      mqttLib = require("mqtt");
    } catch {
      // eslint-disable-next-line no-console
      console.error("[MMM-MultiGauge] mqtt module not found. Run: npm install");
      return;
    }

    const opts = {
      clientId: this.config.mqtt.clientId || `mmm-mg-${Math.random().toString(16)
        .slice(2, 8)}`,
      username: this.config.mqtt.username || null,
      password: this.config.mqtt.password || null,
      rejectUnauthorized: !this.config.mqtt.insecureTLS,
      // Auto-reconnect after 5 seconds
      reconnectPeriod: 5000
    };

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] Connecting to MQTT:", this.config.mqtt.url);
    }

    this.mqttClient = mqttLib.connect(this.config.mqtt.url, opts);

    this.setupMQTTEventHandlers(gauges);
  },

  setupMQTTEventHandlers (gauges) {
    this.mqttClient.on("connect", () => this.handleMQTTConnect(gauges));
    this.mqttClient.on("message", (topic, message) => this.handleMQTTMessage(topic, message, gauges));
    this.mqttClient.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[MMM-MultiGauge] MQTT error:", err.message);
    });
  },

  handleMQTTConnect (gauges) {
    // eslint-disable-next-line no-console
    console.log("[MMM-MultiGauge] MQTT connected");
    gauges.forEach((gauge) => {
      this.subscribeMQTTTopics(gauge);
    });
  },

  subscribeMQTTTopics (gauge) {
    // Subscribe to value topic
    if (gauge.mqtt && gauge.mqtt.topic) {
      this.mqttClient.subscribe(gauge.mqtt.topic, {qos: this.config.mqtt.qos || 0}, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(`[MMM-MultiGauge] Failed to subscribe to ${gauge.mqtt.topic}:`, err);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[MMM-MultiGauge] Subscribed to ${gauge.mqtt.topic} for gauge ${gauge.id}`);
        }
      });
    }
    // Subscribe to boolean topic
    if (gauge.mqtt_boolean && gauge.mqtt_boolean.topic) {
      this.mqttClient.subscribe(gauge.mqtt_boolean.topic, {qos: this.config.mqtt.qos || 0}, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(`[MMM-MultiGauge] Failed to subscribe to ${gauge.mqtt_boolean.topic}:`, err);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[MMM-MultiGauge] Subscribed to boolean ${gauge.mqtt_boolean.topic} for gauge ${gauge.id}`);
        }
      });
    }
    // Subscribe to secondary topic
    if (gauge.mqtt_secondary && gauge.mqtt_secondary.topic) {
      this.mqttClient.subscribe(gauge.mqtt_secondary.topic, {qos: this.config.mqtt.qos || 0}, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(`[MMM-MultiGauge] Failed to subscribe to ${gauge.mqtt_secondary.topic}:`, err);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[MMM-MultiGauge] Subscribed to secondary ${gauge.mqtt_secondary.topic} for gauge ${gauge.id}`);
        }
      });
    }
  },

  handleMQTTMessage (topic, message, gauges) {
    const gaugeValue = gauges.find((gauge) => gauge.mqtt && gauge.mqtt.topic === topic);
    const gaugeBoolean = gauges.find((gauge) => gauge.mqtt_boolean && gauge.mqtt_boolean.topic === topic);
    const gaugeSecondary = gauges.find((gauge) => gauge.mqtt_secondary && gauge.mqtt_secondary.topic === topic);

    if (gaugeValue) {
      this.handleMqttValueMessage(topic, message, gaugeValue);
    } else if (gaugeBoolean) {
      this.handleMqttBooleanMessage(topic, message, gaugeBoolean);
    } else if (gaugeSecondary) {
      this.handleMqttSecondaryMessage(topic, message, gaugeSecondary);
    }
  },

  handleMqttValueMessage (topic, message, gaugeValue) {
    try {
      const msg = message.toString();
      let value = null;

      if (gaugeValue.mqtt.parser === "plain") {
        value = parseFloat(msg);
      } else {
        const obj = JSON.parse(msg);
        value = this.getNestedValue(obj, gaugeValue.mqtt.valuePath || "value");
      }

      if (isNaN(value)) {
        if (this.config.verbose) {
          // eslint-disable-next-line no-console
          console.warn(`[MMM-MultiGauge] Invalid value from ${topic}:`, msg);
        }
        return;
      }

      const processed = value * (gaugeValue.multiplier || 1) + (gaugeValue.offset || 0);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[MMM-MultiGauge] ${gaugeValue.id}: ${processed}`);
      }

      this.sendSocketNotification("MG_DATA", {
        gaugeId: gaugeValue.id,
        value: processed
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[MMM-MultiGauge] Error parsing value from ${topic}:`, error.message);
    }
  },

  handleMqttBooleanMessage (topic, message, gaugeBoolean) {
    try {
      const msg = message.toString();
      let value = null;
      if (gaugeBoolean.mqtt_boolean.parser === "plain") {
        value = this.parseBooleanOrStateFromPlain(msg);
      } else {
        value = this.parseBooleanOrStateFromJson(msg, gaugeBoolean);
      }

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[MMM-MultiGauge] ${gaugeBoolean.id} boolean/state: ${JSON.stringify(value)} (type: ${typeof value})`);
      }

      this.sendSocketNotification("MG_BOOLEAN", {
        gaugeId: gaugeBoolean.id,
        value
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[MMM-MultiGauge] Error parsing boolean from ${topic}:`, error.message);
    }
  },

  parseBooleanOrStateFromPlain (msg) {
    const trimmed = this.unwrapJsonQuotedString(msg.trim());
    const lower = trimmed.toLowerCase();

    if (lower === "true" || lower === "1" || lower === "on") {
      return true;
    }

    if (lower === "false" || lower === "0" || lower === "off") {
      return false;
    }

    // Keep non-boolean payloads as state strings for glowStates.
    return trimmed;
  },

  parseBooleanOrStateFromJson (msg, gaugeBoolean) {
    const obj = JSON.parse(msg);
    const rawValue = this.getNestedValue(obj, gaugeBoolean.mqtt_boolean.valuePath || "value");

    if (typeof rawValue === "boolean" || typeof rawValue === "string") {
      return rawValue;
    }

    return Boolean(rawValue);
  },

  unwrapJsonQuotedString (value) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        return parsed;
      }
    } catch {
      // Keep original value when not valid JSON.
    }

    return value;
  },

  handleMqttSecondaryMessage (topic, message, gaugeSecondary) {
    try {
      const msg = message.toString();
      let value = null;
      if (gaugeSecondary.mqtt_secondary.parser === "plain") {
        value = this.parseSecondaryFromPlain(msg);
      } else {
        value = this.parseSecondaryFromJson(msg, gaugeSecondary);
      }

      // Allow both strings and numbers
      if (value === null || typeof value === "undefined" || value === "") {
        if (this.config.verbose) {
          // eslint-disable-next-line no-console
          console.warn(`[MMM-MultiGauge] Empty secondary value from ${topic}:`, msg);
        }
        return;
      }

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[MMM-MultiGauge] ${gaugeSecondary.id} secondary: ${value}`);
      }

      this.sendSocketNotification("MG_SECONDARY", {
        gaugeId: gaugeSecondary.id,
        value
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[MMM-MultiGauge] Error parsing secondary value from ${topic}:`, error.message);
    }
  },

  parseSecondaryFromPlain (msg) {
    const numValue = parseFloat(msg);
    if (isNaN(numValue)) {
      return msg.trim();
    }

    return numValue;
  },

  parseSecondaryFromJson (msg, gaugeSecondary) {
    const obj = JSON.parse(msg);
    const value = this.getNestedValue(obj, gaugeSecondary.mqtt_secondary.valuePath || "value");

    if (typeof value === "string") {
      return this.unwrapJsonQuotedString(value);
    }

    return value;
  },

  setupAPIPolling (gauge) {
    if (this.pollingIntervals[gauge.id]) {
      clearInterval(this.pollingIntervals[gauge.id]);
    }

    // Initial fetch
    this.pollAPI(gauge);
    this.pollingIntervals[gauge.id] = setInterval(() => this.pollAPI(gauge), this.config.updateInterval || 30000);
  },

  setupAPISecondaryPolling (gauge) {
    const intervalId = `${gauge.id}_secondary`;
    if (this.pollingIntervals[intervalId]) {
      clearInterval(this.pollingIntervals[intervalId]);
    }

    // Initial fetch
    this.pollAPISecondary(gauge);
    this.pollingIntervals[intervalId] = setInterval(() => this.pollAPISecondary(gauge), this.config.updateInterval || 30000);
  },

  async pollAPI (gauge) {
    try {
      const url = gauge.api.baseUrl + (gauge.api.path || "");
      const opts = {
        method: this.config.api.method || "GET",
        headers: {}
      };

      // Use token from top-level config if available, otherwise fall back to api.token
      const token = this.config.token || this.config.api.token;
      const tokenType = this.config.tokenType || this.config.api.tokenType || "Bearer";

      if (token) {
        opts.headers.Authorization = `${tokenType} ${token}`;
      }

      Object.assign(opts.headers, this.config.api.headers || {});

      const response = await fetch(url, opts);
      const data = await response.json();

      const value = this.getNestedValue(data, gauge.api.valuePath || "value");

      if (isNaN(value)) {
        if (this.config.verbose) {
          // eslint-disable-next-line no-console
          console.warn(`[MMM-MultiGauge] Invalid API value for ${gauge.id}`);
        }
        return;
      }

      const processed = value * (gauge.multiplier || 1) + (gauge.offset || 0);

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[MMM-MultiGauge] API ${gauge.id}: ${processed}`);
      }

      this.sendSocketNotification("MG_DATA", {
        gaugeId: gauge.id,
        value: processed
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[MMM-MultiGauge] API error for ${gauge.id}:`, error.message);
    }
  },

  async pollAPISecondary (gauge) {
    try {
      const url = gauge.api_secondary.baseUrl + (gauge.api_secondary.path || "");
      const opts = {
        method: this.config.api.method || "GET",
        headers: {}
      };

      // Use token from top-level config if available, otherwise fall back to api.token
      const token = this.config.token || this.config.api.token;
      const tokenType = this.config.tokenType || this.config.api.tokenType || "Bearer";

      if (token) {
        opts.headers.Authorization = `${tokenType} ${token}`;
      }

      Object.assign(opts.headers, this.config.api.headers || {});

      const response = await fetch(url, opts);
      const data = await response.json();

      const value = this.getNestedValue(data, gauge.api_secondary.valuePath || "value");

      // Allow both strings and numbers
      if (value === null || typeof value === "undefined" || value === "") {
        if (this.config.verbose) {
          // eslint-disable-next-line no-console
          console.warn(`[MMM-MultiGauge] Empty API secondary value for ${gauge.id}`);
        }
        return;
      }

      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[MMM-MultiGauge] API secondary ${gauge.id}: ${value}`);
      }

      this.sendSocketNotification("MG_SECONDARY", {
        gaugeId: gauge.id,
        value
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[MMM-MultiGauge] API secondary error for ${gauge.id}:`, error.message);
    }
  },

  getNestedValue (obj, path) {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  },

  stop () {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    Object.values(this.pollingIntervals).forEach(clearInterval);
  }
});
