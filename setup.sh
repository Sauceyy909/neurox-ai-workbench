#!/bin/bash

# Neurox Workbench - Automated Installation & Build Script
# This script handles dependencies and builds the native desktop application.

echo "------------------------------------------------"
echo "   Neurox Workbench AI - Desktop Installer"
echo "------------------------------------------------"

# 1. Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo "Step 2: Environment Setup..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created. Please ensure your GEMINI_API_KEY is set."
fi

echo "------------------------------------------------"
echo "Select your target platform for the Desktop App:"
echo "1) Windows (creates .exe installer)"
echo "2) Linux (creates .AppImage)"
echo "3) Development Mode (starts web server only)"
echo "4) Exit"
echo "------------------------------------------------"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Building for Windows..."
        npm run electron:build -- --win
        echo "Success! Check the 'release' folder for the .exe installer."
        ;;
    2)
        echo "Building for Linux..."
        npm run electron:build -- --linux
        echo "Success! Check the 'release' folder for the .AppImage file."
        ;;
    3)
        echo "Starting Development Server..."
        npm run dev
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

