# DokanTools — TypeScript Check Fixes

এই প্যাকেজে Windows-এ দেখা তিনটি TypeScript error সংশোধন করা হয়েছে।

1. `dashboard/baki/page.tsx`: `items_json` null/undefined হতে পারে—`Array.isArray` guard দিয়ে রেন্ডার করার আগে array যাচাই করা হয়।
2. `dashboard/stock/page.tsx`: Supabase RPC result-এর `data`-কে প্রত্যাশিত result shape-এ narrow করা হয়েছে; `result_stock_id` ব্যবহারের আগে nullable result যাচাই করা হয়।

## যাচাই

এই প্যাকেজে উৎস কোড পরিবর্তন করা হয়েছে। ZIP তৈরি করার আগে domain tests (`npm run test`) এবং SQL source check (`npm run verify:sql`) চালানো হয়েছে। পূর্ণ `tsc --noEmit`, Next.js build এবং live Supabase/PostgreSQL integration test চালানোর প্রমাণ না পাওয়া পর্যন্ত এগুলোকে pass বলা যাবে না।

## Windows-এ পরবর্তী ধাপ

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run verify:sql
npm.cmd run build
```
