# Gauge Labels - Configuration Guide

## Overview

Each gauge can display a customizable label above the value to identify what's being measured.

## Configuration Options

### Per-Gauge Label Settings

```javascript
{
  id: "my_gauge",
  label: "Boiler",              // Text to display above the value
  labelSize: 14,                 // Font size in pixels (default: 14)
  labelColor: "#ffffff",         // Color (default: inherits textColor)
  // ... other gauge settings
}
```

## Examples

### 1. Temperature Sensors with Labels

```javascript
gauges: [
  {
    id: "boiler_temp",
    label: "Boiler",
    labelSize: 12,
    labelColor: "#ffffff",
    maxValue: 70,
    postfix: "°C",
    mqtt: {
      topic: "homey/sensors/boiler/temperature",
      parser: "plain"
    }
  },
  {
    id: "outdoor_temp",
    label: "Outside",
    labelSize: 14,
    labelColor: "#88ccff",
    maxValue: 40,
    postfix: "°C",
    mqtt: {
      topic: "homey/sensors/outdoor/temperature",
      parser: "plain"
    }
  }
];
```

### 2. Power Monitoring with Different Label Sizes

```javascript
gauges: [
  {
    id: "house_power",
    label: "HOUSE", // Larger label
    labelSize: 16,
    labelColor: "#ffd700", // Gold color
    maxValue: 5000,
    postfix: "W",
    mqtt: {
      topic: "homey/energy/main-meter/power",
      parser: "plain"
    }
  },
  {
    id: "solar_power",
    label: "Solar", // Smaller label
    labelSize: 12,
    labelColor: "#90ee90", // Light green
    maxValue: 3000,
    postfix: "W",
    mqtt: {
      topic: "homey/energy/solar/power",
      parser: "plain"
    }
  }
];
```

### 3. Multi-Room Temperature Dashboard

```javascript
gauges: [
  {
    id: "living_room_temp",
    label: "Living",
    labelSize: 11,
    maxValue: 30,
    postfix: "°C"
  },
  {
    id: "bedroom_temp",
    label: "Bedroom",
    labelSize: 11,
    maxValue: 30,
    postfix: "°C"
  },
  {
    id: "bathroom_temp",
    label: "Bath",
    labelSize: 11,
    maxValue: 30,
    postfix: "°C"
  },
  {
    id: "kitchen_temp",
    label: "Kitchen",
    labelSize: 11,
    maxValue: 30,
    postfix: "°C"
  }
];
```

### 4. Complete Example with Label + Glow

```javascript
{
  id: "hotwater_shelly",
  label: "Hot Water",            // Label above value
  labelSize: 13,
  labelColor: "#ffffff",

  maxValue: 70,
  minValue: 40,
  postfix: "°C",

  // Temperature colors
  colorLow: "#3b82f6",
  colorMid: "#228B22",
  colorHigh: "#B22222",

  // Glow effects
  glowBelowMin: true,
  glowBoolean: true,             // Glow when heater is ON
  glowOverMax: true,

  mqtt: {
    topic: "homey/boiler/temperature",
    parser: "plain"
  },

  mqtt_boolean: {
    topic: "homey/boiler/heater_state",
    parser: "plain"
  }
}
```

### 5. No Label (Default Behavior)

```javascript
{
  id: "simple_gauge",
  label: "",                     // Empty = no label shown
  maxValue: 100,
  postfix: "%"
  // Label will not be displayed
}
```

## Label Styling Tips

### Font Sizes

- **Small** (10-12px): Good for compact layouts with many gauges
- **Medium** (13-15px): Standard readable size
- **Large** (16-18px): Emphasis on important gauges

### Color Coordination

```javascript
// Match label to gauge purpose
{
  label: "Heating",
  labelColor: "#ff6b6b",    // Red/warm color
  colorHigh: "#ff0000"
}

{
  label: "Cooling",
  labelColor: "#4dabf7",    // Blue/cool color
  colorLow: "#0088ff"
}

{
  label: "Power",
  labelColor: "#ffd700",    // Gold/energy color
  colorHigh: "#ff8800"
}
```

### Label Positioning

The label is automatically positioned:

- **With label**: Label 15px above center, value 8px below center
- **Without label**: Value centered in gauge

## Visual Layout

```
┌─────────────────┐
│                 │
│     Boiler      │  ← Label (labelSize, labelColor)
│      65°C       │  ← Value (20px, textColor/textColorOverMax)
│                 │
└─────────────────┘
```

## Common Use Cases

### Kitchen Appliances

- "Fridge", "Freezer", "Oven"

### HVAC

- "Living", "Bedroom", "Office"
- "Heat", "Cool", "Fan"

### Energy

- "House", "Solar", "Grid"
- "Heating", "Cooling", "Hotwater"

### Water/Tank

- "Tank", "Well", "Pressure"

### Outdoor

- "Outside", "Garden", "Pool"
