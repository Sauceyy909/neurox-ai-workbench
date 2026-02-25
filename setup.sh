#!/bin/bash

# Neurox Workbench - Automated Installation Script
# This script installs all dependencies and prepares the environment.

echo "------------------------------------------------"
echo "   Neurox Workbench Installation Started"
echo "------------------------------------------------"

# 1. Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# 2. Check for npm
if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully."
else
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo "Step 2: Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo ".env file created from .env.example. Please update your GEMINI_API_KEY in .env."
    else
        touch .env
        echo ".env file created. Please add your GEMINI_API_KEY."
    fi
else
    echo ".env file already exists, skipping."
fi

echo "Step 3: Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build completed successfully."
else
    echo "Error: Build failed."
    exit 1
fi

echo "------------------------------------------------"
echo "   Installation Complete!"
echo "------------------------------------------------"
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To preview the production build, run:"
echo "  npm run preview"
echo "------------------------------------------------"
