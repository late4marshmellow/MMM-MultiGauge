# Color Gradient Configuration Guide

## Overview

MMM-MultiGauge uses a three-color gradient system that changes based on the actual **value**, not percentages. This gives you precise control over when colors transition.

## Configuration

### Basic Setup

```javascript
{
  id: "my_gauge",
  maxValue: 5000,
  colorLow: "#228B22",       // Green (low/good)
  colorMid: "#3b82f6",       // Blue (medium)
  colorHigh: "#B22222",      // Red (high/warning)
  colorLowValue: 750,        // Green until 750
  colorMidValue: 2500,       // Blue from 750-2500
  colorHighValue: 4250       // Red from 2500+
}
```

### How It Works

The gauge color smoothly transitions through three ranges:

1. **0 → colorLowValue**: Pure `colorLow`
2. **colorLowValue → colorMidValue**: Gradient from `colorLow` to `colorMid`
3. **colorMidValue → colorHighValue**: Gradient from `colorMid` to `colorHigh`
4. **colorHighValue → maxValue**: Pure `colorHigh`

### Visual Example

For a 5000W power gauge:

```javascript
colorLowValue: 750,    // 15% of max
colorMidValue: 2500,   // 50% of max
colorHighValue: 4250   // 85% of max
```

```
Value:     0W -------- 750W -------- 2500W -------- 4250W -------- 5000W
Color:  Green  →  Green→Blue  →  Blue→Red  →  Red
```

## Examples

### 1. Power Consumption (W)

```javascript
{
  id: "house_power",
  maxValue: 5000,
  postfix: "W",
  colorLow: "#228B22",       // Green (efficient)
  colorMid: "#3b82f6",       // Blue (normal)
  colorHigh: "#B22222",      // Red (high usage)
  colorLowValue: 1000,       // Green until 1kW
  colorMidValue: 3000,       // Blue from 1-3kW
  colorHighValue: 4500       // Red from 3kW+
}
```

- **0-1000W**: Green (low usage, good!)
- **1000-3000W**: Green→Blue gradient (normal usage)
- **3000-4500W**: Blue→Red gradient (getting high)
- **4500W+**: Red (high usage, warning!)

### 2. Temperature (°C) - Hot Water

```javascript
{
  id: "boiler_temp",
  maxValue: 70,
  postfix: "°C",
  colorLow: "#3b82f6",       // Blue (cold)
  colorMid: "#228B22",       // Green (perfect)
  colorHigh: "#ff8800",      // Orange (hot)
  colorLowValue: 40,         // Blue until 40°C
  colorMidValue: 50,         // Green from 40-50°C
  colorHighValue: 60         // Orange from 50°C+
}
```

- **0-40°C**: Blue (too cold)
- **40-50°C**: Blue→Green gradient (warming up)
- **50-60°C**: Green→Orange gradient (perfect→hot)
- **60-70°C**: Orange (too hot)

### 3. Temperature (°C) - Room Comfort

```javascript
{
  id: "living_room",
  maxValue: 30,
  postfix: "°C",
  colorLow: "#0088ff",       // Blue (cold)
  colorMid: "#228B22",       // Green (comfortable)
  colorHigh: "#ff0000",      // Red (hot)
  colorLowValue: 19,         // Blue until 19°C
  colorMidValue: 22,         // Green from 19-22°C
  colorHighValue: 24         // Red from 22°C+
}
```

- **0-19°C**: Blue (too cold)
- **19-22°C**: Blue→Green gradient (getting comfortable)
- **22-24°C**: Green→Red gradient (comfortable→warm)
- **24-30°C**: Red (too warm)

### 4. Battery/Percentage (%)

```javascript
{
  id: "battery_level",
  maxValue: 100,
  postfix: "%",
  colorLow: "#ff0000",       // Red (critical)
  colorMid: "#ffa500",       // Orange (low)
  colorHigh: "#228B22",      // Green (good)
  colorLowValue: 20,         // Red until 20%
  colorMidValue: 50,         // Orange from 20-50%
  colorHighValue: 80         // Green from 50%+
}
```

- **0-20%**: Red (critical, charge now!)
- **20-50%**: Red→Orange gradient (low)
- **50-80%**: Orange→Green gradient (improving)
- **80-100%**: Green (good charge)

### 5. Humidity (%)

```javascript
{
  id: "bathroom_humidity",
  maxValue: 100,
  postfix: "%",
  colorLow: "#3b82f6",       // Blue (dry)
  colorMid: "#228B22",       // Green (comfortable)
  colorHigh: "#ff0000",      // Red (too humid)
  colorLowValue: 30,         // Blue until 30%
  colorMidValue: 50,         // Green from 30-50%
  colorHighValue: 70         // Red from 50%+
}
```

## Default Behavior

If you don't specify color values, defaults are calculated as percentages of `maxValue`:

```javascript
colorLowValue: maxValue * 0.15; // 15%
colorMidValue: maxValue * 0.5; // 50%
colorHighValue: maxValue * 0.85; // 85%
```

## Tips

### 1. Equal Ranges

For even color distribution:

```javascript
maxValue: 100,
colorLowValue: 33,    // First third
colorMidValue: 66,    // Second third
colorHighValue: 99    // Final third
```

### 2. Warning Zones

Make the high zone smaller for early warning:

```javascript
maxValue: 5000,
colorLowValue: 2000,   // 40%
colorMidValue: 3500,   // 70%
colorHighValue: 4000   // 80% - red zone starts early
```

### 3. Narrow "Perfect" Zone

Keep optimal range small:

```javascript
// Room temperature: 20-22°C is perfect
maxValue: 30,
colorLowValue: 20,     // Cold → comfortable
colorMidValue: 21,     // Narrow perfect zone
colorHighValue: 22     // Comfortable → warm
```

### 4. Inverted Scale

Reverse colors for things like battery (low = bad):

```javascript
colorLow: "#ff0000",   // Red for low values
colorMid: "#ffa500",   // Orange for medium
colorHigh: "#228B22"   // Green for high values
```

## Color Recommendations

### Standard Scale (Low is Good)

- **Low**: `#228B22` (Green) - Efficient/Good
- **Mid**: `#3b82f6` (Blue) - Normal
- **High**: `#B22222` (Red) - Warning

### Temperature Scale (Cold → Hot)

- **Cold**: `#3b82f6` (Blue)
- **Warm**: `#228B22` (Green) or `#ffa500` (Orange)
- **Hot**: `#ff8800` (Orange) or `#ff0000` (Red)

### Inverted Scale (High is Good)

- **Low**: `#ff0000` (Red) - Warning
- **Mid**: `#ffa500` (Orange) - Caution
- **High**: `#228B22` (Green) - Good

## Migration from Old Format

### Old (Percentage-based):

```javascript
colorLowPoint: 15,     // 15% of maxValue
colorMidPoint: 50,     // 50% of maxValue
colorHighPoint: 85     // 85% of maxValue
```

### New (Value-based):

```javascript
// For maxValue: 5000
colorLowValue: 750,    // Actual value (15% of 5000)
colorMidValue: 2500,   // Actual value (50% of 5000)
colorHighValue: 4250   // Actual value (85% of 5000)
```

Much more intuitive! 🎨
