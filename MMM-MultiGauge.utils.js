/*
 * MagicMirror²
 * Module: MMM-MultiGauge utils
 */

(function initMultiGaugeUtils () {
  const parseColor = function parseColor (colorString) {
    if (colorString.startsWith("#")) {
      const hex = colorString.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      }
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }

    const match = colorString.match(/rgba?\((?<red>\d+),\s*(?<green>\d+),\s*(?<blue>\d+)/u);
    if (match) {
      return [
        parseInt(match.groups.red, 10),
        parseInt(match.groups.green, 10),
        parseInt(match.groups.blue, 10)
      ];
    }
    return [0, 200, 0];
  };

  const getConfigValue = function getConfigValue (gaugeValue, defaultValue) {
    if (gaugeValue !== null) {
      return gaugeValue;
    }
    return defaultValue;
  };

  const getColorThresholds = function getColorThresholds (gaugeConfig, maxValue) {
    let lowValue = maxValue * 0.15;
    if (gaugeConfig.colorLowValue !== null) {
      lowValue = gaugeConfig.colorLowValue;
    }

    let midValue = maxValue * 0.5;
    if (gaugeConfig.colorMidValue !== null) {
      midValue = gaugeConfig.colorMidValue;
    }

    let highValue = maxValue * 0.85;
    if (gaugeConfig.colorHighValue !== null) {
      highValue = gaugeConfig.colorHighValue;
    }

    return {
      lowValue,
      midValue,
      highValue
    };
  };

  const interpolateColor = function interpolateColor (options) {
    const {
      low,
      mid,
      high,
      value,
      lowValue,
      midValue,
      highValue
    } = options;
    const lerp = (start, end, ratio) => start + (end - start) * ratio;

    if (value <= lowValue) {
      return low;
    }

    if (value <= midValue) {
      let ratio = 0;
      if (midValue - lowValue > 0) {
        ratio = (value - lowValue) / (midValue - lowValue);
      }

      return [
        Math.round(lerp(low[0], mid[0], ratio)),
        Math.round(lerp(low[1], mid[1], ratio)),
        Math.round(lerp(low[2], mid[2], ratio))
      ];
    }

    if (value <= highValue) {
      let ratio = 0;
      if (highValue - midValue > 0) {
        ratio = (value - midValue) / (highValue - midValue);
      }

      return [
        Math.round(lerp(mid[0], high[0], ratio)),
        Math.round(lerp(mid[1], high[1], ratio)),
        Math.round(lerp(mid[2], high[2], ratio))
      ];
    }

    return high;
  };

  const createColorFunction = function createColorFunction (gaugeConfig, maxValue) {
    return (value) => {
      const low = parseColor(gaugeConfig.colorLow || "#228B22");
      const mid = parseColor(gaugeConfig.colorMid || "#3b82f6");
      const high = parseColor(gaugeConfig.colorHigh || "#B22222");
      const thresholds = getColorThresholds(gaugeConfig, maxValue);
      const rgb = interpolateColor({
        low,
        mid,
        high,
        value,
        lowValue: thresholds.lowValue,
        midValue: thresholds.midValue,
        highValue: thresholds.highValue
      });
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    };
  };

  const drawGaugeLabel = function drawGaugeLabel (options) {
    const {
      ctx,
      gaugeConfig,
      config,
      point
    } = options;
    const label = gaugeConfig.label || "";
    if (!label) {
      return false;
    }

    let labelColor = config.textColor;
    if (!labelColor) {
      labelColor = "#fff";
    }
    const {labelColor: gaugeLabelColor} = gaugeConfig;
    if (gaugeLabelColor !== null) {
      labelColor = gaugeLabelColor;
    }

    ctx.font = `400 ${gaugeConfig.labelSize || 14}px system-ui`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, point.x, point.y - 15);
    return true;
  };

  const drawGaugeValue = function drawGaugeValue (options) {
    const {
      ctx,
      gaugeConfig,
      config,
      point,
      value,
      maxValue,
      hasLabel
    } = options;
    const over = value > maxValue;
    ctx.font = "600 20px system-ui";
    if (over) {
      ctx.fillStyle = config.textColorOverMax || "#f55";
    } else {
      ctx.fillStyle = config.textColor || "#fff";
    }

    if (over && config.glowOverMax && config.glowTarget === "text") {
      ctx.shadowColor = config.glowColorOverMax || "rgba(255,0,0,0.6)";
      ctx.shadowBlur = parseInt((config.glowIntensity || "0 0 10px").split(" ")[2], 10) || 10;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let valueY = point.y;
    if (hasLabel) {
      valueY = point.y + 8;
    }
    ctx.fillText(`${value.toLocaleString()} ${gaugeConfig.postfix || "W"}`, point.x, valueY);
  };

  const drawSecondaryText = function drawSecondaryText (options) {
    const {
      ctx,
      gaugeConfig,
      config,
      point,
      secondaryValue,
      hasLabel
    } = options;
    if (secondaryValue === null || typeof secondaryValue === "undefined") {
      return;
    }

    const prefix = gaugeConfig.secondaryTextPrefix || "";
    const postfix = gaugeConfig.secondaryTextPostfix || "";
    const fontSize = gaugeConfig.secondaryTextSize || 12;
    const color = gaugeConfig.secondaryTextColor || config.textColor || "#fff";

    ctx.font = `400 ${fontSize}px system-ui`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let secondaryY = point.y + 20;
    if (hasLabel) {
      secondaryY = point.y + 28;
    }

    if (typeof secondaryValue === "number") {
      ctx.fillText(`${prefix}${secondaryValue.toLocaleString()}${postfix}`, point.x, secondaryY);
      return;
    }

    if (typeof secondaryValue === "string") {
      ctx.fillText(`${prefix}${secondaryValue}${postfix}`, point.x, secondaryY);
      return;
    }

    ctx.fillText(`${prefix}${String(secondaryValue)}${postfix}`, point.x, secondaryY);
  };

  const checkStateGlow = function checkStateGlow (config, gaugeConfig, booleanState) {
    if (!gaugeConfig.glowStates || !booleanState) {
      return null;
    }
    const stateKey = String(booleanState).toLowerCase();
    const stateConfig = gaugeConfig.glowStates[stateKey] || gaugeConfig.glowStates[booleanState];
    if (!stateConfig) {
      return null;
    }

    if (stateConfig.color) {
      return {
        active: true,
        color: stateConfig.color,
        textColor: stateConfig.textColor || null
      };
    }
    return {
      active: false
    };
  };

  const checkBooleanGlow = function checkBooleanGlow (config, gaugeConfig, booleanState) {
    const glowBoolean = getConfigValue(gaugeConfig.glowBoolean, config.glowBoolean);
    if (!glowBoolean || booleanState !== true) {
      return null;
    }

    let color = getConfigValue(gaugeConfig.glowColorBoolean, config.glowColorBoolean);
    if (!color) {
      color = getConfigValue(gaugeConfig.glowColor, config.glowColor);
    }
    return {
      active: true,
      color
    };
  };

  const checkOverMaxGlow = function checkOverMaxGlow (config, gaugeConfig, value) {
    const glowOverMax = getConfigValue(gaugeConfig.glowOverMax, config.glowOverMax);
    if (!glowOverMax || value <= gaugeConfig.maxValue) {
      return null;
    }

    let color = getConfigValue(gaugeConfig.glowColorOverMax, config.glowColorOverMax);
    if (!color) {
      color = getConfigValue(gaugeConfig.glowColor, config.glowColor);
    }

    const textColor = getConfigValue(gaugeConfig.textColorOverMax, config.textColorOverMax);
    return {
      active: true,
      color,
      textColor
    };
  };

  const checkBelowMinGlow = function checkBelowMinGlow (config, gaugeConfig, value) {
    const glowBelowMin = getConfigValue(gaugeConfig.glowBelowMin, config.glowBelowMin);
    if (!glowBelowMin || gaugeConfig.minValue === null || value >= gaugeConfig.minValue) {
      return null;
    }

    let color = getConfigValue(gaugeConfig.glowColorBelowMin, config.glowColorBelowMin);
    if (!color) {
      color = getConfigValue(gaugeConfig.glowColor, config.glowColor);
    }

    const textColor = getConfigValue(gaugeConfig.textColorBelowMin, config.textColorBelowMin);
    return {
      active: true,
      color,
      textColor
    };
  };

  const computeGlowDecision = function computeGlowDecision (options) {
    const {
      config,
      gaugeConfig,
      value,
      booleanState
    } = options;

    const stateResult = checkStateGlow(config, gaugeConfig, booleanState);
    if (stateResult) {
      return stateResult;
    }

    const booleanResult = checkBooleanGlow(config, gaugeConfig, booleanState);
    if (booleanResult) {
      return booleanResult;
    }

    const overResult = checkOverMaxGlow(config, gaugeConfig, value);
    if (overResult) {
      return overResult;
    }

    const belowResult = checkBelowMinGlow(config, gaugeConfig, value);
    if (belowResult) {
      return belowResult;
    }

    return {
      active: false
    };
  };

  const unwrapJsonQuotedString = function unwrapJsonQuotedString (value) {
    if (typeof value !== "string") {
      return value;
    }

    try {
      const unwrapped = JSON.parse(value);
      if (typeof unwrapped === "string") {
        return unwrapped;
      }
    } catch {
      return value;
    }
    return value;
  };

  window.MMMMultiGaugeUtils = {
    createColorFunction,
    drawGaugeLabel,
    drawGaugeValue,
    drawSecondaryText,
    computeGlowDecision,
    unwrapJsonQuotedString
  };
}());
