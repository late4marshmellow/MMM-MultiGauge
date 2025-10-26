# MMM-MultiGauge

![MMM-MultiGauge screenshot](./MultiGauge.PNG)

Universal multi-gauge dashboard for MagicMirror². Display multiple independent donut gauges (Chart.js) from MQTT or HTTP APIs with smart coloring, labels, and optional glow effects.

## Features

- Multiple gauges in horizontal, vertical, or grid layouts
- Dynamic color thresholds (low/mid/high) with smooth interpolation
- Data sources: MQTT (value + optional boolean) and HTTP API
- Per-gauge labels, postfix, min/max, multipliers, and offsets
- Visual alerts: glow on over-max, below-min, or external boolean
- Lightweight and fast (Chart.js v4), strict linted codebase

## Requirements

- MagicMirror² (v2.24+ recommended)
- Node.js 18 or newer

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/late4marshmellow/MMM-MultiGauge.git
cd MMM-MultiGauge
npm install
```

## Quick start (basic config)

Add to your `config/config.js`:

```javascript
{
  module: "MMM-MultiGauge",
  position: "top_left",
  config: {
    layout: "horizontal", // "horizontal" | "vertical" | "grid"
    spacing: 10,
    columns: 2, // used only in grid layout

    // Global (fallback) options
    startDeg: 0,
    sweepDeg: 360,
    cutout: "60%",
    animationDuration: 250,
    colorBackground: "#ffffff14",
    textColor: "#fff",
    textColorOverMax: "#ff5a5a",
    textColorBelowMin: "#3b82f6",
    glowOverMax: true,
    glowBelowMin: false,
    glowBoolean: false,
    glowTarget: "card", // "card" | "text" | "donut"
    glowColor: "rgba(255, 0, 0, 0.6)",
    glowColorBelowMin: "rgba(59, 130, 246, 0.6)",
    glowColorBoolean: "rgba(255, 165, 0, 0.6)",
    glowIntensity: "0 0 10px",

    // MQTT broker (optional)
    mqtt: {
      url: "mqtt://127.0.0.1:1883",
      username: "",
      password: "",
      clientId: "",
      qos: 0,
      insecureTLS: false
    },

    // HTTP API (optional)
    api: {
      method: "GET",
      tokenType: "Bearer",
      token: "",
      headers: {},
      insecureTLS: false
    },

    updateInterval: 30 * 1000,
    verbose: false,

    gauges: [
      {
        id: "gauge1",
        label: "Power",
        labelSize: 14,
        labelColor: null,
        postfix: "W",
        maxValue: 5000,
        minValue: null,
        colorLow: "#228B22",
        colorMid: "#3b82f6",
        colorHigh: "#B22222",
        colorLowValue: 750,
        colorMidValue: 2500,
        colorHighValue: 4250,
        multiplier: 1,
        offset: 0,

        // Source 1: MQTT value
        mqtt: {
          topic: "home/power/active", // plain or JSON
          parser: "json", // "plain" | "json"
          valuePath: "value" // used when parser is json
        },

        // Optional: MQTT boolean for glow (e.g. warning state)
        mqtt_boolean: {
          topic: "home/power/warning",
          parser: "plain", // or json
          valuePath: "value"
        },

        // Or Source 2: HTTP API (instead of MQTT)
        // api: { baseUrl: "https://example/api/", path: "status", valuePath: "data.power" }
      }
    ]
  }
}
```

## Homey integration (discover topics)

This module works great with Homey. The most reliable path is: run the official Homey MQTT Broker, then publish device values to topics and point MMM-MultiGauge to those topics.

### 1. Install the official MQTT Server on Homey

- Install: https://homey.app/en-no/app/net.weejewel.mqttserver/MQTT-Server/
- Open the app on Homey and note the broker IP/port and if set, username/password.

### 2. Connect MagicMirror to Homey's broker

In your MMM-MultiGauge `config.js`, set:

```javascript
mqtt: {
  url: "mqtt://<HOMEY_IP>:1883",
  username: "<if-configured>",
  password: "<if-configured>",
  clientId: "mmm-multigauge",
  qos: 0,
  insecureTLS: false
}
```

### 3. Discover Homey devices and topics

The module includes a helper tool to discover your Homey devices and generate ready-to-use MQTT topic paths.

**First-time setup:**

```bash
cd ~/MagicMirror/modules/MMM-MultiGauge
cp tools/discover-homey-devices.js.sample tools/discover-homey-devices.js
```

Edit `tools/discover-homey-devices.js` and replace:

- `HOMEY_IP` with your Homey's local IP address (e.g., `192.168.1.50`)
- `API_KEY` with your Homey API token (generate in Homey settings → Experiments → Bearer Tokens)

**Run the discovery tool:**

```bash
node tools/discover-homey-devices.js
# or with filters:
node tools/discover-homey-devices.js power              # devices with "power" in name
node tools/discover-homey-devices.js "" measure_power   # devices with measure_power capability
```

This script queries your Homey local HTTP API and lists:

- Device names and IDs
- Available capabilities (measure_power, measure_temperature, etc.)
- Full MQTT topic path suggestions ready to copy into your config

**Note:** The configured `discover-homey-devices.js` file is gitignored to keep your API token safe if you fork/push changes

### 4. Understanding Homey topic structure

Homey MQTT topics follow this pattern:

```
homey/devices/<DEVICE_ID>/capabilities/<CAPABILITY_NAME>/value
```

**Example topic:**

```
homey/devices/a3f8e2c1-9b4d-4a7e-8f3c-d5e9b2a1c6f4/capabilities/measure_power/value
```

Where:

- `a3f8e2c1-9b4d-4a7e-8f3c-d5e9b2a1c6f4` = unique device ID (UUID format)
- `measure_power` = capability name (also: `measure_temperature`, `onoff`, `meter_power`, etc.)

**Common capabilities:**

- `measure_power` - Current power consumption (W)
- `measure_temperature` - Temperature sensor (°C)
- `meter_power` - Total energy consumption (kWh)
- `onoff` - Boolean on/off state
- `alarm_contact` - Door/window sensor
- `dim` - Dimmer level (0-1)

### 5. Configure gauges with Homey topics

```javascript
gauges: [
  {
    id: "living_room_power",
    label: "Power",
    postfix: "W",
    maxValue: 3000,
    mqtt: {
      topic: "homey/devices/a3f8e2c1-9b4d-4a7e-8f3c-d5e9b2a1c6f4/capabilities/measure_power/value",
      parser: "plain"
    }
  },
  {
    id: "boiler_temp",
    label: "Boiler",
    postfix: "°C",
    maxValue: 70,
    minValue: 40,
    mqtt: {
      topic: "homey/devices/b7c2d8e3-1f5a-4c9e-a2d6-e8f3b9c1d4a7/capabilities/measure_temperature/value",
      parser: "plain"
    },
    mqtt_boolean: {
      topic: "homey/devices/b7c2d8e3-1f5a-4c9e-a2d6-e8f3b9c1d4a7/capabilities/onoff/value",
      parser: "plain"
    }
  }
];
```

### Alternative: Simplified topics via Flows

If you prefer shorter topic names, create Homey Flows to republish values:

**Flow example:**

- **When**: Device capability changed (e.g., power meter updates)
- **Then**: Publish MQTT message to `homey/power/living_room` with value

This gives you clean, readable topics:

```javascript
mqtt: {
  topic: "homey/power/living_room",
  parser: "plain"
}
```

### Tips for discovery

- Use MQTT Explorer to browse your Homey broker and see live data.
- Run the discovery tool after copying and configuring `tools/discover-homey-devices.js.sample` to get exact topic paths.
- With MQTT Hub-style apps, topics auto-publish; with Flows, you control naming.

## Advanced options (per gauge)

- Color thresholds: `colorLow`, `colorMid`, `colorHigh` and their value anchors `colorLowValue`, `colorMidValue`, `colorHighValue`
- Min/Max: `minValue`, `maxValue` (text color feedback uses these)
- Transform: `multiplier`, `offset` (e.g., watts→kilowatts)
- Labels: `label`, `labelSize`, `labelColor`
- Glow controls: `glowOverMax`, `glowBelowMin`, `glowBoolean`, `glowTarget`, `glowColor`, `glowColorBelowMin`, `glowColorBoolean`, `glowIntensity`

## Styling

You can further customize via `MMM-MultiGauge.css` or global CSS.

## Troubleshooting

- Gauge shows “Waiting…”: Verify your data source is configured and publishing.
- No MQTT updates: Confirm broker URL/credentials, and that topics are populated (use MQTT Explorer). Check MagicMirror logs.
- JSON parsing errors: Ensure `parser` matches your payload and `valuePath` points to a numeric property.
- Colors look off: Adjust `color*Value` anchors or set explicit `colorLow/Mid/High`.

## Contributing

Please read `CODE_OF_CONDUCT.md` before contributing. PRs and issues are welcome.

## License

MIT — see `LICENSE`.
