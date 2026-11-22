import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
const baseURL=process.env.DOKANTOOLS_QA_URL,email=process.env.DOKANTOOLS_QA_EMAIL,password=process.env.DOKANTOOLS_QA_PASSWORD;
const pdfPath=process.env.DOKANTOOLS_A6_PDF_OUTPUT||"artifacts/dokantools-authenticated-a6.pdf";
const shopName="DokanTools QA Grocery & Stationery",categoryName="QA Category",renamedCategory="QA Category Edited";
const mapUrl="https://maps.google.com/?q=23.7806,90.4142";let shopPublicPath="";
async function pngBuffer(page,color){const base64=await page.evaluate(color=>{const canvas=document.createElement("canvas");canvas.width=96;canvas.height=72;const context=canvas.getContext("2d");context.fillStyle="#fff";context.fillRect(0,0,canvas.width,canvas.height);context.strokeStyle="#111";context.lineWidth=4;context.strokeRect(2,2,92,68);context.beginPath();context.arc(34,36,25,0,Math.PI*2);context.fillStyle=color;context.fill();context.fillStyle="#fff";context.font="bold 18px Arial";context.textAlign="center";context.fillText("QA",34,42);context.fillStyle="#111";context.font="bold 11px Arial";context.fillText("DOKAN",68,33);context.font="9px Arial";context.fillText("SHOP",68,46);return canvas.toDataURL("image/png").split(",")[1];},color);return Buffer.from(base64,"base64");}
async function decodeBillQr(page,path){await mkdir(dirname(path),{recursive:true});const section=page.locator(".memo-print");await section.evaluate(el=>{el.style.visibility="visible";el.style.position="static";el.style.left="auto";el.style.top="auto";el.style.width="98mm";el.style.height="auto";el.style.overflow="visible";});const qr=page.getByTestId("shop-bill-qr");await qr.evaluate(el=>{el.style.width="240px";el.style.height="240px";});await qr.screenshot({path});const payload=execFileSync("zbarimg",["--quiet","--raw",path],{encoding:"utf8"}).trim();await section.evaluate(el=>{el.removeAttribute("style");el.querySelector("[data-testid=shop-bill-qr]")?.removeAttribute("style");});return payload;}

