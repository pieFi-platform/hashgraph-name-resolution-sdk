"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
jest.setTimeout(60 * 1000);
test('.cream name resolves to an address', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    const result = await resolver.resolveSLD('0.cream');
    await resolver.dispose();
    expect(result).toBeTruthy();
});
test('.hbar name resolves to an address', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    const result = await resolver.resolveSLD('0.hbar');
    await resolver.dispose();
    expect(result).toBeTruthy();
});
