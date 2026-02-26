#!/bin/bash

# Neurox Workbench - Automated Installation & Build Script
# Move to the directory where the script is located
cd "$(dirname "$0")"

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
echo "2) Linux (creates .AppImage & .deb + Auto Install)"
echo "3) Create Desktop Shortcut for current Dev version"
echo "4) Development Mode (starts web server only)"
echo "5) Exit"
echo "------------------------------------------------"
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Building for Windows..."
        if ! npm run electron:build -- --win; then
            echo "Error: Windows build failed."
            exit 1
        fi
        echo "Success! Check the 'release' folder for the .exe installer."
        ;;
    2)
        echo "Building for Linux..."
        # Check for the bad desktop property in package.json
        if grep -q "\"desktop\":" package.json; then
            echo "CRITICAL ERROR: Your package.json contains an invalid 'desktop' property inside 'linux'."
            echo "Please overwrite your package.json with the one provided in the chat."
            exit 1
        fi

        # Run the build steps manually to verify each one
        echo "Running frontend build..."
        npm run build || exit 1
        
        echo "Running electron main process build..."
        npm run build:electron || exit 1
        
        # VERIFICATION: Ensure the entry file exists before packaging
        if [ ! -f "dist/main.js" ]; then
            echo "ERROR: Compiled entry file 'dist/main.js' was not found!"
            echo "Check for TypeScript compilation errors above."
            exit 1
        fi

        echo "Packaging application..."
        if ! npx electron-builder --linux; then
            echo "Error: Linux build failed."
            exit 1
        fi
        
        echo "Build complete. Checking release folder..."
        ls -R release/
        
        DEB_FILE=$(find release -name "*.deb" | head -n 1)
        if [ -n "$DEB_FILE" ]; then
            echo "Found package: $DEB_FILE"
            echo "Attempting to install .deb package..."
            if command -v sudo &> /dev/null; then
                sudo apt install -y "$(pwd)/$DEB_FILE"
                if [ $? -eq 0 ]; then
                    echo "Installation successful! You can now find 'Neurox AI Workbench' in your applications menu."
                else
                    echo "Error: Installation failed. Try running: sudo apt install \"$(pwd)/$DEB_FILE\""
                fi
            else
                echo "Sudo not found. Please install manually: sudo dpkg -i \"$(pwd)/$DEB_FILE\""
            fi
        else
            echo "Error: .deb file not found in release folder. Please check the build output above for errors."
        fi
        ;;
    3)
        echo "Creating Desktop Shortcut..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            DESKTOP_FILE="$HOME/Desktop/neurox-workbench.desktop"
            echo "[Desktop Entry]" > "$DESKTOP_FILE"
            echo "Name=Neurox AI Workbench (Dev)" >> "$DESKTOP_FILE"
            echo "Path=$(pwd)" >> "$DESKTOP_FILE"
            echo "Exec=npm run electron:dev" >> "$DESKTOP_FILE"
            echo "Icon=$(pwd)/dist/favicon.ico" >> "$DESKTOP_FILE"
            echo "Type=Application" >> "$DESKTOP_FILE"
            echo "Terminal=true" >> "$DESKTOP_FILE"
            chmod +x "$DESKTOP_FILE"
            echo "Linux shortcut created on Desktop: $DESKTOP_FILE"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            # Use double quotes for the working directory in PowerShell
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
