# Hot Water Temperature Monitor Example

Example configuration for Hotwater Shelly with glow effects and temperature monitoring.

## Gauge Configuration

Copy this gauge config to your `config.js`:

```javascript
{
  id: "hotwater_shelly_temperature",
  label: "Boiler",              // Label displayed above the value
  labelSize: 14,                 // Font size for label (default: 14)
  labelColor: "#ffffff",         // Label color (default: textColor)
  maxValue: 70,
  minValue: 40,                  // Alert if temp drops below 40°C
  postfix: "°C",

  // Color gradient for temperature
  colorLow: "#3b82f6",            // Blue (cold)
  colorMid: "#228B22",            // Green (perfect)
  colorHigh: "#B22222",           // Red (hot)
  colorLowValue: 21,              // Blue until 21°C
  colorMidValue: 42,              // Green from 21-42°C
  colorHighValue: 59,             // Red from 42°C+

  // Glow when temperature is too low (heater should be on)
  glowBelowMin: true,
  textColorBelowMin: "#0088ff",
  glowColorBelowMin: "rgba(59, 130, 246, 0.6)",  // Blue glow

  // Glow when heater is actively heating
  glowBoolean: true,
  glowColorBoolean: "rgba(255, 165, 0, 0.7)",    // Orange glow when heater ON

  // Glow if temperature exceeds safe limit
  glowOverMax: true,
  textColorOverMax: "#ff0000",
  glowColor: "rgba(255, 0, 0, 0.8)",             // Red glow if too hot

  glowTarget: "card",              // Glow the entire card
  glowIntensity: "0 0 12px",       // Medium glow strength

  // Temperature value
  mqtt: {
    topic: "homey/boiler/temperature",
    parser: "plain",
    valuePath: "value"
  },

  // Heater on/off status
  mqtt_boolean: {
    topic: "homey/boiler/heater_state",
    parser: "plain",
    valuePath: "value"
  }
}
```

## How It Works

### 1. Normal Operation (40-70°C, heater off)

- Shows temperature with color gradient
- No glow

### 2. Temperature Drops Below 40°C (heater off)

- 🔵 **BLUE GLOW** - Warning: temperature too low!
- Text turns blue

### 3. Heater Turns ON (actively heating)

- 🟠 **ORANGE GLOW** - Heater is working
- Overrides low temp glow (higher priority)

### 4. Temperature Exceeds 70°C (dangerous)

- 🔴 **RED GLOW** - Temperature too high!
- Text turns red
- Should trigger heater to turn off

## Glow Priority Order

1. **Boolean** (heater ON) → Orange glow
2. **Over Max** (>70°C) → Red glow
3. **Below Min** (<40°C) → Blue glow
