#!/bin/bash
# Helper script to run the SFU Scheduler backend

cd "$(dirname "$0")"

# Activate virtual environment and run the server
./venv/bin/python main.py
