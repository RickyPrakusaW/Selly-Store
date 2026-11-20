declare module "libphonenumber-js" {
  export function isValidPhoneNumber(
    text: string,
    defaultCountry?: string,
  ): boolean;
  export function parsePhoneNumber(
    text: string,
    defaultCountry?: string,
  ): unknown;
}
