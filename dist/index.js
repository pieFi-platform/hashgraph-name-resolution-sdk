"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = exports.MAIN_TLD_TOPIC_ID = exports.TEST_TLD_TOPIC_ID = void 0;
const resolution_1 = require("@unstoppabledomains/resolution");
const hashDomain_1 = require("./hashDomain");
const MemoryCache_1 = require("./MemoryCache");
const mirrorNode_1 = require("./mirrorNode");
const pollingTopicSubscriber_1 = require("./topicSubscriber/pollingTopicSubscriber");
exports.TEST_TLD_TOPIC_ID = "0.0.48097305";
exports.MAIN_TLD_TOPIC_ID = "0.0.1234189";
class Resolver {
    constructor(networkType, authKey = "", cache) {
        this._isCaughtUpWithTopic = new Map();
        this._subscriptions = [];
        this.isCaughtUpPromise = Promise.resolve();
        this.mirrorNode = new mirrorNode_1.MirrorNode(networkType, authKey);
        if (!cache) {
            this.cache = new MemoryCache_1.MemoryCache();
        }
        else {
            this.cache = cache;
        }
        if (this._options) {
            this._options = this._options;
        }
    }
    /**
     * @description Initializes all topic subscriptions.
     */
    init() {
        this.isCaughtUpPromise = this.getTopLevelDomains().then(async () => {
            const promises = [];
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
    async dispose() {
        await Promise.all(this._subscriptions.map((unsub) => unsub()));
    }
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    async resolveSLD(domain) {
        const udResolution = new resolution_1.Resolution();
        const nameHash = (0, hashDomain_1.hashDomain)(domain);
        const sld = await this.getSecondLevelDomain(nameHash);
        if (await udResolution.isSupportedDomain(domain)) {
            try {
                const udResult = await udResolution.addr(domain, 'HBAR');
                return udResult;
            }
            catch (error) {
                console.log(error);
                return Promise.resolve(undefined);
            }
        }
        else if (sld) {
            const [tokenId, serial] = sld.nftId.split(":");
            const nft = await this.mirrorNode.getNFT(tokenId, serial);
            return nft.account_id;
        }
        else {
            return Promise.resolve(undefined);
        }
    }
    async getAllDomainsForAccount(accountIdOrDomain) {
        let accountId = accountIdOrDomain;
        if (!accountIdOrDomain.startsWith('0.0.')) {
            const accountIdFromDomain = await this.resolveSLD(accountIdOrDomain);
            if (accountIdFromDomain) {
                accountId = accountIdFromDomain;
            }
            else {
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
        return slds.filter(sld => sld !== undefined).map(sld => sld.nameHash.domain);
    }
    // Private
    getTldTopicId() {
        if (this.mirrorNode.networkType.includes("test"))
            return exports.TEST_TLD_TOPIC_ID;
        return exports.MAIN_TLD_TOPIC_ID;
    }
    /**
     * @description Retrieves and stores top level domains
     */
    async getTopLevelDomains() {
        await new Promise((resolve) => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, this.getTldTopicId(), (messageObj) => {
                const decoded = Buffer.from(messageObj.message, "base64").toString();
                const tld = JSON.parse(decoded);
                // always set the cache to the latest tld on the topic
                this.cache.setTld(tld.nameHash.tldHash, tld);
            }, () => {
                this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
                resolve();
            }, undefined, this.mirrorNode.authKey, this._options));
        });
    }
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    async getTopLevelDomain(nameHash) {
        while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const tldHash = nameHash.tldHash.toString("hex");
        const found = this.cache.hasTld(tldHash);
        if (!found)
            throw new Error("TLD not found");
        return this.cache.getTld(tldHash);
    }
    /**
     * @description Retrieves second level domains
     */
    async getSecondLevelDomains(topicId) {
        await new Promise((resolve) => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, topicId, async (messageObj) => {
                const decoded = Buffer.from(messageObj.message, "base64").toString();
                const sld = JSON.parse(decoded);
                if (messageObj.sequence_number) {
                    sld.sequenceNumber = messageObj.sequence_number;
                }
                const tldHash = sld.nameHash.tldHash;
                const sldHash = sld.nameHash.sldHash;
                if (await this.cache.hasTld(tldHash)) {
                    const cachedSld = await Promise.resolve(this.cache.getSld(tldHash, sldHash));
                    // TODO: replace if the one in cache is expired
                    if (!cachedSld) {
                        this.cache.setSld(tldHash, sld);
                    }
                }
                else {
                    this.cache.setSld(tldHash, sld);
                }
            }, () => {
                this._isCaughtUpWithTopic.set(topicId, true);
                resolve();
            }, undefined, this.mirrorNode.authKey, this._options));
        });
    }
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<SecondLevelDomain>}
     */
    // Improve method to look for unexpired domains
    async getSecondLevelDomain(nameHash) {
        const tld = await this.getTopLevelDomain(nameHash);
        if (!tld)
            return undefined;
        const tldHash = nameHash.tldHash.toString("hex");
        const sldHash = nameHash.sldHash.toString("hex");
        let isCaughtUp = false;
        while (!isCaughtUp) {
            isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId);
            if (await this.cache.hasSld(tldHash, sldHash)) {
                return this.cache.getSld(tldHash, sldHash);
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
    }
}
exports.Resolver = Resolver;
