export class WidgetVersioning {
  static isCompatible(required: string, installed: string): boolean {
    const [req] = required.split('.');
    const [inst] = installed.split('.');
    return parseInt(inst) >= parseInt(req);
  }

  static isSemVer(version: string): boolean {
    return /^\d+\.\d+\.\d+(-\w+)?$/.test(version);
  }

  static compareVersions(v1: string, v2: string): number {
    const [major1, minor1, patch1] = v1.split('.').map(Number);
    const [major2, minor2, patch2] = v2.split('.').map(Number);

    if (major1 !== major2) return major1 - major2;
    if (minor1 !== minor2) return minor1 - minor2;
    return patch1 - patch2;
  }
}
