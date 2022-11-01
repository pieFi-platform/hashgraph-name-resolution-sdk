import axios, { AxiosResponse } from 'axios';
import { NFT } from './types/NFT';

export type NetworkType =
  | 'hedera_test'
  | 'hedera_main'
  | 'lworks_test'
  | 'lworks_main'
  | 'arkhia_test'
  | 'arkhia_main';


export enum NetworkBaseURL {
  'hedera_test' = 'https://testnet.mirrornode.hedera.com',
  'hedera_main' = 'https://mainnet-public.mirrornode.hedera.com',
  'lworks_test' = 'https://testnet.mirror.lworks.io',
  'lworks_main' = 'https://mainnet.mirror.lworks.io',
  'arkhia_test' = 'https://hedera.testnet.arkhia.io',
  'arkhia_main' = 'https://hedera.mainnet.arkhia.io',
}

export const getBaseUrl = (networkType: NetworkType) => {
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
}

// Max page size allowed by hedera nodes
export const MAX_PAGE_SIZE = 100;

export class MirrorNode {
  networkType: NetworkType;
  baseUrl: string;
  authKey: string;

  constructor(networkType: NetworkType, authKey = '') {
    this.networkType = networkType;
    this.baseUrl = this.getBaseUrl();
    this.authKey = authKey;
  }

  async getNFT(tokenId: string, serial: string): Promise<NFT> {
    const url = `${this.getBaseUrl()}/api/v1/tokens/${tokenId}/nfts/${serial}`;
    const res = await this.sendGetRequest(url);
    return res.data as NFT;
  }

  async getNFTsByAccountId(tokenId: string, accountId: string): Promise<NFT[]> {
    const url = `${this.getBaseUrl()}/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}&limit=100`;
    let res = await this.sendGetRequest(url);
    const nfts: NFT[] = res.data.nfts;
    while (res.data.links.next) {
      const nextUrl = `${this.getBaseUrl()}${res.data.links.next}`;
      res = await this.sendGetRequest(nextUrl);
      const nextNfts: NFT[] = res.data.nfts;
      nfts.push(...nextNfts);
    }
    return nfts;
  }

  // Private 

  private getBaseUrl() {
    return getBaseUrl(this.networkType);
  }

  private async sendGetRequest(url: string): Promise<AxiosResponse> {
    try {
      const res = await axios.get(url, {
        headers: {
          Authorization: this.authKey,
        },
      });

      return res;
    } catch (err) {
      throw new Error('Get Request Failed');
    }
  }
}
