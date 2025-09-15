# Installation Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 16.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Internet**: Required for Notion API access

### Recommended Requirements
- **Operating System**: Windows 11, macOS 12+, or Ubuntu 20.04+
- **Node.js**: Version 18.0.0 or higher
- **RAM**: 8GB or more
- **Storage**: 2GB free space
- **Internet**: Stable broadband connection

## Installation Methods

### Method 1: npm (Recommended)

#### Global Installation
```bash
# Install globally
npm install -g oni

# Verify installation
oni --version
```

#### Local Installation
```bash
# Install locally in your project
npm install oni

# Run using npx
npx oni --version
```

### Method 2: GitHub Release

1. Go to the [Releases page](https://github.com/your-repo/oni/releases)
2. Download the appropriate binary for your platform
3. Extract the archive
4. Add the binary to your PATH

#### Windows
```powershell
# Download and extract
# Add to PATH: C:\Program Files\oni\
# Or run directly
.\oni.exe --version
```

#### macOS
```bash
# Download and extract
# Move to /usr/local/bin/
sudo mv oni /usr/local/bin/
chmod +x /usr/local/bin/oni

# Verify installation
oni --version
```

#### Linux
```bash
# Download and extract
# Move to /usr/local/bin/
sudo mv oni /usr/local/bin/
chmod +x /usr/local/bin/oni

# Verify installation
oni --version
```

### Method 3: Docker

#### Using Docker Hub
```bash
# Pull the image
docker pull oni/oni:latest

# Run the container
docker run -it --rm -v $(pwd):/workspace oni/oni:latest
```

#### Using Docker Compose
```yaml
version: '3.8'
services:
  oni:
    image: oni/oni:latest
    volumes:
      - ./notebooks:/workspace/notebooks
      - ./output:/workspace/output
    environment:
      - NOTION_API_KEY=your-api-key
      - NOTION_DATABASE_ID=your-database-id
```

### Method 4: Build from Source

#### Prerequisites
- Git
- Node.js 16.0.0+
- npm or yarn

#### Build Steps
```bash
# Clone the repository
git clone https://github.com/your-repo/oni.git
cd oni

# Install dependencies
npm install

# Build the application
npm run build

# Install globally
npm link

# Verify installation
oni --version
```

## Configuration

### Initial Setup

#### 1. Set up Notion Integration
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Enter a name (e.g., "ONI Importer")
4. Select your workspace
5. Copy the "Internal Integration Token"

#### 2. Create a Notion Database
1. Go to your Notion workspace
2. Create a new page
3. Add a database with the following properties:
   - **Title** (Title)
   - **Type** (Select: Page, Section, Notebook)
   - **Created Date** (Created time)
   - **Modified Date** (Last edited time)
   - **Source** (Text)

#### 3. Configure ONI
```bash
# Run the setup wizard
oni config --setup

# Or manually configure
oni config --set notion.apiKey "your-api-key"
oni config --set notion.databaseId "your-database-id"
```

### Configuration File

The configuration is stored in:
- **Windows**: `%APPDATA%\.oni\config.json`
- **macOS/Linux**: `~/.oni/config.json`

#### Example Configuration
```json
{
  "notion": {
    "apiKey": "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "databaseId": "26fd7f97404280468a0fd8078cb6ede9",
    "baseUrl": "https://api.notion.com/v1"
  },
  "onenote": {
    "supportedFormats": [".one", ".onepkg"],
    "maxFileSize": 104857600,
    "tempDir": "./temp"
  },
  "output": {
    "format": "markdown",
    "includeMetadata": true,
    "preserveHierarchy": true
  },
  "logging": {
    "level": "info",
    "file": "./logs/oni.log",
    "maxSize": "10MB",
    "maxFiles": 5
  }
}
```

### Environment Variables (Recommended)

For security, it's recommended to use environment variables instead of storing sensitive data in configuration files:

#### Option 1: .env File (Recommended)
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

The `.env` file should contain:
```bash
# Notion Configuration
NOTION_API_KEY=your-notion-integration-token-here
NOTION_WORKSPACE_ID=your-workspace-id-here
NOTION_DATABASE_ID=your-database-id-here

# Optional overrides
LOG_LEVEL=info
OUTPUT_DIR=./exports
```

#### Option 2: System Environment Variables
```bash
# Set environment variables in your shell
export NOTION_API_KEY="your-api-key"
export NOTION_WORKSPACE_ID="your-workspace-id"
export NOTION_DATABASE_ID="your-database-id"
```

**Note:** Environment variables take precedence over configuration file values, providing a secure way to manage sensitive data.

## Verification

### Test Installation
```bash
# Check version
oni --version

# Check configuration
oni config --show

# Test with a sample file
oni preview sample.one
```

### Test Notion Connection
```bash
# Test API connection
oni test --notion

# Test with a simple import
oni import sample.one --dry-run
```

### Test OneNote Processing
```bash
# Test file processing
oni validate sample.one

# Test with different formats
oni preview sample.onepkg
```

## Troubleshooting

### Common Installation Issues

#### "Command not found: oni"
**Solution:** Ensure ONI is installed and in your PATH.

```bash
# Check if installed
npm list -g oni

# Reinstall if needed
npm install -g oni

# Check PATH
echo $PATH
```

#### "Permission denied" (macOS/Linux)
**Solution:** Fix file permissions.

```bash
# Fix permissions
sudo chmod +x /usr/local/bin/oni

# Or install with sudo
sudo npm install -g oni
```

#### "Module not found" errors
**Solution:** Clear npm cache and reinstall.

```bash
# Clear cache
npm cache clean --force

# Reinstall
npm uninstall -g oni
npm install -g oni
```

### Configuration Issues

#### "Notion API Key not found"
**Solution:** Configure your API key.

```bash
# Set API key
oni config --set notion.apiKey "your-api-key"

# Or use environment variable
export NOTION_API_KEY="your-api-key"
```

#### "Database not found"
**Solution:** Check your database ID and permissions.

```bash
# Check configuration
oni config --show

# Update database ID
oni config --set notion.databaseId "your-database-id"

# Ensure integration has access to database
```

#### "Invalid configuration"
**Solution:** Reset configuration and reconfigure.

```bash
# Reset configuration
oni config --reset

# Run setup wizard
oni config --setup
```

### Performance Issues

#### "Out of memory" errors
**Solution:** Process smaller files or increase memory.

```bash
# Process files individually
oni import notebook.one --select

# Or increase Node.js memory
node --max-old-space-size=4096 $(which oni) import notebook.one
```

#### "Timeout" errors
**Solution:** Check network connection and retry.

```bash
# Retry with verbose logging
oni import notebook.one --verbose

# Check network connectivity
ping api.notion.com
```

### File Format Issues

#### "Unsupported file format"
**Solution:** Ensure you're using supported formats.

```bash
# Check supported formats
oni config --show

# Convert file if needed
# (Use OneNote to export as .one or .onepkg)
```

#### "File corrupted" errors
**Solution:** Validate and repair the file.

```bash
# Validate file
oni validate notebook.one

# Try to fix issues
oni validate notebook.one --fix
```

### Getting Help

#### Check Logs
```bash
# View recent logs
tail -f logs/oni.log

# Check error logs
grep ERROR logs/oni.log
```

#### Debug Mode
```bash
# Enable debug logging
oni import notebook.one --debug --verbose

# Check configuration
oni config --show --debug
```

#### Support Resources
- **Documentation**: [GitHub Wiki](https://github.com/your-repo/oni/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/oni/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/oni/discussions)

## Next Steps

After successful installation and configuration:

1. **Read the User Guide**: [User Guide](user-guide.md)
2. **Try a Test Import**: Import a sample OneNote file
3. **Explore Features**: Use the `--help` option to see all available commands
4. **Join the Community**: Participate in discussions and get help

## Uninstallation

### npm Installation
```bash
# Uninstall globally
npm uninstall -g oni

# Remove configuration
rm -rf ~/.oni
```

### Manual Installation
```bash
# Remove binary
sudo rm /usr/local/bin/oni

# Remove configuration
rm -rf ~/.oni
```

### Docker Installation
```bash
# Remove image
docker rmi oni/oni:latest

# Remove container
docker rm oni-container
```
