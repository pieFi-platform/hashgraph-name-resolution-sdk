import * as fs from 'fs';
import * as path from 'path';
import Web3 from 'web3';
import {
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  PrivateKey,
  Status,
} from '@hashgraph/sdk';
import { logger } from './config/logger.config';
import {
  ContractInfo,
  MAX_GAS,
  NameHash,
  SLDInfo,
  SLD_NODE_ABI,
  SubdomainInfo,
  SUBDOMAIN_NODE_ABI,
  TLD_MANAGER_ABI,
  TLD_MANAGER_ID,
  TLD_NODE_ABI,
} from './config/constants.config';

const web3 = new Web3();

/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
export const decodeFunctionResult = (
  functionName: string,
  abiPath: string,
  resultAsBytes: Uint8Array,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, abiPath), 'utf8'));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionAbi = abi.find((func: any) => func.name === functionName);
  const functionParameters = functionAbi.outputs;
  const resultHex = '0x'.concat(Buffer.from(resultAsBytes).toString('hex'));
  const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
  return result;
};

/**
 * @description Wrapper around Hedera SDK ContractExecuteTransaction
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param abiPath: {string} The path to the abi file of the contract
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param client: {Client} The client to use for the transaction
 * @param gas: {number} (optional) The max gas to use for the call
 * @param keys: {PrivateKey[]} (optional) The keys required to sign the transaction
 * @returns {Promise<any>}
 */
export const callContractFunc = async (
  client: Client,
  contractId: ContractId,
  abiPath: string,
  funcName: string,
  funcParams: ContractFunctionParameters = new ContractFunctionParameters(),
  gas = MAX_GAS,
  keys: PrivateKey[] | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
    // TODO: Remove
    // eslint-disable-next-line no-console
    console.log(`Hitting Contract: ${contractId}::${funcName}`);

    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunction(funcName, funcParams)
      .setGas(gas)
      .freezeWith(client);

    if (keys) {
      const promises = keys.map((key) => tx.sign(key));
      await Promise.all(promises);
    }

    const response = await tx.execute(client);
    const record = await response.getRecord(client);
    if (
      !record || !record.contractFunctionResult || record.receipt.status._code !== Status.Success._code
    ) {
      throw new Error('ContractExecuteTransaction failed');
    }

    return decodeFunctionResult(
      funcName,
      abiPath,
      record.contractFunctionResult.bytes,
    );
  } catch (err) {
    logger.error(err);
    return new Error('callContractFunc failed');
  }
};

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
export const queryContractFunc = async (
  client: Client,
  contractId: ContractId,
  abiPath: string,
  funcName: string,
  funcParams: ContractFunctionParameters = new ContractFunctionParameters(),
  gas = MAX_GAS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
    // TODO: Remove
    // eslint-disable-next-line no-console
    console.log(`Hitting Contract: ${contractId}::${funcName}`);

    const tx = new ContractCallQuery()
      .setContractId(contractId)
      .setFunction(funcName, funcParams)
      .setGas(gas)
      .setQueryPayment(new Hbar(1));
    const response = await tx.execute(client);

    if (
      !response || !response.bytes
    ) {
      throw new Error('ContractCallQuery failed');
    }

    return decodeFunctionResult(
      funcName,
      abiPath,
      response.bytes,
    );
  } catch (err) {
    logger.error(err);
    return new Error('queryContractFunc failed');
  }
};

/**
 * @description Retrieves information about the tld manager
 * @returns {ContractInfo}
 */
export const getTLDManagerInfo = (): ContractInfo => {
  const id: ContractId = ContractId.fromString(TLD_MANAGER_ID);
  const abi: string = TLD_MANAGER_ABI;
  return { id, abi };
};

/**
 * @description Retrieves abi path for TLDNode
 * @returns {string}
 */
export const getTLDNodeAbi = (): string => TLD_NODE_ABI;

/**
  * @description Retrieves abi path for SLDNode
  * @returns {string}
  */
export const getSLDNodeABI = (): string => SLD_NODE_ABI;

/**
  * @description Retrieves abi path for SubdomainNode
  * @returns {string}
  */
export const getSubdomainNodeABI = (): string => SUBDOMAIN_NODE_ABI;

/**
 * @description Simple wrapper around callContractFunc for the getNumNodes smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @returns {Promise<number>}
 */
