import { NFT } from './types/NFT';
export declare type NetworkType = 'hedera_test' | 'hedera_main' | 'lworks_test' | 'lworks_main' | 'arkhia_test' | 'arkhia_main';
export declare enum NetworkBaseURL {
    'hedera_test' = "https://testnet.mirrornode.hedera.com",
    'hedera_main' = "https://mainnet-public.mirrornode.hedera.com",
    'lworks_test' = "https://testnet.mirror.lworks.io",
    'lworks_main' = "https://mainnet.mirror.lworks.io",
    'arkhia_test' = "https://hedera.testnet.arkhia.io",
    'arkhia_main' = "https://hedera.mainnet.arkhia.io"
}
export declare const getBaseUrl: (networkType: NetworkType) => NetworkBaseURL;
export declare const MAX_PAGE_SIZE = 100;
export declare class MirrorNode {
    networkType: NetworkType;
    baseUrl: string;
    authKey: string;
    constructor(networkType: NetworkType, authKey?: string);
    getNFT(tokenId: string, serial: string): Promise<NFT>;
    getNFTsByAccountId(tokenId: string, accountId: string): Promise<NFT[]>;
    private getBaseUrl;
    private sendGetRequest;
}
