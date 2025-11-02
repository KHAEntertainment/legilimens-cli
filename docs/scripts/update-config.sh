#!/bin/bash
echo "Updating config.json with Granite model path..."
cp "/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/config-updated.json" \
   ~/.legilimens/config.json
echo "Config updated to use Granite 4.0 Micro"
cat ~/.legilimens/config.json