const firstProduct="QA Product Edited",secondProduct="QA Product Two";
test.use({trace:"retain-on-failure",screenshot:"only-on-failure",video:"retain-on-failure"});
if(!baseURL||!email||!password)throw new Error("CH4_CONFIGURATION_ERROR: browser QA credentials and URL are mandatory.");
test("authenticated configurable multi-product bill, IndexedDB lifecycle and fresh A6 PDF",async({page})=>{
 test.setTimeout(180000);
 const diagnostics=[];
 const categoryRegion=page.getByRole("region",{name:"ক্যাটাগরি ব্যবস্থাপনা"});
 page.on("console",message=>{if(message.type()==="error")diagnostics.push({type:"console",text:message.text()});});
 page.on("pageerror",error=>diagnostics.push({type:"pageerror",text:error.message}));
 page.on("requestfailed",request=>diagnostics.push({type:"requestfailed",url:request.url(),error:request.failure()?.errorText}));
 const total=(name,value)=>expect(page.getByTestId(name)).toHaveText(name==="discount"?`− BDT ${value}`:`BDT ${value}`);
 try{
  await test.step("1. Authenticate synthetic owner",async()=>{
   await page.goto(new URL("/login",baseURL).toString());
   await page.locator('input[type="email"]').fill(email);await page.locator('input[type="password"]').fill(password);
   await page.getByRole("button",{name:"লগইন"}).click();
   await expect(page).toHaveURL(/\/dashboard(?:$|[/?#])/);await expect(page.getByRole("heading",{name:"আপনার দোকান তৈরি করুন"})).toBeVisible();
  });
  await test.step("2. Shop Profile create/edit/reload, logo lifecycle, Maps validation and QR authorization",async()=>{
   await page.getByLabel("দোকানের নাম *").fill(shopName);await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner");await page.getByLabel("দোকানের ফোন").fill("01000000000");await page.getByLabel("ঠিকানা").fill("Shop 7, Ground Floor, Road 12, Block C, Gulshan-1, Dhaka 1212, Bangladesh");
   const mapInput=page.getByLabel("Google Maps লিংক");await mapInput.fill("https://maps.example.invalid/shop");await page.getByRole("button",{name:"দোকান তৈরি করুন"}).click();await expect(page.getByText("Enter a valid Google Maps URL.",{exact:true})).toBeVisible();
   await mapInput.fill(mapUrl);await page.getByRole("button",{name:"দোকান তৈরি করুন"}).click();await expect(page.getByRole("heading",{name:shopName})).toBeVisible();shopPublicPath=await page.locator('a[href^="/shop/"]').first().getAttribute("href");
   await page.getByRole("button",{name:"তথ্য সম্পাদনা"}).click();await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute("src",/^data:image\/svg\+xml/);const upload=page.getByLabel("Shop logo upload");
   await upload.setInputFiles({name:"logo-original.png",mimeType:"image/png",buffer:await pngBuffer(page,"#222222")});await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute("src",/^data:image\/png;base64,/);const firstLogo=await page.getByTestId("shop-logo-preview").getAttribute("src");
   await upload.setInputFiles({name:"logo-replacement.png",mimeType:"image/png",buffer:await pngBuffer(page,"#555555")});await expect(page.getByTestId("shop-logo-preview")).not.toHaveAttribute("src",firstLogo);
   await page.getByRole("button",{name:"Remove uploaded logo"}).click();await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute("src",/^data:image\/svg\+xml/);
   await page.getByLabel("মালিকের নাম").fill("Synthetic QA Owner Edited");await page.getByRole("button",{name:"পরিবর্তন সংরক্ষণ"}).click();await expect(page.getByText("Synthetic QA Owner Edited")).toBeVisible();await page.reload();await expect(page.getByRole("heading",{name:shopName})).toBeVisible();
   await page.goto(new URL("/dashboard/draft-memo",baseURL).toString());await expect(page.getByTestId("bill-shop-logo")).toHaveAttribute("src",/^data:image\/svg\+xml/);
   await page.goto(new URL("/dashboard",baseURL).toString());await page.getByRole("button",{name:"তথ্য সম্পাদনা"}).click();await expect(page.getByLabel("Google Maps লিংক")).toHaveValue(mapUrl);await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute("src",/^data:image\/svg\+xml/);
   await page.getByLabel("Shop logo upload").setInputFiles({name:"logo-final.png",mimeType:"image/png",buffer:await pngBuffer(page,"#333333")});await page.getByRole("button",{name:"পরিবর্তন সংরক্ষণ"}).click();await page.reload();await expect(page.getByRole("heading",{name:shopName})).toBeVisible();
   await page.getByRole("button",{name:"তথ্য সম্পাদনা"}).click();await expect(page.getByLabel("Google Maps লিংক")).toHaveValue(mapUrl);await expect(page.getByTestId("shop-logo-preview")).toHaveAttribute("src",/^data:image\/png;base64,/);await page.getByRole("button",{name:"বাতিল"}).click();
   await page.getByRole("button",{name:"তথ্য সম্পাদনা"}).click();await page.getByLabel("Google Maps লিংক").fill("");await page.getByRole("button",{name:"পরিবর্তন সংরক্ষণ"}).click();await page.getByRole("button",{name:"পাবলিক পেজ প্রকাশ করুন"}).click();
   await page.goto(new URL("/dashboard/draft-memo",baseURL).toString());await expect(page.getByTestId("shop-bill-qr")).toBeAttached();const publicPayload=await decodeBillQr(page,"artifacts/shop-public-profile-qr.png");expect(shopPublicPath).toBeTruthy();expect(publicPayload).toBe(new URL(shopPublicPath,baseURL).toString());
   await page.goto(new URL("/dashboard",baseURL).toString());await page.getByRole("button",{name:"পাবলিক পেজ বন্ধ করুন"}).click();await page.goto(new URL("/dashboard/draft-memo",baseURL).toString());await expect(page.getByTestId("shop-bill-qr")).toHaveCount(0);
   await page.goto(new URL("/dashboard",baseURL).toString());await page.getByRole("button",{name:"তথ্য সম্পাদনা"}).click();await page.getByLabel("Google Maps লিংক").fill(mapUrl);await page.getByRole("button",{name:"পরিবর্তন সংরক্ষণ"}).click();
  });
  let selectedCategoryId="";
  await test.step("3. Category create, rename, persistence and two product CRUD/association",async()=>{
   await page.goto(new URL("/dashboard/catalog",baseURL).toString());await expect(page.getByRole("heading",{name:"পণ্য ও ক্যাটাগরি"})).toBeVisible();
   const categoryInput=page.getByPlaceholder("নতুন ক্যাটাগরির নাম");await categoryInput.fill(categoryName);
   await page.getByRole("button",{name:"ক্যাটাগরি যোগ করুন"}).click();await expect(categoryRegion.getByRole("button",{name:`${categoryName} rename`})).toBeVisible();
   page.once("dialog",dialog=>dialog.accept(renamedCategory));await categoryRegion.getByRole("button",{name:`${categoryName} rename`}).click();
   await expect(categoryRegion.getByRole("button",{name:`${renamedCategory} rename`})).toBeVisible();await page.reload();
   await expect(categoryRegion.getByRole("button",{name:`${renamedCategory} rename`})).toBeVisible();
   const form=page.getByRole("form",{name:"পণ্য তৈরি"}),categorySelect=form.getByLabel("ক্যাটাগরি");
   await form.getByLabel("নতুন পণ্যের নাম").fill("QA Product");await categorySelect.selectOption({label:renamedCategory});selectedCategoryId=await categorySelect.inputValue();
   await form.getByLabel("ইউনিট").fill("pcs");await form.getByLabel("ক্রয়মূল্য",{exact:true}).fill("8.00");await form.getByLabel("বিক্রয়মূল্য",{exact:true}).fill("12.50");
   await form.getByRole("button",{name:"Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)"}).click();
   let inputs=page.getByLabel("পণ্যের নাম",{exact:true});await expect(inputs).toHaveCount(1);
   let row=inputs.nth(0).locator("xpath=../..");await row.getByLabel("পণ্যের নাম",{exact:true}).fill(firstProduct);await row.getByRole("button",{name:"সেভ"}).click();
   await form.getByLabel("নতুন পণ্যের নাম").fill(secondProduct);await categorySelect.selectOption({label:renamedCategory});
   await form.getByLabel("ইউনিট").fill("pcs");await form.getByLabel("ক্রয়মূল্য",{exact:true}).fill("2.00");await form.getByLabel("বিক্রয়মূল্য",{exact:true}).fill("4.25");
   await form.getByRole("button",{name:"Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)"}).click();
   inputs=page.getByLabel("পণ্যের নাম",{exact:true});await expect(inputs).toHaveCount(2);
   row=inputs.nth(1).locator("xpath=../..");await expect(row.getByLabel("ক্যাটাগরি",{exact:true})).toHaveValue(selectedCategoryId);
   await page.reload();await expect(categoryRegion.getByRole("button",{name:`${renamedCategory} rename`})).toBeVisible();
   inputs=page.getByLabel("পণ্যের নাম",{exact:true});await expect(inputs).toHaveCount(2);
   await expect(inputs.nth(0)).toHaveValue(firstProduct);await expect(inputs.nth(1)).toHaveValue(secondProduct);
   await expect(inputs.nth(0).locator("xpath=../..").getByLabel("ক্যাটাগরি",{exact:true})).toHaveValue(selectedCategoryId);
   await expect(inputs.nth(1).locator("xpath=../..").getByLabel("ক্যাটাগরি",{exact:true})).toHaveValue(selectedCategoryId);
  });
  await test.step("4. Multi-product calculation and optional discount/tax/paid/due",async()=>{
   await page.goto(new URL("/dashboard/draft-memo",baseURL).toString());await expect(page.getByRole("heading",{name:"Bill / Memo · A6"})).toBeVisible();
   const select=page.getByLabel("Add catalogue product");const opts=select.locator("option");
   const firstId=await opts.filter({hasText:firstProduct}).getAttribute("value");const secondId=await opts.filter({hasText:secondProduct}).getAttribute("value");
   expect(firstId).toBeTruthy();expect(secondId).toBeTruthy();
   await select.selectOption(firstId);await select.selectOption(secondId);
   await expect(page.getByTestId("bill-line")).toHaveCount(2);
   await page.getByLabel("Quantity").nth(0).fill("2");await page.getByLabel("Unit price").nth(0).fill("12.50");
   await page.getByLabel("Quantity").nth(1).fill("2");await page.getByLabel("Unit price").nth(1).fill("4.25");
   await total("subtotal","33.50");await total("grand-total","33.50");
   await expect(page.getByLabel("Discount amount")).toHaveCount(0);await expect(page.getByLabel("Tax rate")).toHaveCount(0);await expect(page.getByLabel("Amount paid")).toHaveCount(0);
   await page.getByLabel("Enable discount").check();await total("discount","0.00");
   await page.getByLabel("Discount amount").fill("0.00");await total("grand-total","33.50");
   await page.getByLabel("Discount amount").fill("33.50");
   await expect(page.getByText("A full-subtotal discount is not permitted on this bill.")).toBeVisible();
   await page.getByLabel("Discount amount").fill("99.00");await expect(page.getByText("Discount cannot exceed the subtotal.")).toBeVisible();
   await page.getByLabel("Discount amount").fill("1.00");await total("discount","1.00");await total("grand-total","32.50");
   await page.getByLabel("Enable discount").uncheck();await total("grand-total","33.50");await page.getByLabel("Enable discount").check();await total("discount","1.00");
   await page.getByLabel("Enable VAT or tax").check();await page.getByLabel("Tax rate").fill("0.00");await total("tax","0.00");await total("grand-total","32.50");
   await page.getByLabel("Tax rate").fill("-1");await expect(page.getByText("Tax rate must be non-negative and use up to 2 decimal places.")).toBeVisible();
   await page.getByLabel("Tax rate").fill("10.00");await total("tax","3.25");await total("grand-total","35.75");
   await page.getByLabel("Enable VAT or tax").uncheck();await total("grand-total","32.50");await page.getByLabel("Enable VAT or tax").check();await total("tax","3.25");
   await page.getByLabel("Enable paid and due").check();await page.getByLabel("Amount paid").fill("0.00");await total("paid","0.00");await total("due","35.75");
   await page.getByLabel("Amount paid").fill("99.00");await expect(page.getByText("Paid amount cannot exceed the grand total.")).toBeVisible();
   await page.getByLabel("Amount paid").fill("-1");await expect(page.getByText("Paid amount must be non-negative and use up to 2 decimal places.")).toBeVisible();
   await page.getByLabel("Amount paid").fill("20.00");await total("paid","20.00");await total("due","15.75");
   await page.getByLabel("Enable paid and due").uncheck();await total("grand-total","35.75");await page.getByLabel("Enable paid and due").check();await total("due","15.75");
   await page.getByLabel("Quantity").nth(0).fill("0");await expect(page.getByText("Quantity must be greater than zero and use up to 3 decimal places.")).toBeVisible();
   await page.getByLabel("Quantity").nth(0).fill("1.0001");await expect(page.getByText("Quantity must be greater than zero and use up to 3 decimal places.")).toBeVisible();
   await page.getByLabel("Quantity").nth(0).fill("2");
   await page.getByLabel("Unit price").nth(1).fill("-1");await expect(page.getByText("Unit price must be zero or greater and use up to 2 decimal places.")).toBeVisible();
   await page.getByLabel("Unit price").nth(1).fill("1.999");await expect(page.getByText("Unit price must be zero or greater and use up to 2 decimal places.")).toBeVisible();
   await page.getByLabel("Unit price").nth(1).fill("5.00");
   await page.getByLabel("Quantity").nth(0).fill("3");
   await total("subtotal","47.50");await total("discount","1.00");await total("tax","4.65");await total("grand-total","51.15");await total("paid","20.00");await total("due","31.15");
   await page.getByRole("button",{name:"Save / Update Draft"}).click();await expect(page.getByText("Draft saved locally.")).toBeVisible();
   await page.reload();await expect(page.getByText("2 products")).toBeVisible();await page.getByRole("button",{name:"Edit"}).click();
   await expect(page.getByLabel("Enable discount")).toBeChecked();await expect(page.getByLabel("Discount amount")).toHaveValue("1.00");
   await expect(page.getByLabel("Enable VAT or tax")).toBeChecked();await expect(page.getByLabel("Tax rate")).toHaveValue("10.00");
   await expect(page.getByLabel("Enable paid and due")).toBeChecked();await expect(page.getByLabel("Amount paid")).toHaveValue("20.00");
   await expect(page.getByLabel("Quantity").nth(0)).toHaveValue("3");await expect(page.getByLabel("Unit price").nth(1)).toHaveValue("5.00");
   await total("subtotal","47.50");await total("grand-total","51.15");await total("due","31.15");
   await page.getByRole("button",{name:"Save / Update Draft"}).click();await expect(page.getByText("Draft saved locally.")).toBeVisible();
   await page.reload();await page.getByRole("button",{name:"Edit"}).click();await total("grand-total","51.15");await total("due","31.15");
  });
  await test.step("5. Verify centered identity hierarchy, logo, Maps link and decoded QR",async()=>{
   await expect(page.getByTestId("bill-shop-logo")).toHaveAttribute("src",/^data:image\/png;base64,/);await expect(page.getByTestId("bill-shop-name")).toHaveText(shopName);
   const typography=await page.locator(".shop-identity").evaluate(header=>({alignment:getComputedStyle(header).textAlign,nameWeight:getComputedStyle(header.querySelector("h1")).fontWeight,otherWeight:getComputedStyle(header.querySelector("p")).fontWeight}));
   const billTitleAlignment=await page.locator(".memo-print h2").evaluate(title=>getComputedStyle(title).textAlign);
   expect(typography.alignment).toBe("center");expect(Number(typography.nameWeight)).toBeGreaterThanOrEqual(600);expect(Number(typography.otherWeight)).toBeLessThanOrEqual(400);expect(billTitleAlignment).toBe("center");
   await expect(page.locator(".shop-map a")).toHaveAttribute("href",mapUrl);await expect(page.getByTestId("shop-bill-qr")).toBeAttached();const decoded=await decodeBillQr(page,"artifacts/shop-map-qr.png");expect(decoded).toBe(mapUrl);
  });
  await test.step("6. Invoke application print handler and generate fresh A6 PDF",async()=>{
   await page.evaluate(()=>{window.__dokantoolsPrintCalled=false;window.print=()=>{window.__dokantoolsPrintCalled=true;};});
   await page.getByRole("button",{name:"Generate A6 PDF / Print"}).click();
   await expect.poll(()=>page.evaluate(()=>window.__dokantoolsPrintCalled),{timeout:10000}).toBe(true);
   await mkdir(dirname(pdfPath),{recursive:true});await page.emulateMedia({media:"screen"});await page.locator(".memo-print").evaluate(el=>{el.style.visibility="visible";el.style.position="static";el.style.left="auto";el.style.top="auto";el.style.width="98mm";el.style.height="auto";el.style.overflow="visible";});await page.locator(".memo-print").screenshot({path:"artifacts/dokantools-bill-header.png"});await page.locator(".memo-print").evaluate(el=>el.removeAttribute("style"));await page.emulateMedia({media:"print"});
   await page.pdf({path:pdfPath,printBackground:true,width:"105mm",height:"148mm",preferCSSPageSize:false,scale:1});await page.emulateMedia({media:"screen"});
   await writeFile("artifacts/dokantools-a6-expectations.json",JSON.stringify({
    shopName,ownerName:"Synthetic QA Owner Edited",address:"Shop 7, Ground Floor, Road 12, Block C, Gulshan-1, Dhaka 1212, Bangladesh",phone:"01000000000",mapsCaption:"Google Maps location",qrCaption:"Scan for shop location",qrDestination:mapUrl,logoPresent:true,qrPresent:true,lines:[
     {productName:firstProduct,quantity:"3",unit:"pcs",unitPrice:"12.50",lineTotal:"37.50"},
     {productName:secondProduct,quantity:"2",unit:"pcs",unitPrice:"5.00",lineTotal:"10.00"}
    ],subtotal:"47.50",discount:"1.00",taxRate:"10.00",tax:"4.65",grandTotal:"51.15",paid:"20.00",due:"31.15",
    discountEnabled:true,taxEnabled:true,paidEnabled:true,currency:"BDT"
   },null,2));
  });
  await test.step("7. Delete saved draft, category and both products",async()=>{
   page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Delete"}).click();await expect(page.getByText("No drafts saved.")).toBeVisible();
   await page.goto(new URL("/dashboard/catalog",baseURL).toString());let inputs=page.getByLabel("পণ্যের নাম",{exact:true});await expect(inputs).toHaveCount(2);
   page.once("dialog",dialog=>dialog.accept());await categoryRegion.getByRole("button",{name:`${renamedCategory} delete`}).click();
   await expect(categoryRegion.getByRole("button",{name:`${renamedCategory} rename`})).toHaveCount(0);
   inputs=page.getByLabel("পণ্যের নাম",{exact:true});await expect(inputs.nth(0).locator("xpath=../..").getByLabel("ক্যাটাগরি",{exact:true})).toHaveValue("");
   for(let i=1;i>=0;i--){const row=page.getByLabel("পণ্যের নাম",{exact:true}).nth(i).locator("xpath=../..");page.once("dialog",dialog=>dialog.accept());await row.getByRole("button",{name:"মুছুন"}).click();}
   await expect(page.getByLabel("পণ্যের নাম",{exact:true})).toHaveCount(0);
  });
  await page.goto(new URL("/dashboard/stock",baseURL).toString());
  await expect(page.getByRole("heading",{name:"ইনভেন্টরি ও পণ্য তালিকা"})).toBeVisible();
  await expect(page.getByText("কম স্টক: ৫ ইউনিটের কম")).toBeVisible();
 }catch(error){
  const body=await page.locator("body").innerText().catch(()=>"Unable to read page body");
  await test.info().attach("browser-diagnostics.json",{body:JSON.stringify({url:page.url(),title:await page.title().catch(()=>""),body,diagnostics},null,2),contentType:"application/json"});throw error;
 }
});
