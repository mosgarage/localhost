'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeSyncSettings = void 0;
const path = require("path");
const fs = require("fs");
const cs = require("./cs");
const logger_1 = require("./logger");
class CodeSyncSettings {
    constructor(internalPath, externalExtensionsPath) {
        this.logger = new logger_1.Logger('settings');
        this.logger.appendLine(`Creating settings with internal settings.json path and external extensions.json path: ${internalPath}, ${externalExtensionsPath}.`);
        this.externalExtensions = { extensions: [] };
        this.internalPath = internalPath;
        this.externalExtensionsPath = externalExtensionsPath;
    }
    get Settings() {
        this.settings = this.retrieveInternal();
        return this.settings;
    }
    set Settings(settings) {
        this.settings = settings;
    }
    get ExcludedInstalledPackages() {
        return this.Settings.excluded.installed;
    }
    set ExcludedInstalledPackages(packages) {
        this.Settings.excluded.installed = packages;
    }
    get ExcludedExternalPackages() {
        return this.Settings.excluded.external;
    }
    set ExcludedExternalPackages(packages) {
        this.Settings.excluded.external = packages;
    }
    get Extensions() {
        this.externalExtensions = this.retrieveExternalExtensions();
        return this.externalExtensions.extensions;
    }
    set Extensions(packages) {
        this.externalExtensions.extensions = packages;
    }
    get ExternalExtensionsPath() {
        return this.externalExtensionsPath;
    }
    set ExternalExtensionsPath(externalExtensionsPath) {
        this.externalExtensionsPath = externalExtensionsPath;
    }
    excludeInstalledPackage(p) {
        if (this.Settings.excluded.installed.indexOf(p) == -1) {
            this.Settings.excluded.installed.push(p);
        }
    }
    excludeExternalPackage(p) {
        if (this.Settings.excluded.external.indexOf(p) == -1) {
            this.Settings.excluded.external.push(p);
        }
    }
    includeInstalledPackage(p) {
        let index = this.Settings.excluded.installed.indexOf(p);
        if (index != -1) {
            this.Settings.excluded.installed.splice(index, 1);
        }
    }
    includeExternalPackage(p) {
        let index = this.Settings.excluded.external.indexOf(p);
        if (index != -1) {
            this.Settings.excluded.external.splice(index, 1);
        }
    }
    save() {
        this.ExternalExtensionsPath = path.join(this.settings.externalPath, cs.EXTENSIONS);
        fs.writeFileSync(this.internalPath, JSON.stringify(this.settings, null, 4));
    }
    saveExtensions() {
        fs.writeFileSync(this.externalExtensionsPath, JSON.stringify(this.externalExtensions, null, 4));
    }
    retrieveInternal() {
        return JSON.parse(fs.readFileSync(this.internalPath, 'utf8'));
    }
    retrieveExternalExtensions() {
        if (fs.existsSync(this.ExternalExtensionsPath)) {
            return JSON.parse(fs.readFileSync(this.ExternalExtensionsPath, 'utf8'));
        }
        else {
            return { extensions: [] };
        }
    }
}
exports.CodeSyncSettings = CodeSyncSettings;
//# sourceMappingURL=settings.js.map