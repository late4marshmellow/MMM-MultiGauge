# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

- Dependency updates
- Documentation improvements

## [1.1.0] - 2025-10-30

### Added

- Discovery tool (tools/discover-homey-devices.js):
	- Wildcard and regex filters for device name, capability, zone, and unit/postfix.
	- Combine filters to progressively narrow results (all filters are ANDed).
	- Inline JSON gauge configuration printed directly under each matching capability.
	- Auto-load Homey IP from MMM-MultiGauge MQTT url and API token from module config.js.
	- CLI overrides: `--ip` and `--token` take highest priority.
	- Sample script `.sample` retained with configuration/settings descriptions for reference.
- Module config: support top-level `token` and `tokenType` so users don’t need to define them twice (also kept nested api.token for backward compatibility).

### Changed

- Discovery output formatting to show per-capability JSON blocks inline for easier copy/paste.
- Credential loading priority clarified: CLI > manual constants > MagicMirror config.js.
- General cleanup of sample script comments to keep only configuration and settings descriptions.

### Fixed

- Capability filter now applies to the displayed capabilities as well as device selection. Previously, matching a capability (e.g., `*month*`) would still list non-matching capabilities for that device; now only matching capabilities are shown.

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

[Unreleased]: https://github.com/late4marshmellow/MMM-MultiGauge/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/late4marshmellow/MMM-MultiGauge/releases/tag/v1.1.0
[1.0.1]: https://github.com/late4marshmellow/MMM-MultiGauge/releases/tag/v1.0.1
[1.0.0]: https://github.com/late4marshmellow/MMM-MultiGauge/releases/tag/v1.0.0
