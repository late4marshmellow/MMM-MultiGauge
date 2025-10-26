# MMM-MultiGauge Glow Feature Examples

## Overview

The glow feature allows gauges to visually indicate special states:

- **Over Max**: Value exceeds maxValue
- **Below Min**: Value drops below minValue
- **Boolean Trigger**: External on/off sensor activates glow

## Configuration Options

### Global Defaults (apply to all gauges unless overridden)

```javascript
{
  module: "MMM-MultiGauge",
  config: {
    // Global glow settings
    textColorOverMax: "#ff5a5a",           // Text color when over max
    textColorBelowMin: "#3b82f6",          // Text color when below min
    glowOverMax: true,                      // Enable glow when over max
    glowBelowMin: false,                    // Enable glow when below min
    glowBoolean: false,                     // Enable glow from boolean trigger
    glowTarget: "card",                     // "card" or "donut"
    glowColor: "rgba(255, 0, 0, 0.6)",      // Glow color for over max
    glowColorBelowMin: "rgba(59, 130, 246, 0.6)",  // Glow color for below min
    glowColorBoolean: "rgba(255, 165, 0, 0.6)",    // Glow color for boolean
    glowIntensity: "0 0 10px",              // CSS drop-shadow intensity

    gauges: [...]
  }
}
```

### Per-Gauge Settings (override globals)

```javascript
{
  id: "hotwater_temperature",
  maxValue: 70,
  minValue: 40,                            // Trigger glow if temp drops below this
  postfix: "°C",

  // Per-gauge glow overrides (null = use global)
  textColorOverMax: "#ff0000",
  textColorBelowMin: "#0088ff",
  glowOverMax: true,
  glowBelowMin: true,
  glowBoolean: true,
  glowTarget: "donut",                     // Glow only the donut, not the card
  glowColor: "rgba(255, 100, 0, 0.8)",    // Custom glow color
  glowIntensity: "0 0 15px",               // Stronger glow

  mqtt: {
    topic: "homey/sensors/living-room/temperature",
    parser: "plain",
    valuePath: "value"
  },

  mqtt_boolean: {
    topic: "homey/devices/abc123/capabilities/onoff/value",
    parser: "plain",
    valuePath: "value"  // Can be boolean, "true"/"false", "1"/"0", "on"/"off"
  }
}
```

## Example Use Cases

### 1. Temperature Sensor with Heater Status

```javascript
{
  id: "living_room_temp",
  maxValue: 30,
  minValue: 18,           // Glow blue if temp drops below 18°C
  postfix: "°C",
  glowBelowMin: true,
  glowBoolean: true,      // Glow orange when heater is on
  glowTarget: "card",

  mqtt: {
    topic: "homey/sensors/temp-sensor/temperature",
    parser: "plain"
  },

  mqtt_boolean: {
    topic: "homey/heaters/living-room/state",
    parser: "plain"
  }
}
```

### 2. Power Gauge with Alert on High Usage

```javascript
{
  id: "house_power",
  maxValue: 5000,
  postfix: "W",
  glowOverMax: true,       // Glow red when over 5000W
  glowTarget: "card",
  textColorOverMax: "#ff0000",

  mqtt: {
    topic: "homey/energy/power",
    parser: "plain"
  }
}
```

### 3. Freezer Temperature with Door Sensor

```javascript
{
  id: "freezer_temp",
  maxValue: 0,
  minValue: -25,
  postfix: "°C",
  glowOverMax: true,       // Glow red if temp rises above 0°C
  glowBoolean: true,       // Glow orange when door is open
  glowTarget: "donut",     // Only glow the gauge, not the card

  mqtt: {
    topic: "homey/appliances/freezer/temperature",
    parser: "plain"
  },

  mqtt_boolean: {
    topic: "homey/appliances/freezer/door_open",
    parser: "plain"
  }
}
```

### 4. Water Tank Level with Pump Status

```javascript
{
  id: "water_tank",
  maxValue: 100,
  minValue: 20,            // Glow when tank is below 20%
  postfix: "%",
  glowBelowMin: true,
  glowBoolean: true,       // Glow when pump is running
  glowColorBelowMin: "rgba(255, 0, 0, 0.6)",      // Red for low level
  glowColorBoolean: "rgba(0, 255, 0, 0.6)",       // Green when pumping

  mqtt: {
    topic: "homey/water/tank/level",
    parser: "plain"
  },

  mqtt_boolean: {
    topic: "homey/water/pump/state",
    parser: "plain"
  }
}
```

## Glow Priority

When multiple conditions are true, the glow color is applied in this order:

1. **Boolean** (highest priority) - External trigger
2. **Over Max** - Value exceeds maxValue
3. **Below Min** - Value below minValue

## Supported Boolean Values

The `mqtt_boolean` topic supports:

- **JSON**: `true` / `false`
- **Plain text**:
  - `"true"` / `"false"`
  - `"1"` / `"0"`
  - `"on"` / `"off"`

## Tips

- Use `glowTarget: "card"` for stronger visual effect (glows entire card)
- Use `glowTarget: "donut"` for subtle effect (glows only the gauge)
- Set `minValue: null` if you don't want below-min glowing
- Per-gauge settings override global settings (use `null` to inherit global)
