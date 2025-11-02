#!/bin/bash
echo "Cleaning up old phi-4 models..."
rm -f ~/.legilimens/models/phi-4-q4.gguf
rm -f ~/.legilimens/models/phi-4.Q4_K_M.gguf
echo "Old phi-4 models removed"
ls -lah ~/.legilimens/models/
