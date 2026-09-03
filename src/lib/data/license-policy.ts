const REDISTRIBUTABLE_LICENSES = new Set([
  "KOGL-TYPE-1",
  "AKS-OWNED-FREE-USE",
  "CC0-1.0",
  "PDM-1.0",
  "CC-BY-4.0",
  "CC-BY-3.0",
  "PUBLIC-DATA-NO-RESTRICTIONS",
  "ODBL-1.0",
]);

export function isRedistributableLicense(code: string): boolean {
  return REDISTRIBUTABLE_LICENSES.has(code.trim().toUpperCase());
}

export const THIRD_PARTY_LICENSES = Object.freeze({
  koglType1: "https://www.kogl.or.kr/info/licenseType1.do",
  aksOwnedFreeUse: "https://encykorea.aks.ac.kr/Guide/ContentUse",
  ccBy: "https://creativecommons.org/licenses/by/4.0/",
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  publicDataNoRestrictions: "https://www.data.go.kr/data/15052752/fileData.do",
  odbl: "https://osmfoundation.org/wiki/Licence",
});
