#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BuildManager {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.version = this.getVersion();
    this.buildDir = path.join(__dirname, '..', 'dist');
    this.releaseDir = path.join(__dirname, '..', 'release');
  }

  getVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return packageJson.version;
  }

  async build() {
    console.log(`Building ONI v${this.version} for ${this.platform}-${this.arch}`);
    
    try {
      // Clean previous builds
      this.clean();
      
      // Build CLI
      await this.buildCLI();
      
      // Build GUI
      await this.buildGUI();
      
      // Create distribution packages
      await this.createPackages();
      
      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  }

  clean() {
    console.log('Cleaning previous builds...');
    
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    
    if (fs.existsSync(this.releaseDir)) {
      fs.rmSync(this.releaseDir, { recursive: true, force: true });
    }
    
    // Create directories
    fs.mkdirSync(this.buildDir, { recursive: true });
    fs.mkdirSync(this.releaseDir, { recursive: true });
  }

  async buildCLI() {
    console.log('Building CLI...');
    
    try {
      execSync('npm run build:cli', { stdio: 'inherit' });
      console.log('CLI build completed');
    } catch (error) {
      throw new Error(`CLI build failed: ${error.message}`);
    }
  }

  async buildGUI() {
    console.log('Building GUI...');
    
    try {
      execSync('npm run build:gui', { stdio: 'inherit' });
      console.log('GUI build completed');
    } catch (error) {
      throw new Error(`GUI build failed: ${error.message}`);
    }
  }

  async createPackages() {
    console.log('Creating distribution packages...');
    
    // Create CLI package
    await this.createCLIPackage();
    
    // Create GUI package
    await this.createGUIPackage();
    
    // Create combined package
    await this.createCombinedPackage();
  }

  async createCLIPackage() {
    console.log('Creating CLI package...');
    
    const cliDir = path.join(this.releaseDir, 'cli');
    fs.mkdirSync(cliDir, { recursive: true });
    
    // Copy CLI files
    this.copyDirectory(path.join(this.buildDir, 'commands'), path.join(cliDir, 'commands'));
    this.copyDirectory(path.join(this.buildDir, 'services'), path.join(cliDir, 'services'));
    this.copyDirectory(path.join(this.buildDir, 'types'), path.join(cliDir, 'types'));
    this.copyDirectory(path.join(this.buildDir, 'utils'), path.join(cliDir, 'utils'));
    
    // Copy main files
    fs.copyFileSync(path.join(this.buildDir, 'index.js'), path.join(cliDir, 'index.js'));
    fs.copyFileSync(path.join(this.buildDir, 'index.d.ts'), path.join(cliDir, 'index.d.ts'));
    
    // Copy package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const cliPackageJson = {
      ...packageJson,
      name: 'oni-cli',
      description: 'OneNote to Notion Importer - CLI Tool',
      main: 'index.js',
      bin: {
        'oni': './index.js'
      },
      files: [
        'index.js',
        'index.d.ts',
        'commands/**/*',
        'services/**/*',
        'types/**/*',
        'utils/**/*'
      ]
    };
    
    fs.writeFileSync(
      path.join(cliDir, 'package.json'),
      JSON.stringify(cliPackageJson, null, 2)
    );
    
    // Copy README
    fs.copyFileSync(
      path.join(__dirname, '..', 'README.md'),
      path.join(cliDir, 'README.md')
    );
    
    // Create tarball
    const tarballName = `oni-cli-${this.version}-${this.platform}-${this.arch}.tar.gz`;
    execSync(`cd ${cliDir} && tar -czf ../${tarballName} .`, { stdio: 'inherit' });
    
    console.log(`CLI package created: ${tarballName}`);
  }

  async createGUIPackage() {
    console.log('Creating GUI package...');
    
    const guiDir = path.join(this.releaseDir, 'gui');
    fs.mkdirSync(guiDir, { recursive: true });
    
    // Copy GUI files
    this.copyDirectory(path.join(this.buildDir, 'gui'), path.join(guiDir, 'gui'));
    
    // Copy package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const guiPackageJson = {
      ...packageJson,
      name: 'oni-gui',
      description: 'OneNote to Notion Importer - GUI Application',
      main: 'gui/main.js',
      scripts: {
        start: 'electron gui/main.js'
      },
      files: [
        'gui/**/*'
      ]
    };
    
    fs.writeFileSync(
      path.join(guiDir, 'package.json'),
      JSON.stringify(guiPackageJson, null, 2)
    );
    
    // Copy README
    fs.copyFileSync(
      path.join(__dirname, '..', 'README.md'),
      path.join(guiDir, 'README.md')
    );
    
    // Create tarball
    const tarballName = `oni-gui-${this.version}-${this.platform}-${this.arch}.tar.gz`;
    execSync(`cd ${guiDir} && tar -czf ../${tarballName} .`, { stdio: 'inherit' });
    
    console.log(`GUI package created: ${tarballName}`);
  }

  async createCombinedPackage() {
    console.log('Creating combined package...');
    
    const combinedDir = path.join(this.releaseDir, 'combined');
    fs.mkdirSync(combinedDir, { recursive: true });
    
    // Copy all files
    this.copyDirectory(this.buildDir, combinedDir);
    
    // Copy package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const combinedPackageJson = {
      ...packageJson,
      name: 'oni',
      description: 'OneNote to Notion Importer - Complete Package',
      scripts: {
        ...packageJson.scripts,
        'start:cli': 'node index.js',
        'start:gui': 'electron gui/main.js'
      }
    };
    
    fs.writeFileSync(
      path.join(combinedDir, 'package.json'),
      JSON.stringify(combinedPackageJson, null, 2)
    );
    
    // Copy documentation
    fs.copyFileSync(
      path.join(__dirname, '..', 'README.md'),
      path.join(combinedDir, 'README.md')
    );
    
    // Create tarball
    const tarballName = `oni-${this.version}-${this.platform}-${this.arch}.tar.gz`;
    execSync(`cd ${combinedDir} && tar -czf ../${tarballName} .`, { stdio: 'inherit' });
    
    console.log(`Combined package created: ${tarballName}`);
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Run build if called directly
if (require.main === module) {
  const buildManager = new BuildManager();
  buildManager.build().catch(console.error);
}

module.exports = BuildManager;
