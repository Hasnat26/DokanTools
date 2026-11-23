export function canSharePdfFile(file:File,navigatorLike?:Navigator):boolean;
export function sharePdfFile(file:File,navigatorLike?:Navigator):Promise<{shared:true}|{shared:false;reason:"unsupported"|"cancelled"|"failed"}>;
