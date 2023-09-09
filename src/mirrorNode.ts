import axios, { AxiosResponse } from 'axios';
import { NFT } from './types/NFT';
import { NameHash } from './types/NameHash';
import { HashgraphNames } from './archived';
import { MAIN_TLD_TOPIC_ID } from '.';

export type NetworkType =
  | 'hedera_test'
  | 'hedera_main'
  //   | 'lworks_test'
  //   | 'lworks_main'
  | 'arkhia_test'
  | 'arkhia_main';

export enum NetworkBaseURL {
  'hedera_test' = 'https://testnet.mirrornode.hedera.com',
  'hedera_main' = 'https://mainnet-public.mirrornode.hedera.com',
  //   'lworks_test' = 'https://testnet.mirror.lworks.io',
  //   'lworks_main' = 'https://mainnet.mirror.lworks.io',
  'arkhia_test' = 'https://hedera.testnet.arkhia.io',
  'arkhia_main' = 'https://hashport.arkhia.io/hedera/mainnet',
}

export const getBaseUrl = (networkType: NetworkType) => {
  switch (networkType) {
    case 'hedera_test':
      return NetworkBaseURL.hedera_test;
    case 'hedera_main':
      return NetworkBaseURL.hedera_main;
    // case 'lworks_test':
    //   return NetworkBaseURL.lworks_test;
    // case 'lworks_main':
    //   return NetworkBaseURL.lworks_main;
    case 'arkhia_test':
      return NetworkBaseURL.arkhia_test;
    case 'arkhia_main':
      return NetworkBaseURL.arkhia_main;
    default:
      throw new Error('No base URL available for NetworkType');
  }
};

// Max page size allowed by hedera nodes
export const MAX_PAGE_SIZE = 100;

export class MirrorNode {
  networkType: NetworkType;
  baseUrl: string;
  authKey: string;
  authHeader: string;

  constructor(networkType: NetworkType, authHeader = '', authKey = '') {
    this.networkType = networkType;
    this.baseUrl = this.getBaseUrl();
    this.authHeader = authHeader;
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
    const { nfts } = res.data;
    while (res.data.links.next) {
      const nextUrl = `${this.getBaseUrl()}${res.data.links.next}`;
      // eslint-disable-next-line no-await-in-loop
      res = await this.sendGetRequest(nextUrl);
      const nextNfts: NFT[] = res.data.nfts;
      nfts.push(...nextNfts);
    }
    return nfts;
  }
  async getTopicMessage(nameHash:NameHash) {
    const urlTopicManger = `${this.getBaseUrl()}/api/v1/topics/${MAIN_TLD_TOPIC_ID}/messages`;
    const res = await this.sendGetRequest(urlTopicManger);
    const { messages } = res.data;
    const topicMessages = messages.map((x: { message: WithImplicitCoercion<string> | { [ Symbol.toPrimitive ](hint: 'string'): string; }; }) => {
      const decoded = Buffer.from(x.message, 'base64').toString();
      return JSON.parse(decoded);
    });
    const found = topicMessages.find(
      (message: { nameHash: { tldHash: string; }; }) => message.nameHash.tldHash === nameHash.tldHash.toString('hex'),
    );
    return found;
  }

  async getContractEvmAddress(contractId:string) {
    const url = `${this.getBaseUrl()}/api/v1/contracts/${contractId}`;
    const res = await this.sendGetRequest(url);

    return res.data.evm_address;
  }

  // Private

  private getBaseUrl() {
    return getBaseUrl(this.networkType);
  }

  // eslint-disable-next-line class-methods-use-this
  private buildAuthHeaders(
    authKey : string,
    authVal : string,
  ) {
    if (authVal && authKey) {
      return { [authKey]: authVal };
    }
    return {};
  }

  private async sendGetRequest(url: string): Promise<AxiosResponse> {
    const AUTH_HEADERS = this.buildAuthHeaders(this.authHeader, this.authKey);
    try {
      const res = await axios.get(url, {
        headers: {
          ...AUTH_HEADERS,
        },
      });

      return res;
    } catch (err) {
      throw new Error('Get Request Failed');
    }
  }
}
