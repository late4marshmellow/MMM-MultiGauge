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
        glowStates: null,
        glowTarget: null,
        glowColor: null,
        glowIntensity: null,
        secondaryText: null,
        secondaryTextPrefix: null,
        secondaryTextSize: 12,
        secondaryTextColor: null,
        secondaryTextPostfix: "",
        mqtt: {topic: "",
          parser: "json",
          valuePath: "value"},
        // eslint-disable-next-line camelcase
        mqtt_boolean: null,
        // eslint-disable-next-line camelcase
        mqtt_secondary: null,
        api: {baseUrl: "",
          path: "",
          valuePath: "value"},
        // eslint-disable-next-line camelcase
        api_secondary: null
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
    glowStates: null,
    glowTarget: "card",
    glowColor: "rgba(255, 0, 0, 0.6)",
    glowColorOverMax: "rgba(255, 0, 0, 0.6)",
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
    token: "",
    tokenType: "",
    updateInterval: 30 * 1000,
    verbose: false
  },

  getStyles () {
    return ["MMM-MultiGauge.css"];
  },
  getScripts () {
    return [
      this.file("MMM-MultiGauge.utils.js"),
      this.file("node_modules/chart.js/dist/chart.umd.js")
    ];
  },

  start () {
    this.charts = [];
    this.canvases = [];
    this.gaugeData = {};
    this.gaugeBooleans = {};
    this.gaugeSecondaryData = {};
    this.config.gauges.forEach((gauge) => {
      this.gaugeData[gauge.id] = null;
      this.gaugeBooleans[gauge.id] = false;
      this.gaugeSecondaryData[gauge.id] = null;
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

  getUtils () {
    if (window.MMMMultiGaugeUtils) {
      return window.MMMMultiGaugeUtils;
    }
    throw new Error("MMM-MultiGauge utilities are not loaded");
  },
  createTextPlugin (gaugeConfig, index, maxValue) {
    const utils = this.getUtils();
    return {
      id: `mgText_${index}`,
      afterDraw: (chart, unusedArgs, opts) => {
        const [point] = chart.getDatasetMeta(0).data;
        if (!point) {
          return;
        }
        const {ctx} = chart;
        ctx.save();

        const hasLabel = utils.drawGaugeLabel({
          ctx,
          gaugeConfig,
          config: this.config,
          point
        });
        utils.drawGaugeValue({ctx,
          gaugeConfig,
          config: this.config,
          point,
          value: opts.value || 0,
          maxValue,
          hasLabel});

        utils.drawSecondaryText({ctx,
          gaugeConfig,
          config: this.config,
          point,
          secondaryValue: opts.secondaryValue,
          hasLabel});

        ctx.restore();
      }
    };
  },

  createChart (canvas, gaugeConfig, index) {
    const utils = this.getUtils();
    const maxValue = gaugeConfig.maxValue || 5000;
    const colorFn = utils.createColorFunction(gaugeConfig, maxValue);
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
          [`mgText_${index}`]: {value: 0,
            secondaryValue: null}}
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

    const plugin = chart.options.plugins[`mgText_${index}`];
    if (plugin) {
      plugin.value = value;
      plugin.secondaryValue = this.gaugeSecondaryData[gaugeId] || null;
    }

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
    this.updateGlowVisuals({
      index,
      gaugeId,
      gaugeConfig,
      card,
      shouldGlow
    });
    this.updateGlowTextColor(chart, index, shouldGlow);
  },

  shouldGaugeGlow (gaugeConfig, value, booleanState) {
    const utils = this.getUtils();
    return utils.computeGlowDecision({
      config: this.config,
      gaugeConfig,
      value,
      booleanState
    });
  },

  updateGlowVisuals ({index, gaugeId, gaugeConfig, card, shouldGlow}) {
    if (shouldGlow.active) {
      this.applyGlowFilter({
        index,
        gaugeId,
        gaugeConfig,
        card,
        shouldGlow
      });
      return;
    }

    this.clearGlowFilter(card, index);
  },

  applyGlowFilter ({index, gaugeId, gaugeConfig, card, shouldGlow}) {
    const target = this.resolveGlowTarget(gaugeConfig);
    const element = this.resolveGlowElement(card, index, target);
    const intensity = this.resolveGlowIntensity(gaugeConfig);

    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[MMM-MultiGauge] Applying glow to ${gaugeId}: drop-shadow(${intensity} ${shouldGlow.color})`);
    }

    element.style.filter = `drop-shadow(${intensity} ${shouldGlow.color})`;
  },

  clearGlowFilter (card, index) {
    card.style.filter = "";
    if (this.canvases[index]) {
      this.canvases[index].style.filter = "";
    }
  },

  resolveGlowTarget (gaugeConfig) {
    if (gaugeConfig.glowTarget !== null) {
      return gaugeConfig.glowTarget;
    }
    return this.config.glowTarget;
  },

  resolveGlowElement (card, index, target) {
    if (target === "donut" && this.canvases[index]) {
      return this.canvases[index];
    }
    return card;
  },

  resolveGlowIntensity (gaugeConfig) {
    if (gaugeConfig.glowIntensity !== null) {
      return gaugeConfig.glowIntensity;
    }
    return this.config.glowIntensity;
  },

  updateGlowTextColor (chart, index, shouldGlow) {
    const textPlugin = chart.options.plugins[`mgText_${index}`];
    if (!textPlugin) {
      return;
    }
    if (shouldGlow.textColor) {
      textPlugin.textColor = shouldGlow.textColor;
      return;
    }
    textPlugin.textColor = this.config.textColor;
  },

  socketNotificationReceived (notification, payload) {
    if (notification === "MG_ERROR") {
      this.handleErrorNotification(payload);
      return;
    }

    if (!this.hasValidPayload(payload)) {
      return;
    }

    if (notification === "MG_DATA") {
      this.handleDataNotification(payload);
      return;
    }

    if (notification === "MG_BOOLEAN") {
      this.handleBooleanNotification(payload);
      return;
    }

    if (notification === "MG_SECONDARY") {
      this.handleSecondaryNotification(payload);
    }
  },

  hasValidPayload (payload) {
    if (!payload) {
      return false;
    }
    if (payload.gaugeId === null) {
      return false;
    }
    if (payload.value === null) {
      return false;
    }
    return true;
  },

  handleDataNotification (payload) {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] data:", payload);
    }
    this.updateGauge(payload.gaugeId, payload.value);
  },

  handleBooleanNotification (payload) {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] boolean:", payload);
    }

    this.gaugeBooleans[payload.gaugeId] = payload.value;
    this.refreshGlowForBoolean(payload.gaugeId);
  },

  refreshGlowForBoolean (gaugeId) {
    const index = this.config.gauges.findIndex((gauge) => gauge.id === gaugeId);
    if (index < 0) {
      return;
    }

    const chart = this.charts[index];
    if (!chart) {
      this.updateDOM();
      return;
    }

    let value = 0;
    const currentValue = this.gaugeData[gaugeId];
    if (typeof currentValue === "number") {
      value = currentValue;
    }

    this.applyGlowEffects({
      index,
      gaugeId,
      value,
      chart
    });
  },

  handleSecondaryNotification (payload) {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.log("[MMM-MultiGauge] secondary:", payload);
    }

    const utils = this.getUtils();
    const {value: rawValue} = payload;
    const value = utils.unwrapJsonQuotedString(rawValue);
    this.gaugeSecondaryData[payload.gaugeId] = value;
    this.refreshSecondaryChartValue(payload.gaugeId, value);
  },

  refreshSecondaryChartValue (gaugeId, value) {
    const index = this.config.gauges.findIndex((gauge) => gauge.id === gaugeId);
    if (index < 0 || !this.charts || !this.charts[index]) {
      return;
    }

    const chart = this.charts[index];
    try {
      const plugin = chart.options?.plugins?.[`mgText_${index}`];
      if (!plugin) {
        return;
      }
      plugin.secondaryValue = value;
      chart.update();
    } catch (error) {
      if (this.config.verbose) {
        // eslint-disable-next-line no-console
        console.warn(`[MMM-MultiGauge] Error updating secondary text for ${gaugeId}:`, error);
      }
    }
  },

  handleErrorNotification (payload) {
    if (this.config.verbose) {
      // eslint-disable-next-line no-console
      console.error("[MMM-MultiGauge] error:", payload);
    }
  }
});
