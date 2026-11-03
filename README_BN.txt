DokanTools Tailwind Fix

সমস্যা:
Build-এ `focus:ring-brand-100` class পাওয়া যাচ্ছিল না, কারণ Tailwind config-এ brand-এর 100 shade সংজ্ঞায়িত ছিল না।

প্রয়োগ:
1. এই ZIP Extract All করুন।
2. ভিতরের `tailwind.config.ts` কপি করুন আপনার প্রজেক্টের root-এ:
   C:\Users\BDABHAS\Downloads\DokanTools_Full_Restart_2026-10-19\dokantools\tailwind.config.ts
3. Replace করতে বললে Yes দিন। `src`, `package.json`, `package-lock.json`, `.env.local` বা `node_modules` মুছবেন না।
4. PowerShell-এ প্রজেক্ট root থেকে চালান:
   npm.cmd run build

এই patch শুধু Tailwind palette-এ brand 100 রং যোগ করে। এটি কোনো live DB বা অন্য ফাইল পরিবর্তন করে না।
