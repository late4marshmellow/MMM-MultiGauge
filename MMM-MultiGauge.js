/*
 * MagicMirror²
 * Module: MMM-MultiGauge
 * By late4marshmellow
 */

/* global Module, Log, Chart */
Module.register("MMM-MultiGauge", {
  defaults: {
    layout: "horizontal",
    spacing: 10,
    columns: 2,

    gauges: [
      {
        id: "gauge1",
        label: "",
        labelSize: 14,
        labelColor: null,
        maxValue: 5000,
        minValue: null,
        postfix: "W",
        colorLow: "#228B22",
        colorMid: "#3b82f6",
        colorHigh: "#B22222",
        colorLowValue: 750,
        colorMidValue: 2500,
        colorHighValue: 4250,
        multiplier: 1,
        offset: 0,
        textColorOverMax: null,
        textColorBelowMin: null,
        glowOverMax: null,
        glowBelowMin: null,
        glowBoolean: null,
        glowTarget: null,
        glowColor: null,
        glowIntensity: null,
        mqtt: {topic: "",
          parser: "json",
          valuePath: "value"},
        // eslint-disable-next-line camelcase
        mqtt_boolean: null,
        api: {baseUrl: "",
          path: "",
          valuePath: "value"}
      }
    ],

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
    glowTarget: "card",
    glowColor: "rgba(255, 0, 0, 0.6)",
    glowColorBelowMin: "rgba(59, 130, 246, 0.6)",
    glowColorBoolean: "rgba(255, 165, 0, 0.6)",
    glowIntensity: "0 0 10px",

    mqtt: {url: "",
      username: "",
      password: "",
      clientId: "",
      qos: 0,
      insecureTLS: false},
    api: {method: "GET",
      tokenType: "Bearer",
      token: "",
      headers: {},
      insecureTLS: false},
    updateInterval: 30 * 1000,
    verbose: false
  },

  getStyles () {
    return ["MMM-MultiGauge.css"];
  },

  getScripts () {
    return [this.file("node_modules/chart.js/dist/chart.umd.js")];
  },

  start () {
    this.charts = [];
    this.canvases = [];
    this.gaugeData = {};
    this.gaugeBooleans = {};
    this.config.gauges.forEach((gauge) => {
      this.gaugeData[gauge.id] = null;
      this.gaugeBooleans[gauge.id] = false;
    });
    this.sendSocketNotification("MG_CONFIG", this.config);
    if (this.config.verbose) {
      Log.info("[MMM-MultiGauge] started");
    }
  },

  getDom () {
    const wrap = document.createElement("div");
    wrap.className = `mg-wrap mg-layout-${this.config.layout}`;

    if (this.config.layout === "grid") {
      wrap.style.gridTemplateColumns = `repeat(${this.config.columns}, 1fr)`;
      wrap.style.gap = `${this.config.spacing}px`;
    } else {
      wrap.style.gap = `${this.config.spacing}px`;
    }

    this.config.gauges.forEach((gaugeConfig, index) => {
      const card = document.createElement("div");
      card.className = "mg-card";
      card.dataset.gaugeId = gaugeConfig.id;

      const canvas = document.createElement("canvas");
      canvas.dataset.gaugeId = gaugeConfig.id;

      const altEl = document.createElement("div");
      altEl.className = "mg-alt";
      altEl.style.display = "none";
      altEl.textContent = "Waiting...";

      card.appendChild(canvas);
      card.appendChild(altEl);
      wrap.appendChild(card);
      this.canvases[index] = canvas;
    });

    // Only init charts if not already initialized
    if (this.charts.length === 0) {
      setTimeout(() => this.initCharts(), 0);
    }
    return wrap;
  },

  initCharts () {
    if (!window.Chart || this.canvases.length === 0) {
      return;
    }
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] init charts");
    }
    this.config.gauges.forEach((gaugeConfig, index) => {
      const canvas = this.canvases[index];
      if (canvas) {
        this.createChart(canvas, gaugeConfig, index);
      }
    });
  },

  parseColor (colorString) {
    if (colorString.startsWith("#")) {
      const hex = colorString.slice(1);
      if (hex.length === 3) {
        return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
      }
      if (hex.length === 6) {
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      }
    }
    const match = colorString.match(/rgba?\((?<red>\d+),\s*(?<green>\d+),\s*(?<blue>\d+)/u);
    if (match) {
      return [parseInt(match.groups.red, 10), parseInt(match.groups.green, 10), parseInt(match.groups.blue, 10)];
    }
    return [0, 200, 0];
  },

  getColorThresholds (gaugeConfig, maxValue) {
    let lowValue = maxValue * 0.15;
    if (gaugeConfig.colorLowValue !== null) {
      lowValue = gaugeConfig.colorLowValue;
    }
    let midValue = maxValue * 0.50;
    if (gaugeConfig.colorMidValue !== null) {
      midValue = gaugeConfig.colorMidValue;
    }
    let highValue = maxValue * 0.85;
    if (gaugeConfig.colorHighValue !== null) {
      highValue = gaugeConfig.colorHighValue;
    }
    return {lowValue,
      midValue,
      highValue};
  },

  interpolateColor ({low, mid, high, value, lowValue, midValue, highValue}) {
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
  },

  createColorFunction (gaugeConfig, maxValue) {
    return (value) => {
      const low = this.parseColor(gaugeConfig.colorLow || "#228B22");
      const mid = this.parseColor(gaugeConfig.colorMid || "#3b82f6");
      const high = this.parseColor(gaugeConfig.colorHigh || "#B22222");
      const {lowValue, midValue, highValue} = this.getColorThresholds(gaugeConfig, maxValue);
      const [red, green, blue] = this.interpolateColor({low,
        mid,
        high,
        value,
        lowValue,
        midValue,
        highValue});
      return `rgb(${red},${green},${blue})`;
    };
  },

  drawGaugeLabel (ctx, gaugeConfig, point) {
    const label = gaugeConfig.label || "";
    if (!label) {
      return false;
    }

    let {textColor: labelColor} = this.config;
    if (!labelColor) {
      labelColor = "#fff";
    }
    if (gaugeConfig.labelColor !== null) {
      ({labelColor} = gaugeConfig);
    }

    ctx.font = `400 ${gaugeConfig.labelSize || 14}px system-ui`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, point.x, point.y - 15);
    return true;
  },

  drawGaugeValue ({ctx, gaugeConfig, point, value, maxValue, hasLabel}) {
    const over = value > maxValue;
    ctx.font = "600 20px system-ui";
    if (over) {
      ctx.fillStyle = this.config.textColorOverMax || "#f55";
    } else {
      ctx.fillStyle = this.config.textColor || "#fff";
    }

    if (over && this.config.glowOverMax && this.config.glowTarget === "text") {
      ctx.shadowColor = this.config.glowColor || "rgba(255,0,0,0.6)";
      ctx.shadowBlur = parseInt((this.config.glowIntensity || "0 0 10px").split(" ")[2], 10) || 10;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let valueY = point.y;
    if (hasLabel) {
      valueY = point.y + 8;
    }
    ctx.fillText(`${value.toLocaleString()} ${gaugeConfig.postfix || "W"}`, point.x, valueY);
  },

  createTextPlugin (gaugeConfig, index, maxValue) {
    return {
      id: `mgText_${index}`,
      afterDraw: (chart, unusedArgs, opts) => {
        const [point] = chart.getDatasetMeta(0).data;
        if (!point) {
          return;
        }
        const {ctx} = chart;
        ctx.save();

        const hasLabel = this.drawGaugeLabel(ctx, gaugeConfig, point);
        this.drawGaugeValue({ctx,
          gaugeConfig,
          point,
          value: opts.value || 0,
          maxValue,
          hasLabel});

        ctx.restore();
      }
    };
  },

  createChart (canvas, gaugeConfig, index) {
    const maxValue = gaugeConfig.maxValue || 5000;
    const colorFn = this.createColorFunction(gaugeConfig, maxValue);
    const textPlugin = this.createTextPlugin(gaugeConfig, index, maxValue);

    const chart = new Chart(canvas, {
      type: "doughnut",
      plugins: [textPlugin],
      data: {datasets: [
        {
          data: [0, maxValue],
          backgroundColor: [gaugeConfig.colorLow || "#228B22", this.config.colorBackground || "#ffffff14"],
          borderWidth: 0,
          cutout: this.config.cutout,
          rotation: this.config.startDeg,
          circumference: this.config.sweepDeg
        }
      ]},
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {duration: this.config.animationDuration || 250},
        plugins: {legend: {display: false},
          tooltip: {enabled: false},
          [`mgText_${index}`]: {value: 0}}
      }
    });

    this.charts[index] = chart;
    chart.colorFunction = colorFn;
    chart.maxValue = maxValue;
    chart.gaugeId = gaugeConfig.id;
  },

  updateGauge (gaugeId, value) {
    const index = this.config.gauges.findIndex((gauge) => gauge.id === gaugeId);
    if (index === -1) {
      return;
    }
    const chart = this.charts[index];
    if (!chart) {
      return;
    }

    this.gaugeData[gaugeId] = value;
    const used = Math.max(0, value);
    const free = Math.max(0, chart.maxValue - value);

    chart.data.datasets[0].data = [used, free];
    chart.data.datasets[0].backgroundColor[0] = chart.colorFunction(value);
    chart.options.plugins[`mgText_${index}`].value = value;
    chart.update();

    this.applyGlowEffects({index,
      gaugeId,
      value,
      chart});
  },

  applyGlowEffects ({index, gaugeId, value, chart}) {
    const card = this.canvases[index]?.parentElement;
    const gaugeConfig = this.config.gauges[index];

    if (!card) {
      return;
    }

    const shouldGlow = this.shouldGaugeGlow(gaugeConfig, value, this.gaugeBooleans[gaugeId]);

    if (shouldGlow.active) {
      let target = this.config.glowTarget;
      if (gaugeConfig.glowTarget !== null) {
        target = gaugeConfig.glowTarget;
      }
      let element = card;
      if (target === "donut") {
        element = this.canvases[index];
      }
      let intensity = this.config.glowIntensity;
      if (gaugeConfig.glowIntensity !== null) {
        intensity = gaugeConfig.glowIntensity;
      }

      element.style.filter = `drop-shadow(${intensity} ${shouldGlow.color})`;
    } else {
      card.style.filter = "";
      if (this.canvases[index]) {
        this.canvases[index].style.filter = "";
      }
    }

    const textPlugin = chart.options.plugins[`mgText_${index}`];
    if (shouldGlow.textColor) {
      textPlugin.textColor = shouldGlow.textColor;
    } else {
      textPlugin.textColor = this.config.textColor;
    }
  },

  shouldGaugeGlow (gaugeConfig, value, booleanState) {
    const maxVal = gaugeConfig.maxValue;
    const minVal = gaugeConfig.minValue;

    const getConfigValue = (gaugeValue, defaultValue) => {
      if (gaugeValue !== null) {
        return gaugeValue;
      }
      return defaultValue;
    };

    // Check boolean trigger (highest priority)
    const glowBoolean = getConfigValue(gaugeConfig.glowBoolean, this.config.glowBoolean);
    if (glowBoolean && booleanState) {
      const color = getConfigValue(gaugeConfig.glowColor, this.config.glowColorBoolean);
      return {active: true,
        color};
    }

    // Check over max
    const glowOverMax = getConfigValue(gaugeConfig.glowOverMax, this.config.glowOverMax);
    if (glowOverMax && value > maxVal) {
      const color = getConfigValue(gaugeConfig.glowColor, this.config.glowColor);
      const textColor = getConfigValue(gaugeConfig.textColorOverMax, this.config.textColorOverMax);
      return {active: true,
        color,
        textColor};
    }

    // Check below min
    const glowBelowMin = getConfigValue(gaugeConfig.glowBelowMin, this.config.glowBelowMin);
    if (glowBelowMin && minVal !== null && value < minVal) {
      const color = getConfigValue(gaugeConfig.glowColor, this.config.glowColorBelowMin);
      const textColor = getConfigValue(gaugeConfig.textColorBelowMin, this.config.textColorBelowMin);
      return {active: true,
        color,
        textColor};
    }

    return {active: false};
  },

  socketNotificationReceived (notification, payload) {
    if (notification === "MG_DATA" && payload && payload.gaugeId !== null && payload.value !== null) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log("[MMM-MultiGauge] data:", payload);
      }
      this.updateGauge(payload.gaugeId, payload.value);
    } else if (notification === "MG_BOOLEAN" && payload && payload.gaugeId !== null && payload.value !== null) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.log("[MMM-MultiGauge] boolean:", payload);
      }
      this.gaugeBooleans[payload.gaugeId] = Boolean(payload.value);
      this.updateDOM();
    } else if (notification === "MG_ERROR" && this.config.verbose) {
      // eslint-disable-next-line no-console
      console.error("[MMM-MultiGauge] error:", payload);
    }
  }
});
