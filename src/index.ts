import { Resolution } from "@unstoppabledomains/resolution";
import { hashDomain } from "./hashDomain";
import { MemoryCache } from "./MemoryCache";
import { MirrorNode, NetworkType } from "./mirrorNode";
import { PollingTopicSubscriber } from "./topicSubscriber/pollingTopicSubscriber";
import { ICache, NameHash, ResolverOptions, SecondLevelDomain, TopLevelDomain } from "./types";

export const TEST_TLD_TOPIC_ID = "0.0.48097305";
export const MAIN_TLD_TOPIC_ID = "0.0.1234189";

export {
  ICache,
  Links,
  MessageObject,
  MessagesResponse,
  NFT,
  NFTsResponse,
  NameHash,
  SecondLevelDomain,
  TopLevelDomain,
  ResolverOptions,
} from "./types";

export class Resolver {
  mirrorNode: MirrorNode;
  private _options?: ResolverOptions;
  private _isCaughtUpWithTopic = new Map<string, boolean>();
  private _subscriptions: (() => void)[] = [];
  private cache: ICache;

  isCaughtUpPromise: Promise<unknown> = Promise.resolve();

  constructor(networkType: NetworkType, authKey = "", cache?: ICache) {
    this.mirrorNode = new MirrorNode(networkType, authKey);
    if (!cache) {
      this.cache = new MemoryCache();
    } else {
      this.cache = cache;
    }

    if (this._options) {
      this._options = this._options;
    }
  }

  /**
   * @description Initializes all topic subscriptions.
   */
  public init() {
    this.isCaughtUpPromise = this.getTopLevelDomains().then(async () => {
      const promises: Promise<void>[] = [];

      await this.cache.getTlds().then((knownTlds) => {
        if (knownTlds) {
          for (const tld of knownTlds) {
            const sldsCaughtUpPromise = this.getSecondLevelDomains(tld.topicId);
            promises.push(sldsCaughtUpPromise);
          }
        }
      });

      await Promise.all(promises);
    });
  }

  public async dispose() {
    await Promise.all(this._subscriptions.map((unsub) => unsub()));
  }

  /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
  public async resolveSLD(domain: string): Promise<string | undefined> {
    const udResolution = new Resolution();
    const nameHash = hashDomain(domain);
    const sld = await this.getSecondLevelDomain(nameHash);
    if (await udResolution.isSupportedDomain(domain)) {
      try {
      const udResult = await udResolution.addr(domain, 'HBAR')
      return udResult;
      } catch (error) {
        console.log(error);
        return Promise.resolve(undefined);
      }
    } else if (sld) {
      const [tokenId, serial] = sld.nftId.split(":");
      const nft = await this.mirrorNode.getNFT(tokenId, serial);
      return nft.account_id;
    } else {
      return Promise.resolve(undefined);
    }
  }

  public async getAllDomainsForAccount(accountIdOrDomain: string): Promise<string[]> {
    let accountId = accountIdOrDomain;
    if (!accountIdOrDomain.startsWith('0.0.')) {
      const accountIdFromDomain = await this.resolveSLD(accountIdOrDomain);
      if (accountIdFromDomain) {
        accountId = accountIdFromDomain;
      } else {
        return [];
      }
    }

    const tokenIds = await this.cache.getTokenIds();
    if (tokenIds.length === 0) {
      return [];
    }

    const nftInfos = await Promise.all(tokenIds.map(tokenId => {
      return this.mirrorNode.getNFTsByAccountId(tokenId, accountId);
    }));

    const slds = await Promise.all(nftInfos
      .flat()
      .map(o => this.cache.getSldByNftId(`${o.token_id}:${o.serial_number}`)));
    return (slds.filter(sld => sld !== undefined) as SecondLevelDomain[]).map(sld => sld.nameHash.domain);
  }

  // Private

  private getTldTopicId(): string {
    if (this.mirrorNode.networkType.includes("test")) return TEST_TLD_TOPIC_ID;
    return MAIN_TLD_TOPIC_ID;
  }

  /**
   * @description Retrieves and stores top level domains
   */
  private async getTopLevelDomains(): Promise<void> {
    await new Promise<void>((resolve) => {
      this._subscriptions.push(
        PollingTopicSubscriber.subscribe(
          this.mirrorNode.networkType,
          this.getTldTopicId(),
          (messageObj) => {
            const decoded = Buffer.from(
              messageObj.message,
              "base64"
            ).toString();
            const tld = JSON.parse(decoded) as TopLevelDomain;

            // always set the cache to the latest tld on the topic
            this.cache.setTld(tld.nameHash.tldHash, tld);
          },
          () => {
            this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
            resolve();
          },
          undefined,
          this.mirrorNode.authKey,
          this._options
        )
      );
    });
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private async getTopLevelDomain(
    nameHash: NameHash
  ): Promise<TopLevelDomain | undefined> {
    while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const tldHash = nameHash.tldHash.toString("hex");
    const found = this.cache.hasTld(tldHash);
    if (!found) throw new Error("TLD not found");

    return this.cache.getTld(tldHash)!;
  }

  /**
   * @description Retrieves second level domains
   */
  private async getSecondLevelDomains(topicId: string): Promise<void> {
    await new Promise<void>((resolve) => {
      this._subscriptions.push(
        PollingTopicSubscriber.subscribe(
          this.mirrorNode.networkType,
          topicId,
          async (messageObj) => {
            const decoded = Buffer.from(
              messageObj.message,
              "base64"
            ).toString();
            const sld = JSON.parse(decoded) as SecondLevelDomain;

            if (messageObj.sequence_number) {
              sld.sequenceNumber = messageObj.sequence_number;
            }

            const tldHash = sld.nameHash.tldHash;
            const sldHash = sld.nameHash.sldHash;
            if (await this.cache.hasTld(tldHash)) {
              const cachedSld = await Promise.resolve(
                this.cache.getSld(tldHash, sldHash)!
              );
              // TODO: replace if the one in cache is expired
              if (!cachedSld) {
                this.cache.setSld(tldHash, sld);
              }
            } else {
              this.cache.setSld(tldHash, sld);
            }
          },
          () => {
            this._isCaughtUpWithTopic.set(topicId, true);
            resolve();
          },
          undefined,
          this.mirrorNode.authKey,
          this._options
        )
      );
    });
  }

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<SecondLevelDomain>}
   */

  // Improve method to look for unexpired domains
  public async getSecondLevelDomain(
    nameHash: NameHash
  ): Promise<SecondLevelDomain | undefined> {
    const tld = await this.getTopLevelDomain(nameHash);
    if (!tld) return undefined;
    const tldHash = nameHash.tldHash.toString("hex");
    const sldHash = nameHash.sldHash.toString("hex");

    let isCaughtUp = false;
    while (!isCaughtUp) {
      isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId)!;
      if (await this.cache.hasSld(tldHash, sldHash)) {
        return this.cache.getSld(tldHash, sldHash)!;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(
      `SLD message for:[${nameHash.domain
      }] not found on topic:[${tld.topicId.toString()}]`
    );
  }
}
