export function validateGoogleMapsUrl(value: string | null | undefined): string | null;
export function validateShopLogoFile(file: { type?: string; size?: number; width?: number; height?: number } | null | undefined): string | null;
export function generatedShopLogoDataUrl(shopName: string | null | undefined): string;
export function getShopQrDestination(shop: { id?: string; map_link?: string | null; is_public?: boolean } | null | undefined, origin: string): string | null;
