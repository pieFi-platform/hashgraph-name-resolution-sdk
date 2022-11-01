"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MirrorNode = exports.MAX_PAGE_SIZE = exports.getBaseUrl = exports.NetworkBaseURL = void 0;
const axios_1 = __importDefault(require("axios"));
var NetworkBaseURL;
(function (NetworkBaseURL) {
    NetworkBaseURL["hedera_test"] = "https://testnet.mirrornode.hedera.com";
    NetworkBaseURL["hedera_main"] = "https://mainnet-public.mirrornode.hedera.com";
    NetworkBaseURL["lworks_test"] = "https://testnet.mirror.lworks.io";
    NetworkBaseURL["lworks_main"] = "https://mainnet.mirror.lworks.io";
    NetworkBaseURL["arkhia_test"] = "https://hedera.testnet.arkhia.io";
    NetworkBaseURL["arkhia_main"] = "https://hedera.mainnet.arkhia.io";
})(NetworkBaseURL = exports.NetworkBaseURL || (exports.NetworkBaseURL = {}));
const getBaseUrl = (networkType) => {
    switch (networkType) {
        case 'hedera_test':
            return NetworkBaseURL.hedera_test;
        case 'hedera_main':
            return NetworkBaseURL.hedera_main;
        case 'lworks_test':
            return NetworkBaseURL.lworks_test;
        case 'lworks_main':
            return NetworkBaseURL.lworks_main;
        case 'arkhia_test':
            return NetworkBaseURL.arkhia_test;
        case 'arkhia_main':
            return NetworkBaseURL.arkhia_main;
        default:
            throw new Error('No base URL available for NetworkType');
    }
};
exports.getBaseUrl = getBaseUrl;
// Max page size allowed by hedera nodes
exports.MAX_PAGE_SIZE = 100;
class MirrorNode {
    constructor(networkType, authKey = '') {
        this.networkType = networkType;
        this.baseUrl = this.getBaseUrl();
        this.authKey = authKey;
    }
    async getNFT(tokenId, serial) {
        const url = `${this.getBaseUrl()}/api/v1/tokens/${tokenId}/nfts/${serial}`;
        const res = await this.sendGetRequest(url);
        return res.data;
    }
    async getNFTsByAccountId(tokenId, accountId) {
        const url = `${this.getBaseUrl()}/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}&limit=100`;
        let res = await this.sendGetRequest(url);
        const nfts = res.data.nfts;
        while (res.data.links.next) {
            const nextUrl = `${this.getBaseUrl()}${res.data.links.next}`;
            res = await this.sendGetRequest(nextUrl);
            const nextNfts = res.data.nfts;
            nfts.push(...nextNfts);
        }
        return nfts;
    }
    // Private 
    getBaseUrl() {
        return (0, exports.getBaseUrl)(this.networkType);
    }
    async sendGetRequest(url) {
        try {
            const res = await axios_1.default.get(url, {
                headers: {
                    Authorization: this.authKey,
                },
            });
            return res;
        }
        catch (err) {
            throw new Error('Get Request Failed');
        }
    }
}
exports.MirrorNode = MirrorNode;
