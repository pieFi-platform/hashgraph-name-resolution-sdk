import { SecondLevelDomain } from "./SecondLevelDomain";
import { TopLevelDomain } from "./TopLevelDomain";
export interface ICache {
    getTld(tldHash: string): Promise<TopLevelDomain> | TopLevelDomain | undefined;
    getTlds(): Promise<TopLevelDomain[]> | TopLevelDomain[] | undefined;
    getSld(tldHash: string, sldHash: string): Promise<SecondLevelDomain> | SecondLevelDomain | undefined;
    setTld(tldHash: string, tld: TopLevelDomain): void | any;
    setSld(tldHash: string, sld: SecondLevelDomain): void | any;
    hasTld(tldHash: string): boolean | Promise<boolean> | Promise<TopLevelDomain>;
    hasSld(tldHash: string, sldHash: string): boolean | Promise<boolean> | Promise<SecondLevelDomain>;
}
