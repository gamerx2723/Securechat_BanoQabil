export interface FileScanResult {
  isDangerous: boolean;
  isExecutable?: boolean;
  threatLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
  fileTypeLabel: string;
  riskReason?: string;
  recommendation?: string;
}

export class FileSecurityScanner {
  private static readonly CRITICAL_EXTENSIONS = [
    'apk', 'exe', 'bat', 'cmd', 'scr', 'vbs', 'vbe', 'js', 'jse',
    'wsf', 'wsh', 'ps1', 'ps2', 'msc', 'jar', 'pif', 'com', 'sh'
  ];

  private static readonly MACRO_EXTENSIONS = [
    'docm', 'xlsm', 'pptm', 'dotm', 'xltm', 'xlam', 'ppam', 'ppsm', 'sldm'
  ];

  private static readonly ARCHIVE_EXTENSIONS = [
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'img', 'cab'
  ];

  public static scanFile(file: File): FileScanResult {
    const fileName = file.name.toLowerCase();
    const parts = fileName.split('.');
    const ext = parts.length > 1 ? parts.pop()! : '';

    // Check double extension evasion (e.g. invoice.pdf.exe)
    const isDoubleExt = parts.length > 1 && ['pdf', 'jpg', 'png', 'docx', 'xlsx'].includes(parts[parts.length - 1]);

    if (this.CRITICAL_EXTENSIONS.includes(ext) || isDoubleExt) {
      return {
        isDangerous: true,
        threatLevel: 'CRITICAL',
        fileTypeLabel: ext.toUpperCase() + ' Executable Payload',
        riskReason: `Critical executable binary or sideloading package detected (.${ext}). Executable scripts can install trojans, keyloggers, or seize complete remote device control.`,
        recommendation: 'DO NOT open, execute, or install this file. Sideloading unknown packages bypasses operating system security barriers.',
      };
    }

    if (this.MACRO_EXTENSIONS.includes(ext)) {
      return {
        isDangerous: true,
        threatLevel: 'CRITICAL',
        fileTypeLabel: 'Macro-Enabled Office Document',
        riskReason: `Macro-enabled office document detected (.${ext}). Malicious VBA macros automatically execute stealth dropper payloads when opened.`,
        recommendation: 'Never enable macros or click "Enable Content" on documents received from messaging channels.',
      };
    }

    if (this.ARCHIVE_EXTENSIONS.includes(ext)) {
      return {
        isDangerous: false,
        threatLevel: 'SUSPICIOUS',
        fileTypeLabel: 'Compressed Archive Container',
        riskReason: `Compressed archive container (.${ext}). Archives can conceal obfuscated binaries or password-protected malware scripts.`,
        recommendation: 'Inspect internal files with an antivirus scanner before extracting contents.',
      };
    }

    if (ext === 'pdf') {
      return {
        isDangerous: false,
        threatLevel: 'SAFE',
        fileTypeLabel: 'PDF Document',
      };
    }

    return {
      isDangerous: false,
      threatLevel: 'SAFE',
      fileTypeLabel: ext ? ext.toUpperCase() : 'Standard File',
    };
  }
}
