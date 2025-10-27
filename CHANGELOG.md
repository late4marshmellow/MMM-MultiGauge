# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

- Dependency updates
- Documentation improvements

## [1.0.1] - 2025-10-27

### Fixed

- Boolean-triggered glow could remain active after the boolean switched off if no new numeric update arrived. Now glow is re-evaluated immediately on boolean changes to clear it correctly.
- Minor lint/style adjustments in boolean handler.

## [1.0.0] - 2025-10-26

### Added

- Initial public release of MMM-MultiGauge
- Chart.js donut gauges with dynamic color thresholds
- MQTT and API data sources
- Glow effects and text styling
- Strict ESLint configuration and formatting tooling

[Unreleased]: https://github.com/late4marshmellow/MMM-MultiGauge/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/late4marshmellow/MMM-MultiGauge/releases/tag/v1.0.1
[1.0.0]: https://github.com/late4marshmellow/MMM-MultiGauge/releases/tag/v1.0.0
