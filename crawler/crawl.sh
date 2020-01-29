#!/bin/bash

cd crawler

# Exit whenever a command has an error
set -e

# Required env var for Makefile
export PYTHON3="/usr/local/bin/python3.8"
export SCRAPY="/usr/local/bin/scrapy"
export PYTHONDONTWRITEBYTECODE=1

# Generate data file
cd script
make
cd ..

# Copy data file to html folder
cp script/final.json ../client/data/data.json

# Cleanup script folder
cd script
make clean
cd ..