export const callGetNumNodes = async (
  client: Client,
  tldNodeId: ContractId,
): Promise<number> => {
  try {
    const tldNodeAbi = getTLDNodeAbi();

    const result = (
      await queryContractFunc(
        client,
        tldNodeId,
        tldNodeAbi,
        'getNumNodes',
      )
    );

    return Number(result[0]);
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getNumNodes');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the getTLD smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param tldHash: {Buffer} The hash of the TLD you wish to query
 * @returns {Promise<ContractId>}
 */
export const callGetTLD = async (
  client: Client,
  tldHash: Buffer,
): Promise<ContractId> => {
  try {
    const tldManagerInfo = getTLDManagerInfo();

    const params = new ContractFunctionParameters()
      .addBytes32(tldHash);

    const result = await queryContractFunc(
      client,
      tldManagerInfo.id,
      tldManagerInfo.abi,
      'getTLD',
      params,
    );

    return ContractId.fromSolidityAddress(result[0]);
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getTLD');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the getSLDNode smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param nameHash: {NameHash} The NameHash of the domain to query
 * @param tldNodeId: {ContractId} TLDNode contract id
 * @param begin: {number} The begin index in the array of nodes of the manager
 * @param end: {number} The end index in the array of nodes of the manager
 * @returns {Promise<ContractId>}
 */
export const callGetSLDNode = async (
  client: Client,
  nameHash: NameHash,
  tldNodeId: ContractId,
  begin = 0,
  end = 0,
): Promise<ContractId> => {
  try {
    const tldNodeAbi = getTLDNodeAbi();
    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash)
      .addUint256(begin)
      .addUint256(end);

    const result = await queryContractFunc(
      client,
      tldNodeId,
      tldNodeAbi,
      'getSLDNode',
      params,
    );

    return ContractId.fromSolidityAddress(result[0]);
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getSLDNode');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the getSerial smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract to query for the domain
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<number>}
 */
export const callGetSerial = async (
  client: Client,
  sldNodeId: ContractId,
  nameHash: NameHash,
): Promise<number> => {
  try {
    const sldNodeAbi = getSLDNodeABI();

    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash);

    const result = await queryContractFunc(
      client,
      sldNodeId,
      sldNodeAbi,
      'getSerial',
      params,
    );
    return Number(result[0]);
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getSerial');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the getSLDInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param sldNodeId: {ContractId} The contract id to query for the SLDInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SLDInfo>}
 */
export const callGetSLDInfo = async (
  client: Client,
  sldNodeId: ContractId,
  nameHash: NameHash,
): Promise<SLDInfo> => {
  try {
    const sldNodeAbi = getSLDNodeABI();

    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash);

    const result = await queryContractFunc(
      client,
      sldNodeId,
      sldNodeAbi,
      'getSLDInfo',
      params,
    );

    return result[0] as SLDInfo;
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getDomainInfo');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the getSubdomainInfo smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @param nameHash: {NameHash} The hash of the domain to query
 * @returns {Promise<SubdomainInfo>}
 */
export const callGetSubdomainInfo = async (
  client: Client,
  subdomainNodeId: ContractId,
  nameHash: NameHash,
): Promise<SubdomainInfo> => {
  try {
    const subdomainNodeAbi = getSubdomainNodeABI();

    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.subdomainHash);

    const result = await queryContractFunc(
      client,
      subdomainNodeId,
      subdomainNodeAbi,
      'getSubdomainInfo',
      params,
    );

    return result[0] as SubdomainInfo;
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getDomainInfo');
  }
};

/**
 * @description Simple wrapper around callContractFunc for the dumpNames smart contract function
 * @param client: {Client} The client to use for the transaction
 * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
 * @returns {Promise<string[]>}
 */
export const callDumpNames = async (
  client: Client,
  subdomainNodeId: ContractId,
): Promise<string[]> => {
  try {
    const subdomainNodeAbi = getSubdomainNodeABI();

    const result = await queryContractFunc(
      client,
      subdomainNodeId,
      subdomainNodeAbi,
      'dumpNames',
    );

    return result[0];
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to call getDomainInfo');
  }
};

// /**
//  * @description Simple wrapper around callContractFunc for the dumpNames smart contract function
//  * @param client: {Client} The client to use for the transaction
//  * @param subdomainNodeId: {ContractId} The contract id to query for the SubdomainInfo
//  * @returns {Promise<string[]>}
//  */
// export const callGetSubdomainOwner = async (
//   client: Client,
//   subdomainNodeId: ContractId,
//   nameHash: NameHash,
// ): Promise<string[]> => {
//   try {
//     const subdomainNodeAbi = getSubdomainNodeABI();

//     const params = new ContractFunctionParameters()
//       .addBytes32(nameHash.subdomainHash);

//     const result = await queryContractFunc(
//       client,
//       subdomainNodeId,
//       subdomainNodeAbi,
//       'getSubdomainOwner',
//       params,
//     );

//     return result[0];
//   } catch (err) {
//     logger.error(err);
//     throw new Error('Failed to call getDomainInfo');
//   }
// };

// =========================================

// getSubdomainOwner = async (domain: string): Promise<string[]> => {
//   try {
//     const nameHash = HashgraphNames.generateNameHash(domain);
//     const sldNodeId = await this.resolveSLDNode(nameHash);
//     const sldNodeInfo = await callGetSLDInfo(this.client, sldNodeId, nameHash);
//     const subdomainNodeId = ContractId.fromSolidityAddress(sldNodeInfo.subdomainNode);
//     return await callGetSubdomainOwner(this.client, subdomainNodeId, nameHash);
//   } catch (err) {
//     logger.error(err);
//     throw new Error('Failed to get SLD Info');
//   }
// };

// ============================================
