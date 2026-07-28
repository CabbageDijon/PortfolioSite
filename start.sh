#!/bin/sh
set -e

nginx

node /app/server.js
