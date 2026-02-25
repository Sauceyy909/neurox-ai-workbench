# Neurox Workbench

An AI-powered PLC/VFD ladder logic editor and HMI builder with Arduino WiFi integration.

## Quick Installation

We have provided an automated setup script to get you started quickly.

### Prerequisites

- **Node.js**: Version 18 or higher.
- **npm**: Usually comes with Node.js.

### Automated Setup

1. **Clone the repository** (or download the source code).
2. **Make the setup script executable**:
   ```bash
   chmod +x setup.sh
   ```
3. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

The script will:
- Install all npm dependencies.
- Create a `.env` file for your configuration.
- Build the production assets.

### Manual Installation

If you prefer to install manually:

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start development server
npm run dev
```

## Configuration

Before running the app, ensure you have set up your environment variables in the `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

## Features

- **AI Assistant**: Generate PLC logic and HMI layouts using natural language prompts.
- **Ladder Logic Editor**: Professional-grade ladder logic programming.
- **HMI Builder**: Drag-and-drop interface for industrial dashboards.
- **Device Manager**: Connect to Arduino, VFDs, and PLCs via WiFi, Ethernet, or USB.
- **Arduino Bridge**: Built-in firmware generator for remote I/O.

## License

Apache-2.0
