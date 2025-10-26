#!/bin/bash
# Helper script to run the Homey discovery tool with setup check

TOOL="tools/discover-homey-devices.js"
SAMPLE="tools/discover-homey-devices.js.sample"

if [ ! -f "$TOOL" ]; then
  echo ""
  echo "⚠️  Discovery tool not configured yet!"
  echo ""
  echo "First-time setup:"
  echo "  1. Copy the template:  cp $SAMPLE $TOOL"
  echo "  2. Edit $TOOL and replace HOMEY_IP and API_KEY with your values"
  echo "  3. Run again:          npm run discover"
  echo ""
  exit 1
fi

node "$TOOL" "$@"
