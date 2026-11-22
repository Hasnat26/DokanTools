#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFile,writeFile,mkdir,readdir} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
const pdf=resolve(process.argv[2]||"artifacts/dokantools-authenticated-a6.pdf");
const manifestPath=resolve(process.argv[3]||"artifacts/dokantools-a6-expectations.json");
const expected=JSON.parse(await readFile(manifestPath,"utf8"));
function run(command,args){const result=spawnSync(command,args,{encoding:"utf8",maxBuffer:20*1024*1024});if(result.error)throw result.error;assert.equal(result.status,0,`${command} failed: ${result.stderr}`);return result.stdout;}
const info=run("pdfinfo",["-box",pdf]);
const pages=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]),rotation=Number(info.match(/^Page rot:\s+(\d+)/m)?.[1]);
const size=info.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
assert.equal(pages,1,"PDF must contain exactly one page");assert.equal(rotation,0,"PDF rotation must be 0 degrees");
const metadataTitle=info.match(/^Title:\s+(.*)$/m)?.[1]||"";assert.ok(metadataTitle.length>0,"PDF title metadata must be present");assert.doesNotMatch(metadataTitle,/[\u0980-\u09FF]/,"PDF metadata title must be English-only");
assert.ok(size,"PDF page size missing");const width=Number(size[1]),height=Number(size[2]);
const expectedWidth=105*72/25.4,expectedHeight=148*72/25.4;
assert.ok(Math.abs(width-expectedWidth)<=0.1,`A6 width mismatch beyond 0.1pt: ${width}pt`);assert.ok(Math.abs(height-expectedHeight)<=0.1,`A6 height mismatch beyond 0.1pt: ${height}pt`);assert.ok(width<height,"A6 must be portrait");
const mediaBox=info.match(/^MediaBox:\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/m)?.slice(1).map(Number);
const cropBox=info.match(/^CropBox:\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/m)?.slice(1).map(Number);
assert.ok(mediaBox&&cropBox,"PDF MediaBox and CropBox must be present");
const expectedBox=[0,0,expectedWidth,expectedHeight];
for(const [name,box] of [["MediaBox",mediaBox],["CropBox",cropBox]])box.forEach((value,index)=>assert.ok(Math.abs(value-expectedBox[index])<=0.1,`${name} geometry mismatch at index ${index}: ${value}`));
const fonts=run("pdffonts",[pdf]);assert.doesNotMatch(fonts,/NotoSansBengali|Bengali/i,"PDF must not depend on a Bengali font");
const xml=run("pdftohtml",["-xml","-stdout",pdf]);
const fontSizes=[...xml.matchAll(/<fontspec\b[^>]*\bsize="(\d+)"/g)].map(match=>Number(match[1]));
assert.ok(fontSizes.length>0,"PDF font metadata missing");const minFontSize=Math.min(...fontSizes);assert.ok(minFontSize>=8,`PDF text below 8pt: ${minFontSize}pt`);
const pageTag=xml.match(/<page\b[^>]*>/)?.[0];assert.ok(pageTag,"PDF page dimensions missing");
const xmlWidth=Number(pageTag.match(/\bwidth="([\d.]+)"/)?.[1]),xmlHeight=Number(pageTag.match(/\bheight="([\d.]+)"/)?.[1]);
assert.ok(Number.isFinite(xmlWidth)&&Number.isFinite(xmlHeight),"PDF XML page dimensions invalid");
const safeX=xmlWidth*3/105,safeY=xmlHeight*3/148;
const textBoxes=[...xml.matchAll(/<text\b[^>]*\btop="([\d.]+)"[^>]*\bleft="([\d.]+)"[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/g)];
assert.ok(textBoxes.length>0,"No PDF text bounding boxes found");
const outOfBounds=textBoxes.map(m=>({top:Number(m[1]),left:Number(m[2]),width:Number(m[3]),height:Number(m[4])})).filter(b=>b.left<safeX-1||b.top<safeY-1||b.left+b.width>xmlWidth-safeX+1||b.top+b.height>xmlHeight-safeY+1);
assert.equal(outOfBounds.length,0,`Text outside 3mm safe area: ${JSON.stringify(outOfBounds.slice(0,5))}`);
const extracted=run("pdftotext",[pdf,"-"]).replace(/\s+/g," ");
const required=[expected.shopName,"Bill / Memo","Subtotal",expected.subtotal,"Grand Total",expected.grandTotal,"DRAFT ONLY","Product","Qty","Unit Price","Line Total"];
for(const line of expected.lines){required.push(line.productName,line.quantity,line.unit,line.unitPrice,line.lineTotal);}
if(expected.discountEnabled)required.push("Discount",expected.discount);
if(expected.taxEnabled)required.push("VAT / Tax",expected.taxRate,expected.tax);
if(expected.paidEnabled)required.push("Paid",expected.paid,"Due",expected.due);
if(expected.ownerName)required.push("Owner:",expected.ownerName);if(expected.address)required.push(expected.address);if(expected.phone)required.push("Phone:",expected.phone);if(expected.mapsCaption)required.push(expected.mapsCaption);if(expected.qrCaption)required.push(expected.qrCaption);
for(const value of required)assert.ok(extracted.includes(value),`PDF content missing: ${value}`);
const imageList=run("pdfimages",["-list",pdf]);const imageRows=imageList.split(/\r?\n/).filter(line=>/^\s*\d+\s+\d+\s+image\s+\d+\s+\d+/i.test(line));if(expected.logoPresent&&expected.qrPresent)assert.ok(imageRows.length>=2,"PDF must contain logo and QR raster images; found "+imageRows.length);
const imageTags=[...xml.matchAll(/<image\b[^>]*>/g)].map(match=>match[0]);const imageAttr=(tag,name)=>Number(tag.match(new RegExp(name+'="([0-9.]+)"'))?.[1]);const imageBoxes=imageTags.map(tag=>({left:imageAttr(tag,"left"),top:imageAttr(tag,"top"),width:imageAttr(tag,"width"),height:imageAttr(tag,"height")})).filter(box=>Object.values(box).every(Number.isFinite));const outOfBoundsImages=imageBoxes.filter(box=>box.left<safeX-1||box.top<safeY-1||box.left+box.width>xmlWidth-safeX+1||box.top+box.height>xmlHeight-safeY+1);if(expected.logoPresent&&expected.qrPresent)assert.ok(imageBoxes.length>=2,"PDF image bounding boxes missing or incomplete: "+imageBoxes.length);assert.equal(outOfBoundsImages.length,0,"Image outside 3mm safe area: "+JSON.stringify(outOfBoundsImages));
if(expected.qrDestination){const linkAnnotations=run("pdfinfo",["-url",pdf]);assert.ok(linkAnnotations.includes(expected.qrDestination),"Fresh PDF must preserve a clickable Google Maps link annotation");run("pdfimages",["-png",pdf,"artifacts/bill-pdf-image"]);const images=(await readdir("artifacts")).filter(name=>name.startsWith("bill-pdf-image-")&&name.endsWith(".png"));let decodedQr=null;for(const name of images){const decoded=spawnSync("zbarimg",["--quiet","--raw",resolve("artifacts",name)],{encoding:"utf8"});if(decoded.status===0&&decoded.stdout.trim())decodedQr=decoded.stdout.trim();}assert.equal(decodedQr,expected.qrDestination,"QR embedded in fresh PDF must decode to the exact authorized destination");}
assert.doesNotMatch(extracted,/[\u0980-\u09FF]/,"Printed bill must contain English-only text");
const report={result:"PASS",file:pdf,pages,rotationDegrees:rotation,metadataTitle,pageSizePoints:[width,height],mediaBoxPoints:mediaBox,cropBoxPoints:cropBox,expectedA6PortraitPoints:[expectedWidth,expectedHeight],geometryTolerancePt:0.1,fontTable:fonts,bengaliFontDependency:false,englishOnlyTextVerified:true,minimumFontSizePt:minFontSize,safeContentMarginMm:3,textBoundingBoxesChecked:textBoxes.length,outOfBoundsTextBoxes:outOfBounds.length,expectedContentVerified:required,embeddedRasterImageCount:imageRows.length,imageBoundingBoxes:imageBoxes,outOfBoundsImages,qrDecodedFromFreshPdf:expected.qrDestination||null,mapsLinkAnnotationVerified:expected.qrDestination?true:null};
await mkdir("artifacts",{recursive:true});await writeFile("artifacts/dokantools-a6-validation.json",JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
