#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DistributionManager {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.version = this.getVersion();
    this.releaseDir = path.join(__dirname, '..', 'release');
  }

  getVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return packageJson.version;
  }

  async distribute() {
    console.log(`Distributing ONI v${this.version} for ${this.platform}-${this.arch}`);
    
    try {
      // Publish to npm
      await this.publishToNPM();
      
      // Create GitHub release
      await this.createGitHubRelease();
      
      // Create Docker images
      await this.createDockerImages();
      
      // Create installers
      await this.createInstallers();
      
      console.log('Distribution completed successfully!');
    } catch (error) {
      console.error('Distribution failed:', error.message);
      process.exit(1);
    }
  }

  async publishToNPM() {
    console.log('Publishing to npm...');
    
    try {
      // Publish CLI package
      execSync('cd release/cli && npm publish', { stdio: 'inherit' });
      console.log('CLI package published to npm');
      
      // Publish GUI package
      execSync('cd release/gui && npm publish', { stdio: 'inherit' });
      console.log('GUI package published to npm');
      
      // Publish combined package
      execSync('cd release/combined && npm publish', { stdio: 'inherit' });
      console.log('Combined package published to npm');
      
    } catch (error) {
      throw new Error(`npm publish failed: ${error.message}`);
    }
  }

  async createGitHubRelease() {
    console.log('Creating GitHub release...');
    
    try {
      const releaseNotes = this.generateReleaseNotes();
      const releaseFile = path.join(this.releaseDir, 'release-notes.md');
      fs.writeFileSync(releaseFile, releaseNotes);
      
      // Create release using GitHub CLI
      const releaseCommand = `gh release create v${this.version} --title "ONI v${this.version}" --notes-file "${releaseFile}"`;
      execSync(releaseCommand, { stdio: 'inherit' });
      
      // Upload assets
      const assets = fs.readdirSync(this.releaseDir).filter(file => file.endsWith('.tar.gz'));
      for (const asset of assets) {
        const assetPath = path.join(this.releaseDir, asset);
        execSync(`gh release upload v${this.version} "${assetPath}"`, { stdio: 'inherit' });
      }
      
      console.log('GitHub release created');
      
    } catch (error) {
      throw new Error(`GitHub release failed: ${error.message}`);
    }
  }

  async createDockerImages() {
    console.log('Creating Docker images...');
    
    try {
      // Build CLI image
      execSync('docker build -f Dockerfile.cli -t oni/cli:latest .', { stdio: 'inherit' });
      execSync(`docker tag oni/cli:latest oni/cli:${this.version}`, { stdio: 'inherit' });
      
      // Build GUI image
      execSync('docker build -f Dockerfile.gui -t oni/gui:latest .', { stdio: 'inherit' });
      execSync(`docker tag oni/gui:latest oni/gui:${this.version}`, { stdio: 'inherit' });
      
      // Push images
      execSync('docker push oni/cli:latest', { stdio: 'inherit' });
      execSync(`docker push oni/cli:${this.version}`, { stdio: 'inherit' });
      execSync('docker push oni/gui:latest', { stdio: 'inherit' });
      execSync(`docker push oni/gui:${this.version}`, { stdio: 'inherit' });
      
      console.log('Docker images created and pushed');
      
    } catch (error) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  async createInstallers() {
    console.log('Creating installers...');
    
    try {
      // Create Windows installer
      if (this.platform === 'win32') {
        await this.createWindowsInstaller();
      }
      
      // Create macOS installer
      if (this.platform === 'darwin') {
        await this.createMacOSInstaller();
      }
      
      // Create Linux installer
      if (this.platform === 'linux') {
        await this.createLinuxInstaller();
      }
      
    } catch (error) {
      throw new Error(`Installer creation failed: ${error.message}`);
    }
  }

  async createWindowsInstaller() {
    console.log('Creating Windows installer...');
    
    // Create NSIS installer script
    const nsisScript = this.generateNSISScript();
    const nsisFile = path.join(this.releaseDir, 'installer.nsi');
    fs.writeFileSync(nsisFile, nsisScript);
    
    // Build installer
    execSync(`makensis "${nsisFile}"`, { stdio: 'inherit' });
    
    console.log('Windows installer created');
  }

  async createMacOSInstaller() {
    console.log('Creating macOS installer...');
    
    // Create DMG
    const dmgName = `oni-${this.version}-${this.arch}.dmg`;
    const dmgPath = path.join(this.releaseDir, dmgName);
    
    // Create app bundle
    const appDir = path.join(this.releaseDir, 'ONI.app');
    fs.mkdirSync(appDir, { recursive: true });
    
    // Copy files to app bundle
    this.copyDirectory(path.join(this.releaseDir, 'combined'), appDir);
    
    // Create DMG
    execSync(`hdiutil create -volname "ONI ${this.version}" -srcfolder "${appDir}" -ov -format UDZO "${dmgPath}"`, { stdio: 'inherit' });
    
    console.log('macOS installer created');
  }

  async createLinuxInstaller() {
    console.log('Creating Linux installer...');
    
    // Create DEB package
    await this.createDEBPackage();
    
    // Create RPM package
    await this.createRPMPackage();
    
    // Create AppImage
    await this.createAppImage();
  }

  async createDEBPackage() {
    console.log('Creating DEB package...');
    
    const debDir = path.join(this.releaseDir, 'oni-deb');
    fs.mkdirSync(debDir, { recursive: true });
    
    // Create control file
    const control = this.generateDEBControl();
    fs.writeFileSync(path.join(debDir, 'control'), control);
    
    // Create postinst script
    const postinst = this.generateDEBPostinst();
    fs.writeFileSync(path.join(debDir, 'postinst'), postinst);
    
    // Create prerm script
    const prerm = this.generateDEBPrerm();
    fs.writeFileSync(path.join(debDir, 'prerm'), prerm);
    
    // Copy files
    const usrDir = path.join(debDir, 'usr', 'local', 'bin');
    fs.mkdirSync(usrDir, { recursive: true });
    fs.copyFileSync(path.join(this.releaseDir, 'combined', 'index.js'), path.join(usrDir, 'oni'));
    
    // Build package
    execSync(`cd ${debDir} && dpkg-deb --build . ../oni-${this.version}-${this.arch}.deb`, { stdio: 'inherit' });
    
    console.log('DEB package created');
  }

  async createRPMPackage() {
    console.log('Creating RPM package...');
    
    const rpmDir = path.join(this.releaseDir, 'oni-rpm');
    fs.mkdirSync(rpmDir, { recursive: true });
    
    // Create spec file
    const spec = this.generateRPMSpec();
    fs.writeFileSync(path.join(rpmDir, 'oni.spec'), spec);
    
    // Copy files
    const usrDir = path.join(rpmDir, 'usr', 'local', 'bin');
    fs.mkdirSync(usrDir, { recursive: true });
    fs.copyFileSync(path.join(this.releaseDir, 'combined', 'index.js'), path.join(usrDir, 'oni'));
    
    // Build package
    execSync(`cd ${rpmDir} && rpmbuild -bb oni.spec`, { stdio: 'inherit' });
    
    console.log('RPM package created');
  }

  async createAppImage() {
    console.log('Creating AppImage...');
    
    const appImageDir = path.join(this.releaseDir, 'oni-appimage');
    fs.mkdirSync(appImageDir, { recursive: true });
    
    // Create AppDir structure
    const appDir = path.join(appImageDir, 'ONI.AppDir');
    fs.mkdirSync(appDir, { recursive: true });
    
    // Copy files
    this.copyDirectory(path.join(this.releaseDir, 'combined'), appDir);
    
    // Create desktop file
    const desktop = this.generateDesktopFile();
    fs.writeFileSync(path.join(appDir, 'ONI.desktop'), desktop);
    
    // Create AppRun script
    const appRun = this.generateAppRun();
    fs.writeFileSync(path.join(appDir, 'AppRun'), appRun);
    
    // Build AppImage
    execSync(`cd ${appImageDir} && appimagetool ONI.AppDir oni-${this.version}-${this.arch}.AppImage`, { stdio: 'inherit' });
    
    console.log('AppImage created');
  }

  generateReleaseNotes() {
    return `# ONI v${this.version}

## What's New
- Enhanced performance and reliability
- Improved error handling and logging
- Updated documentation
- Bug fixes and stability improvements

## Installation
\`\`\`bash
npm install -g oni
\`\`\`

## Downloads
- CLI Package: \`oni-cli-${this.version}-${this.platform}-${this.arch}.tar.gz\`
- GUI Package: \`oni-gui-${this.version}-${this.platform}-${this.arch}.tar.gz\`
- Combined Package: \`oni-${this.version}-${this.platform}-${this.arch}.tar.gz\`

## Docker
\`\`\`bash
docker pull oni/cli:${this.version}
docker pull oni/gui:${this.version}
\`\`\`

## Documentation
- [User Guide](docs/user-guide.md)
- [Installation Guide](docs/installation.md)
- [Developer Guide](docs/developer-guide.md)

## Support
- [GitHub Issues](https://github.com/your-repo/oni/issues)
- [GitHub Discussions](https://github.com/your-repo/oni/discussions)
`;
  }

  generateNSISScript() {
    return `!define PRODUCT_NAME "OneNote to Notion Importer"
!define PRODUCT_VERSION "${this.version}"
!define PRODUCT_PUBLISHER "ONI Team"
!define PRODUCT_WEB_SITE "https://github.com/your-repo/oni"
!define PRODUCT_DIR_REGKEY "Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\oni.exe"
!define PRODUCT_UNINST_KEY "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma

!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "oni-${this.version}-${this.arch}-installer.exe"
InstallDir "$PROGRAMFILES\\ONI"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  File "combined\\*"
  CreateDirectory "$SMPROGRAMS\\ONI"
  CreateShortCut "$SMPROGRAMS\\ONI\\ONI.lnk" "$INSTDIR\\index.js"
  CreateShortCut "$DESKTOP\\ONI.lnk" "$INSTDIR\\index.js"
SectionEnd

Section -AdditionalIcons
  WriteIniStr "$INSTDIR\\${PRODUCT_NAME}.url" "InternetShortcut" "URL" "${PRODUCT_WEB_SITE}"
  CreateShortCut "$SMPROGRAMS\\ONI\\Website.lnk" "$INSTDIR\\${PRODUCT_NAME}.url"
  CreateShortCut "$SMPROGRAMS\\ONI\\Uninstall.lnk" "$INSTDIR\\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\\index.js"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\\index.js"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
  Delete "$INSTDIR\\${PRODUCT_NAME}.url"
  Delete "$INSTDIR\\uninst.exe"
  Delete "$INSTDIR\\*"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\\ONI\\Uninstall.lnk"
  Delete "$SMPROGRAMS\\ONI\\Website.lnk"
  Delete "$DESKTOP\\ONI.lnk"
  Delete "$SMPROGRAMS\\ONI\\ONI.lnk"
  RMDir "$SMPROGRAMS\\ONI"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd
`;
  }

  generateDEBControl() {
    return `Package: oni
Version: ${this.version}
Section: utils
Priority: optional
Architecture: ${this.arch}
Depends: nodejs (>= 16.0.0)
Maintainer: ONI Team <team@oni.dev>
Description: OneNote to Notion Importer
 A powerful CLI tool for migrating OneNote content to Notion
 while preserving notebook structure and giving you complete
 control over what gets imported.
`;
  }

  generateDEBPostinst() {
    return `#!/bin/bash
set -e

# Create symlink
ln -sf /usr/local/bin/oni /usr/bin/oni

# Set permissions
chmod +x /usr/local/bin/oni

echo "ONI v${this.version} installed successfully!"
echo "Run 'oni --help' to get started."
`;
  }

  generateDEBPrerm() {
    return `#!/bin/bash
set -e

# Remove symlink
rm -f /usr/bin/oni

echo "ONI v${this.version} uninstalled successfully!"
`;
  }

  generateRPMSpec() {
    return `Name: oni
Version: ${this.version}
Release: 1%{?dist}
Summary: OneNote to Notion Importer
License: MIT
URL: https://github.com/your-repo/oni
Source0: oni-${this.version}.tar.gz
BuildArch: ${this.arch}
Requires: nodejs >= 16.0.0

%description
A powerful CLI tool for migrating OneNote content to Notion
while preserving notebook structure and giving you complete
control over what gets imported.

%prep
%setup -q

%build
# No build step needed

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/usr/local/bin
install -m 755 index.js $RPM_BUILD_ROOT/usr/local/bin/oni
ln -sf /usr/local/bin/oni $RPM_BUILD_ROOT/usr/bin/oni

%files
/usr/local/bin/oni
/usr/bin/oni

%changelog
* $(date +'%a %b %d %Y') ONI Team <team@oni.dev> - ${this.version}-1
- Initial package
`;
  }

  generateDesktopFile() {
    return `[Desktop Entry]
Name=ONI
Comment=OneNote to Notion Importer
Exec=ONI.AppRun
Icon=ONI
Type=Application
Categories=Utility;
StartupNotify=true
`;
  }

  generateAppRun() {
    return `#!/bin/bash
HERE="$(dirname "$(readlink -f "${0}")")"
exec "${HERE}/index.js" "$@"
`;
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

// Run distribution if called directly
if (require.main === module) {
  const distributionManager = new DistributionManager();
  distributionManager.distribute().catch(console.error);
}

module.exports = DistributionManager;
