# DokanTools — নতুন করে শুরু করার নির্দেশিকা (Windows)

এই ZIP-এ **সম্পূর্ণ প্রজেক্ট** আছে—এটি patch ZIP নয়। আলাদা patch বা পুরোনো ফাইল merge করার দরকার নেই।

## 1. Extract

1. ZIP-এর উপর Right-click → **Extract All...** → **Extract**।
2. Extract হওয়া ফোল্ডারে `dokantools` ফোল্ডার খুলুন।
3. সেখানে `package.json`, `README.md`, `src`, `supabase`, `tests` এবং `scripts` থাকা উচিত।
4. `dokantools` ফোল্ডারের ঠিকানা বারে ক্লিক করে `powershell` লিখে Enter চাপলে ওই ফোল্ডারেই PowerShell খুলবে। অথবা ওই ফোল্ডারের খালি জায়গায় Right-click → **Open in Terminal** করুন।

## 2. Versions যাচাই

```powershell
node --version
npm.cmd --version
```

Node.js 20 বা পরের সংস্করণ প্রয়োজন। PowerShell যদি `npm.ps1` চালানো আটকায়, `npm` নয়, **`npm.cmd`** ব্যবহার করুন। Execution Policy পরিবর্তনের দরকার নেই।

## 3. Packages ইনস্টল

```powershell
npm.cmd install
```

প্রথমবার package install করতে ইন্টারনেট লাগবে। কোনো vulnerability summary দেখালে সেটি নোট করুন; `npm audit fix --force` চালাবেন না। `package-lock.json` ইনস্টলের সময় তৈরি হবে।

## 4. পরীক্ষা—একটি করে

প্রথমে lint:

```powershell
npm.cmd run lint
```

তারপর TypeScript:

```powershell
npm.cmd run typecheck
```

তারপর domain tests ও static SQL checks:

```powershell
npm.cmd run test
npm.cmd run verify:sql
npm.cmd run perf
```

সবগুলো আলাদাভাবে সফল হলে production build:

```powershell
npm.cmd run build
```

`npm.cmd run verify` সব পরীক্ষা একসঙ্গে চালায়, কিন্তু ধাপে ধাপে প্রথমবার চালালে কোন পর্যায়ে সমস্যা হচ্ছে তা বোঝা সহজ। প্রথম ব্যর্থ কমান্ডের পুরো output সংরক্ষণ করুন।

## 5. App চালানোর আগে

- `.env.local.example`-কে `.env.local` নামে কপি করে Supabase URL এবং **public anon key** বসাতে হবে। Placeholder রেখে app চালালে database-backed feature কাজ করবে না।
- Supabase SQL শুধুমাত্র **নতুন/পরীক্ষামূলক staging project**-এ, migration history যাচাই করে চালাবেন। বিদ্যমান database-এ `schema.sql` অন্ধভাবে পুনরায় চালাবেন না।
- `service_role` key কখনো `NEXT_PUBLIC_...` ভ্যারিয়েবলে বা browser code-এ দেবেন না।
- একই দোকানের বাস্তব আর্থিক রেকর্ডের আগে দুইটি আলাদা test shop দিয়ে RLS, duplicate retry, insufficient stock rollback, due/payment এবং backup/restore পরীক্ষা করতে হবে।

## Pilot status

এটি reliability-foundation/pilot-preparation build; production-ready নয়। পূর্ণ offline transaction queue ও sync conflict resolution, complete purchase/cash/payment ledger, live PostgreSQL/Supabase integration, browser end-to-end tests এবং staging load/concurrency tests এখনও সম্পন্ন হওয়ার প্রমাণ নেই। Local microbenchmark-কে production throughput হিসেবে ধরবেন না।
