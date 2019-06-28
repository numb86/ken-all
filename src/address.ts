type Address = [string, string, string, string];
export type NormalizedAddress = [string, string, string];

export const generateAddressListFromText = (rawData: string): Address[] => {
  const lines: string[] = rawData
    .split('\n')
    .filter((line: string): boolean => line.length > 0);
  return lines.map(
    (line: string): Address => {
      const address = line.split(',');
      if (address.length !== 4) throw new Error('CSV was broken.');
      return address.map((item: string): string =>
        item.replace(/"/g, '')
      ) as Address;
    }
  );
};

export const extractTargetAddress = (
  postCodeBack: string,
  addressList: Address[]
): Address[] =>
  addressList.filter(
    (address: Address): boolean => address[0] === postCodeBack
  );

const removeFirstItemFromAddress = (address: Address): NormalizedAddress => {
  const copiedArray = [...address];
  copiedArray.shift();
  if (copiedArray.length !== 3) {
    throw new Error('Failed removeFirstItemFromAddress.');
  }
  return copiedArray as NormalizedAddress;
};

export const normalizeAddressList = (
  addressList: Address[]
): NormalizedAddress[] =>
  addressList.map(
    (address: Address): NormalizedAddress => removeFirstItemFromAddress(address)
  );
