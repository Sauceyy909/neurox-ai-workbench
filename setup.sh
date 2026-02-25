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
echo "1) Windows (creates .exe installer with shortcuts)"
echo "2) Linux (creates .AppImage & .deb with shortcuts)"
echo "3) Create Desktop Shortcut for current Dev version"
echo "4) Development Mode (starts web server only)"
echo "5) Exit"
echo "------------------------------------------------"
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Building for Windows..."
        if ! npm run electron:build -- --win; then
            echo "Error: Windows build failed. Please check if 'electron:build' script exists in package.json"
            exit 1
        fi
        echo "Success! Check the 'release' folder for the .exe installer."
        ;;
    2)
        echo "Building for Linux..."
        if ! npm run electron:build -- --linux; then
            echo "Error: Linux build failed. Please check if 'electron:build' script exists in package.json"
            exit 1
        fi
        
        DEB_FILE=$(ls release/*.deb 2>/dev/null | head -n 1)
        if [ -f "$DEB_FILE" ]; then
            echo "Found package: $DEB_FILE"
            echo "Attempting to install .deb package..."
            if command -v sudo &> /dev/null; then
                sudo apt install -y "./$DEB_FILE"
                if [ $? -eq 0 ]; then
                    echo "Installation successful!"
                else
                    echo "Error: Installation failed. You may need to install it manually using: sudo apt install ./$DEB_FILE"
                fi
            else
                echo "Sudo not found. Please install manually: dpkg -i $DEB_FILE"
            fi
        else
            echo "Error: .deb file not found in release folder."
        fi
        ;;
    3)
        echo "Creating Desktop Shortcut..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            DESKTOP_FILE="$HOME/Desktop/neurox-workbench.desktop"
            echo "[Desktop Entry]" > "$DESKTOP_FILE"
            echo "Name=Neurox AI Workbench (Dev)" >> "$DESKTOP_FILE"
            echo "Exec=cd $(pwd) && npm run electron:dev" >> "$DESKTOP_FILE"
            echo "Icon=$(pwd)/dist/favicon.ico" >> "$DESKTOP_FILE"
            echo "Type=Application" >> "$DESKTOP_FILE"
            echo "Terminal=true" >> "$DESKTOP_FILE"
            chmod +x "$DESKTOP_FILE"
            echo "Linux shortcut created on Desktop."
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            # Create Windows shortcut using PowerShell
            powershell.exe -ExecutionPolicy Bypass -Command "\$s=(New-Object -COM WScript.Shell).CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Neurox Workbench Dev.lnk'));\$s.TargetPath='npm.cmd';\$s.Arguments='run electron:dev';\$s.WorkingDirectory='$(pwd)';\$s.Save()"
            echo "Windows shortcut created on Desktop."
        else
            echo "Shortcut creation not supported for this OS automatically."
        fi
        ;;
    4)
        echo "Starting Development Server..."
        npm run dev
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

