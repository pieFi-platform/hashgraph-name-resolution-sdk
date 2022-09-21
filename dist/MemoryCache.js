"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
class MemoryCache {
    constructor() {
        this.tld = new Map();
        this.slds = new Map();
    }
    getTld(tldHash) {
        return this.tld.get(tldHash);
    }
    getTlds() {
        return Array.from(this.tld.values()) || [];
    }
    getSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return sldCache.get(sldHash);
            }
        }
        return undefined;
    }
    setTld(tldHash, tld) {
        this.tld.set(tldHash, tld);
    }
    setSld(tldHash, sld) {
        if (this.slds.has(tldHash)) {
            const sldDomainCache = this.slds.get(tldHash);
            if (!sldDomainCache.has(sld.nameHash.sldHash)) {
                sldDomainCache.set(sld.nameHash.sldHash, sld);
            }
        }
        else {
            this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
        }
    }
    hasTld(key) {
        return this.tld.has(key);
    }
    hasSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return sldCache.has(sldHash);
            }
        }
        return false;
    }
}
exports.MemoryCache = MemoryCache;
