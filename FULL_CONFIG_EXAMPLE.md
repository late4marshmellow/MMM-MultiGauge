# Complete MMM-MultiGauge Configuration Example

This is a complete working configuration example showing all three gauges with labels and glow effects.

## Full Module Configuration

Copy this entire module configuration to your `config.js`:

```javascript
{
  module: "MMM-MultiGauge",
  position: "bottom_center",
  config: {
    layout: "horizontal",
    spacing: 10,
    columns: 2,

    gauges: [
      {
        id: "measure_power",
        label: "Power",                // Add label
        labelSize: 13,
        maxValue: 5000,
        postfix: "W",
        colorLow: "#228B22",
        colorMid: "#3b82f6",
        colorHigh: "#B22222",
        colorLowValue: 750,            // Green until 750W
        colorMidValue: 2500,           // Blue from 750-2500W
        colorHighValue: 4250,          // Red from 2500W+
        mqtt: {
          topic: "homey/power/consumption",
          parser: "plain",
          valuePath: "value"
        }
      },
      {
        id: "current_Wh",
        label: "Consumption",          // Add label
        labelSize: 13,
        maxValue: 5000,
        postfix: "Wh",
        colorLow: "#228B22",
        colorMid: "#3b82f6",
        colorHigh: "#B22222",
        colorLowValue: 750,            // Green until 750Wh
        colorMidValue: 2500,           // Blue from 750-2500Wh
        colorHighValue: 4250,          // Red from 2500Wh+
        mqtt: {
          topic: "homey/power/hourly",
          parser: "plain",
          valuePath: "value"
        }
      },
      {
        id: "hotwater_shelly_temperature",
        label: "Hot Water",            // Add label
        labelSize: 14,
        labelColor: "#ffffff",
        maxValue: 70,
        minValue: 40,
        postfix: "°C",
        colorLow: "#3b82f6",
        colorMid: "#228B22",
        colorHigh: "#B22222",
        colorLowValue: 46,             // Blue until 46°C
        colorMidValue: 52,             // Green from 46-52°C
        colorHighValue: 60,            // Red from 52°C+
        glowBelowMin: true,
        glowBoolean: true,
        glowOverMax: true,
        glowTarget: "card",
        mqtt: {
          topic: "homey/boiler/temperature",
          parser: "plain",
          valuePath: "value"
        },
        mqtt_boolean: {
          topic: "homey/boiler/heater_state",
          parser: "plain",
          valuePath: "value"
        }
      }
    ],

    // Global settings
    startDeg: 0,
    sweepDeg: 360,
    cutout: "60%",
    animationDuration: 1000,
    colorBackground: "#ffffff14",
    textColor: "#fff",
    textColorOverMax: "#ff5a5a",
    textColorBelowMin: "#3b82f6",
    glowOverMax: true,
    glowBelowMin: false,
    glowBoolean: false,
    glowTarget: "card",
    glowColor: "rgba(255, 0, 0, 0.6)",
    glowColorBelowMin: "rgba(59, 130, 246, 0.6)",
    glowColorBoolean: "rgba(255, 165, 0, 0.6)",
    glowIntensity: "0 0 10px",

    mqtt: {
      url: "mqtt://192.168.1.100:1883",
      username: "",
      password: "",
      clientId: "mmm-multigauge",
      qos: 0,
      insecureTLS: false
    },
    updateInterval: 30 * 1000,
    verbose: false
  }
}
```

## What This Configuration Does

### Gauge 1: Power (W)

- Label: "Power"
- Shows current house power consumption in Watts
- Color gradient: Green → Blue → Red

### Gauge 2: Consumption (Wh)

- Label: "Consumption"
- Shows current hour energy consumption in Watt-hours
- Color gradient: Green → Blue → Red

### Gauge 3: Hot Water (°C)

- Label: "Hot Water"
- Shows boiler temperature with multiple glow effects:
  - 🔵 Blue glow if temp < 40°C
  - 🟠 Orange glow when heater is ON
  - 🔴 Red glow if temp > 70°C

## Customization Tips

### Change Labels

```javascript
label: "Your Custom Text",
labelSize: 14,           // Adjust size
labelColor: "#ffffff"    // Change color
```

### Change Layout

```javascript
layout: "horizontal",    // or "vertical" or "grid"
spacing: 10,             // Space between gauges
columns: 2               // For grid layout
```

### Adjust Colors

```javascript
colorLow: "#228B22",     // Green
colorMid: "#3b82f6",     // Blue
colorHigh: "#B22222"     // Red
```
