import { Resolver } from "..";

jest.setTimeout(60 * 1000);
test('.cream name resolves to an address', async () => {
  const resolver = new Resolver('hedera_main');
  resolver.init();
  const result = await resolver.resolveSLD('0.cream');
  await resolver.dispose();
  expect(result).toBeTruthy();
});

test('.hbar name resolves to an address', async () => {
  const resolver = new Resolver('hedera_main');
  resolver.init();
  const result = await resolver.resolveSLD('0.hbar');
  await resolver.dispose();
  expect(result).toBeTruthy();
});
