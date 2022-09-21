import { ICache } from "./types/Cache";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";

export class MemoryCache implements ICache {
  tld: Map<string, TopLevelDomain>;
  slds: Map<string, Map<string, SecondLevelDomain>>;

  constructor() {
    this.tld = new Map<string, TopLevelDomain>();
    this.slds = new Map<string, Map<string, SecondLevelDomain>>();
  }

  getTld(
    tldHash: string
  ): TopLevelDomain | Promise<TopLevelDomain> | undefined {
    return this.tld.get(tldHash);
  }

  getTlds(): TopLevelDomain[] {
    return Array.from(this.tld.values()) || [];
  }

  getSld(
    tldHash: string,
    sldHash: string
  ): SecondLevelDomain | Promise<SecondLevelDomain> | undefined {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return sldCache.get(sldHash);
      }
    }
    return undefined;
  }

  setTld(tldHash: string, tld: TopLevelDomain): void {
    this.tld.set(tldHash, tld);
  }

  setSld(tldHash: string, sld: SecondLevelDomain): void {
    if (this.slds.has(tldHash)) {
      const sldDomainCache = this.slds.get(tldHash)!;
      if (!sldDomainCache.has(sld.nameHash.sldHash)) {
        sldDomainCache.set(sld.nameHash.sldHash, sld);
      }
    } else {
      this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
    }
  }

  hasTld(key: string): boolean {
    return this.tld.has(key);
  }

  hasSld(tldHash: string, sldHash: string): boolean {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return sldCache.has(sldHash);
      }
    }
    return false;
  }
}
