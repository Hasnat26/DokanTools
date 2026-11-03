# Lint ও code-quality সংশোধন — 2026-10-19

এই সম্পূর্ণ ZIP-এ নিচের source/config পরিবর্তনগুলো আগেই একত্রিত আছে; আলাদা patch প্রয়োগ করবেন না।

- Dashboard, Baki, Memo, Stock ও public shop page-এর explicit TypeScript types যোগ করা হয়েছে; `any` সরানো হয়েছে।
- `catch` error-কে `unknown` হিসেবে যাচাই করে পড়া হয়েছে।
- Dashboard/Baki/Memo/Stock পেজে `useCallback` ও `useEffect` dependency স্থিতিশীল করা হয়েছে।
- Dashboard-এর dynamic form-field access type-safe করা হয়েছে এবং unused code পরিষ্কার করা হয়েছে।
- `<img>`-এর স্থানে `next/image` ব্যবহার করা হয়েছে, যেখানে প্রয়োজন `unoptimized` রেখে data URL compatibility বজায় আছে।
- `lint` script Next.js-এর deprecated `next lint`-এর বদলে ESLint CLI ব্যবহার করে।
- `typecheck` এবং `verify` script যুক্ত করা হয়েছে।

এই সংশোধনগুলো package-backed lint ও Next build-এ পাস করেছে—এ দাবি করা হচ্ছে না। প্রথমে `npm.cmd run lint`, তারপর `npm.cmd run typecheck` ও `npm.cmd run build` চালিয়ে নিশ্চিত করতে হবে।
