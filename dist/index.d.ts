import { AccountId, Client, PrivateKey, PublicKey, TokenId } from '@hashgraph/sdk';
import { NameHash, NFTData, NFTMetadata, SLDInfo, SubdomainInfo } from './config/constants.config';
interface TransactionSignature {
    signerPublicKey: PublicKey;
    signature: Uint8Array;
}
export declare class HashgraphNames {
    operatorId: AccountId;
    operatorKey: PrivateKey;
    client: Client;
    tokenId: TokenId;
    constructor(operatorId: string, operatorKey: string);
    static generateMetadata: (domain: string) => NFTMetadata;
    /**
   * @description Generate a NameHash of the provided domain string
   * @param domain: {string} The domain string to hash
   * @returns {Buffer}
   */
    static generateNameHash: (domain: string) => NameHash;
    /**
   * @description Query the registry for the SLDNode responsible for a domain
   * @param nameHash: {NameHash} The NameHash of the domain to query
   * @param tldNodeId: {ContractId} TLDNode contract id
   * @returns {Promise<ContractId>}
   */
    private getSLDNode;
    /**
   * @description Takes a nameHash and returns the SLD that contains it
   * @param nameHash: {Buffer} The nameHash of the domain to be queried
   * @returns {Promise<ContractId>}
   */
    private resolveSLDNode;
    /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
    resolveSLD: (domain: string) => Promise<AccountId>;
    /**
   * @description Get the SLDInfo for a given domain
   * @param domain: {string} The domain to query
   * @returns {Promise<SLDInfo>}
   */
    getSLDInfo: (domain: string) => Promise<SLDInfo>;
    static getTLDTx: (domain: string) => Uint8Array;
    /**
   * @description Get the SubdomainInfo for a given domain
   * @param domain: {string} The domain to query
   * @returns {Promise<SubdomainInfo>}
   */
    getSubdomainInfo: (domain: string) => Promise<SubdomainInfo>;
    /**
   * @description Get all subdomains for a given domain
   * @param domain: {string} The domain to query
   * @returns {Promise<string[]>}
   */
    getSLDSubdomains: (domain: string) => Promise<string[]>;
    getAllSLDsInWallet: () => Promise<NFTData[]>;
    /**
   * @description Helper function to convert an Uint8Array into an Hedera Transaction type
   * @param transactionBytes: {Uint8Array} The transaction bytes to be converted
   */
    private static bytesToTransaction;
    /**
   * @description Executes an HTS TransferTransaction
   * @param ownerSignature: {TransactionSignature} The signature information for the NFT owner
   * @param receiverSignature: {TransactionSignature} The signature information for the NFT receiver
   * @param transactionBytes: {Uint8Array} The transaction bytes to be executed
   * @returns {Promise<number>}
   */
    transferDomain: (ownerSignature: TransactionSignature, receiverSignature: TransactionSignature, transactionBytes: Uint8Array) => Promise<number>;
    /**
   * @description Signs a Hedera transaction
   * @param signerKey: {string} The private key with which to sign the transaction
   * @param transactionBytes: {Uint8Array} The bytes for the transaction to be signed
   * @returns {Promise<Uint8Array>}
   */
    static transferTransactionSign: (signerKey: string, transactionBytes: Uint8Array) => TransactionSignature;
    /**
   * @description Creates a HTS TransferTransaction and returns it as an Uint8Array
   * @param domain: {string} The domain for the NFT to transfer
   * @param NFTOwner: {string} The account id of the NFT owner
   * @param NFTReceiver: {string} The account id of the NFT receiver
   * @param purchasePrice: {number} The amount in tinyBar for which the NFT is being purchased
   * @returns {Uint8Array}
   */
    transferTransactionCreate: (domain: string, NFTOwner: string, NFTReceiver: string, purchasePrice: number) => Promise<Uint8Array>;
    /**
   * @description Simple wrapper around HTS TokenNftInfoQuery()
   * @param serial: {number} The serial of the NFT to query
   * @returns {Promise<TokenNftInfo>}
   */
    private getTokenNFTInfo;
}
export {};
