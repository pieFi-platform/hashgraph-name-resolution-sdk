# hashgraph.name resolution SDK

In **pieFi**'s effort to create a web3 username public good, we'd like to also deliver a public SDK available for use by any entity that wants to resolve hashgraph names to empower their own solutions.

Please feel free to suggest any edits or to reach out for any help or partnerships you could be looking for.

@nostradaomus

Implementation (no key argument needs to be supplied for hedera_test and hedera_main values) :

    import { Resolver } from 'hashgraph-name-resolution-sdk'

    const resolver =  new Resolver('arkhia_main', 'arkhia_key');
    resolver.init();

Name Resolution Example:

    const accountId =  await resolver.resolveSLD('palacios.hbar');

Currently Supported Service Types: The values

    hedera_test, hedera_main, lworks_test, lworks_main, arkhia_test, arkhia_main

are currently supported by this SDK.

Unstoppable Domain Resolution Example:

    const accountId =  await resolver.resolveUnstoppableDomain('jim-unstoppable.crypto');
