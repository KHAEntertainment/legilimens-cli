#!/bin/bash
echo "Deploying Granite 4.0 Micro model..."
# Move Granite model to production location
mv "/Users/bbrenner/Documents/Scripting Projects/doc-gateway-cli/.temp-models/granite-4.0-micro.Q4_K_M.gguf" \
   ~/.legilimens/models/granite-4.0-micro.Q4_K_M.gguf

echo "Granite model deployed to: ~/.legilimens/models/granite-4.0-micro.Q4_K_M.gguf"
ls -lah ~/.legilimens/models/
