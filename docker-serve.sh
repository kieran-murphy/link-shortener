#!/bin/bash

sudo docker run -it --rm \
  -p 8000:8000 \
  -v "$PWD":/app \
  -w /app \
  denoland/deno:2.0.0 \
  deno serve -A --watch src/main.ts