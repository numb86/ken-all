type NormalizedAddress = [string, string, string];
declare const KenAll: (postCode: string) => Promise<NormalizedAddress[]>;
export default KenAll;
