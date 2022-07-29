import { Client, ContractFunctionParameters, ContractId, PrivateKey, TokenId } from '@hashgraph/sdk';
import { ContractType, NameHash, NFTData, SLDInfo, SubdomainInfo } from './config/constants.config';
/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
export declare const decodeFunctionResult: (functionName: string, contractType: ContractType, resultAsBytes: Uint8Array) => any;
/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param nodeType: {NodeType} The type contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 * @returns {Promise<any>}
 */
export declare const callContractFunc: (client: Client, contractId: ContractId, contractType: ContractType, funcName: string, funcParams?: ContractFunctionParameters, gas?: number, keys?: PrivateKey[] | null) => Promise<any>;
/**
 * @description Wrapper around Hedera SDK ContractCallQuery
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @returns {Promise<any>}
 */
export declare const queryContractFunc: (client: Client, contractId: ContractId, contractType: ContractType, funcName: string, funcParams?: ContractFunctionParameters, gas?: number) => Promise<any>;
/**
 * @description Wrapper around Hedera SDK ContractCallQuery
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param gas: {number} (optional) The max gas to use for the call
 * @returns {Uint8Array}
 */
export declare const queryContractFuncTx: (contractId: ContractId, funcName: string, funcParams?: ContractFunctionParameters, gas?: number) => Uint8Array;
/**
 * @description Retrieves the tld manager id
 * @returns {ContractInfo}
 */
export declare const getTLDManagerId: () => ContractId;
/**
 * @description Simple wrapper around callContractFunc for the getNumNodes smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @returns {Promise<number>}
 */
export declare const callGetNumNodes: (client: Client, tldNodeId: ContractId) => Promise<number>;
/**
 * @description Simple wrapper around callContractFunc for the getTLD smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldHash: {Buffer} The hash of the TLD you wish to query
 * @returns {Promise<ContractId>}
 */
export declare const callGetTLD: (client: Client, tldHash: Buffer) => Promise<ContractId>;
/**
/**
 * @description Simple wrapper around callContractFunc for the getTLD smart contract function
 * @param tldHash: {Buffer} The hash of the TLD you wish to query
 * @returns {Uint8Array}
 */
export declare const callGetTLDTx: (tldHash: Buffer) => Uint8Array;
/**
 * @description Simple wrapper around callContractFunc for the getSLDNode smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param nameHash: {NameHash} The NameHash of the domain to query
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @param begin: {number} The begin index in the array of nodes of the manager
 * @param end: {number} The end index in the array of nodes of the manager
 * @returns {Promise<ContractId>}
 */
export declare const callGetSLDNode: (client: Client, nameHash: NameHash, tldNodeId: ContractId, begin?: number, end?: number) => Promise<ContractId>;
/**
 * @description Simple wrapper around callContractFunc for the getSerial smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract to query for the domain
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<number>}
 */
export declare const callGetSerial: (client: Client, sldNodeId: ContractId, nameHash: NameHash) => Promise<number>;
/**
 * @description Simple wrapper around callContractFunc for the getSLDInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract id to query for the SLDInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SLDInfo>}
 */
export declare const callGetSLDInfo: (client: Client, sldNodeId: ContractId, nameHash: NameHash) => Promise<SLDInfo>;
/**
 * @description Simple wrapper around callContractFunc for the getSubdomainInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SubdomainInfo>}
 */
export declare const callGetSubdomainInfo: (client: Client, subdomainNodeId: ContractId, nameHash: NameHash) => Promise<SubdomainInfo>;
/**
 * @description Simple wrapper around callContractFunc for the dumpNames smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @returns {Promise<string[]>}
 */
export declare const callDumpNames: (client: Client, subdomainNodeId: ContractId) => Promise<string[]>;
/**
 * @description Issues a Rest API request to get all NFTs in a wallet
 * @param client: {Client} The client to use for the transaction
 * @param tokenId: {TokenId} Id of token of interest for the query
 * @returns {Promise<string[]>}
 */
export declare const queryNFTsFromRestAPI: (client: Client, tokenId: TokenId) => Promise<NFTData[]>;
