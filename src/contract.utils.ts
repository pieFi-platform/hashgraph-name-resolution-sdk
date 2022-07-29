import {
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  PrivateKey,
  Status,
  TokenId,
} from '@hashgraph/sdk';
import axios from 'axios';
import Web3 from 'web3';
import {
  ContractType,
  ContractTypes,
  MAX_GAS,
  NameHash,
  NETWORK,
  NFTData,
  SLDInfo,
  SubdomainInfo,
  TLD_MANAGER_ID,
} from './config/constants.config';
import * as SLDNode from './contracts/abi/src_contracts_SLDNode_sol_SLDNode.json';
import * as SubdomainNode from './contracts/abi/src_contracts_SubdomainNode_sol_SubdomainNode.json';
import * as TLDManager from './contracts/abi/src_contracts_TLDManager_sol_TLDManager.json';
import * as TLDNode from './contracts/abi/src_contracts_TLDNode_sol_TLDNode.json';

const web3 = new Web3();

/**
 * @description Decodes the result of a contract's function execution
 * @param functionName the name of the function within the ABI
 * @param resultAsBytes a byte array containing the execution result
 */
export const decodeFunctionResult = (
  functionName: string,
  contractType: ContractType,
  resultAsBytes: Uint8Array,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let abi: any;
  switch (contractType) {
    case ContractTypes.SLDNode:
      abi = SLDNode;
      break;
    case ContractTypes.SubdomainNode:
      abi = SubdomainNode;
      break;
    case ContractTypes.TLDManager:
      abi = TLDManager;
      break;
    case ContractTypes.TLDNode:
      abi = TLDNode;
      break;
    default:
      throw new Error('Invalid Node Type');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionAbi = abi.default.find((func: any) => func.name === functionName);
  const functionParameters = functionAbi.outputs;
  const resultHex = '0x'.concat(Buffer.from(resultAsBytes).toString('hex'));
  const result = web3.eth.abi.decodeParameters(functionParameters, resultHex);
  return result;
};

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
export const callContractFunc = async (
  client: Client,
  contractId: ContractId,
  contractType: ContractType,
  funcName: string,
  funcParams: ContractFunctionParameters = new ContractFunctionParameters(),
  gas = MAX_GAS,
  keys: PrivateKey[] | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
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
      contractType,
      record.contractFunctionResult.bytes,
    );
  } catch (err) {
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
  contractType: ContractType,
  funcName: string,
  funcParams: ContractFunctionParameters = new ContractFunctionParameters(),
  gas = MAX_GAS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
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
      contractType,
      response.bytes,
    );
  } catch (err) {
    return new Error('queryContractFunc failed');
  }
};

/**
 * @description Wrapper around Hedera SDK ContractCallQuery
 * @param contractId: {ContractId} The contract on which to to call a function
 * @param funcName: {string} The function name of which to call on the contract
 * @param funcParams: {ContractFunctionParameters} The parameters of the function to be called
 * @param gas: {number} (optional) The max gas to use for the call
 * @returns {Uint8Array}
 */
export const queryContractFuncTx = (
  contractId: ContractId,
  funcName: string,
  funcParams: ContractFunctionParameters = new ContractFunctionParameters(),
  gas = MAX_GAS,
): Uint8Array => {
  try {
    const tx = new ContractCallQuery()
      .setContractId(contractId)
      .setFunction(funcName, funcParams)
      .setGas(gas)
      .setQueryPayment(new Hbar(1));

    const txBytes = tx.toBytes();

    return txBytes;
  } catch (err) {
    throw new Error('queryContractFuncTx failed');
  }
};

/**
 * @description Retrieves the tld manager id
 * @returns {ContractInfo}
 */
export const getTLDManagerId = (): ContractId => ContractId.fromString(TLD_MANAGER_ID);

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
    const result = (
      await queryContractFunc(
        client,
        tldNodeId,
        ContractTypes.TLDNode,
        'getNumNodes',
      )
    );

    return Number(result[0]);
  } catch (err) {
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
    const tldManagerId = getTLDManagerId();

    const params = new ContractFunctionParameters()
      .addBytes32(tldHash);

    const result = await queryContractFunc(
      client,
      tldManagerId,
      ContractTypes.TLDManager,
      'getTLD',
      params,
    );

    return ContractId.fromSolidityAddress(result[0]);
  } catch (err) {
    throw new Error('Failed to call getTLD');
  }
};

/**
/**
 * @description Simple wrapper around callContractFunc for the getTLD smart contract function
 * @param tldHash: {Buffer} The hash of the TLD you wish to query
 * @returns {Uint8Array}
 */
export const callGetTLDTx = (
  tldHash: Buffer,
): Uint8Array => {
  try {
    const tldManagerId = getTLDManagerId();

    const params = new ContractFunctionParameters()
      .addBytes32(tldHash);

    const result = queryContractFuncTx(
      tldManagerId,
      'getTLD',
      params,
    );

    return result;
  } catch (err) {
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
    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash)
      .addUint256(begin)
      .addUint256(end);

    const result = await queryContractFunc(
      client,
      tldNodeId,
      ContractTypes.TLDNode,
      'getSLDNode',
      params,
    );

    return ContractId.fromSolidityAddress(result[0]);
  } catch (err) {
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
    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash);

    const result = await queryContractFunc(
      client,
      sldNodeId,
      ContractTypes.SLDNode,
      'getSerial',
      params,
    );
    return Number(result[0]);
  } catch (err) {
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
    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.sldHash);

    const result = await queryContractFunc(
      client,
      sldNodeId,
      ContractTypes.SLDNode,
      'getSLDInfo',
      params,
    );

    return result[0] as SLDInfo;
  } catch (err) {
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
    const params = new ContractFunctionParameters()
      .addBytes32(nameHash.subdomainHash);

    const result = await queryContractFunc(
      client,
      subdomainNodeId,
      ContractTypes.SubdomainNode,
      'getSubdomainInfo',
      params,
    );

    return result[0] as SubdomainInfo;
  } catch (err) {
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
    const result = await queryContractFunc(
      client,
      subdomainNodeId,
      ContractTypes.SubdomainNode,
      'dumpNames',
    );

    return result[0];
  } catch (err) {
    throw new Error('Failed to call getDomainInfo');
  }
};

/**
 * @description Issues a Rest API request to get all NFTs in a wallet
 * @param client: {Client} The client to use for the transaction
 * @param tokenId: {TokenId} Id of token of interest for the query
 * @returns {Promise<string[]>}
 */
export const queryNFTsFromRestAPI = async (
  client: Client,
  tokenId: TokenId,
): Promise<NFTData[]> => {
  try {
    const accountId = client.operatorAccountId?.toString();

    let url;

    switch (NETWORK) {
      case 'testnet':
        url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts/?token.id=${tokenId}`;
        break;
      case 'mainnet':
        url = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts/?token.id=${tokenId}`;
        break;
      default:
        throw new Error('Invalid Network');
    }

    const config = {
      method: 'get',
      url,
    };

    const res = await axios(config);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nfts = res.data.nfts.map((t:any) => ({
      accountId: t.account_id,
      metadata: Buffer.from(t.metadata, 'base64').toString(),
      serialNumber: t.serial_number,
      tokenId: t.token_id,
    }));

    return (nfts as NFTData[]);
  } catch (err) {
    throw new Error('Failed to get All SLDs');
  }
};
