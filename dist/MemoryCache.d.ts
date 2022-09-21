import { ICache } from "./types/Cache";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";
export declare class MemoryCache implements ICache {
    tld: Map<string, TopLevelDomain>;
    slds: Map<string, Map<string, SecondLevelDomain>>;
    constructor();
    getTld(tldHash: string): TopLevelDomain | Promise<TopLevelDomain> | undefined;
    getTlds(): TopLevelDomain[];
    getSld(tldHash: string, sldHash: string): SecondLevelDomain | Promise<SecondLevelDomain> | undefined;
    setTld(tldHash: string, tld: TopLevelDomain): void;
    setSld(tldHash: string, sld: SecondLevelDomain): void;
    hasTld(key: string): boolean;
    hasSld(tldHash: string, sldHash: string): boolean;
}
