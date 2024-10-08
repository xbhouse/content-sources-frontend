import { hardcodeRedHatReposByArchAndVersion } from './templateHelpers';

it('Test hardcodeRedHatReposByArchAndVersion', () => {
  let result = hardcodeRedHatReposByArchAndVersion('x86_64', '8') as string[];
  expect(result).toHaveLength(2);
  expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel8/8/x86_64/appstream/os');

  result = hardcodeRedHatReposByArchAndVersion('aarch64', '9') as string[];
  expect(result).toHaveLength(2);
  expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/aarch64/appstream/os');

  result = hardcodeRedHatReposByArchAndVersion('stuff', '12') as string[];
  expect(result).toBeUndefined();
});
