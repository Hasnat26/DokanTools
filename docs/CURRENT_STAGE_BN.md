# DokanTools — বর্তমান উন্নয়ন পর্যায়

## পর্যায়

**Reliability Foundation / Pilot Preparation** — এটি এখনো production-ready release নয়। পুরোনো starter থেকে গুরুত্বপূর্ণ লেনদেনের কিছু ঝুঁকি কমানো হয়েছে; কিন্তু পূর্ণ MVP বা offline-ready অ্যাপ হিসেবে ঘোষণা করা যাবে না।

## এই ZIP-এ অন্তর্ভুক্ত পরিবর্তন

- মেমো ও স্টক হ্রাস একক PostgreSQL RPC-তে: কোনো stock guard ব্যর্থ হলে পুরো লেনদেন rollback হবে।
- মেমো, স্টক তৈরি, স্টক সংশোধন ও বাকি-খাতা এন্ট্রিতে request ID-ভিত্তিক idempotency.
- Opening stock, sale ও stock adjustment-এর জন্য stock movement ledger.
- মেমোতে বাকি থাকলে একই database transaction-এ customer due ledger-এও এন্ট্রি হবে; বাকি থাকলে customer নির্বাচন করতে হবে। রেকর্ডেড বকেয়ার চেয়ে বেশি জমা গ্রহণ করা হবে না।
- মেমো, বাকি/জমা, স্টক পরিবর্তন এবং product metadata পরিবর্তনের audit event.
- কাস্টমার/দোকান ডিলিট করে আর্থিক ইতিহাস cascade-এ মুছে ফেলার সরাসরি অনুমতি নেই। স্টক পণ্যের base unit পরিবর্তন এবং implicit unit conversion পাইলট সংস্করণে বন্ধ।
- দোকানদারের opt-in ছাড়া public shop page খোলা হবে না; product-ও আলাদাভাবে publish করতে হবে।
- public page থেকে গ্রাহকের নাম/ফোন, বাকি, মেমো ও exact stock quantity আড়াল করা হয়েছে। ফোন নম্বর-নির্ভর public due lookup বাদ দেওয়া হয়েছে।
- মূল্য ও ব্যবহারসীমার যাচাইহীন বিজ্ঞাপন সরানো হয়েছে।
- Dependency-free domain unit tests এবং স্থানীয় microbenchmark যোগ করা হয়েছে।

## এখনো অসম্পূর্ণ

1. Offline transaction outbox, retry queue, sync-status UI, conflict-resolution এবং multi-device synchronization.
2. পূর্ণ purchase/payment/cash/expense ledger ও দৈনিক closing.
3. memo-sale-এর cash/payment-method ledger ও manual due-entry-র duplicate prevention/linked settlement flow.
4. explicit package/base-unit conversion rules (বর্তমানে mismatch হলে transaction fail-closed হয়)।
5. Supabase staging database-এ RLS, RPC, migration, backup/restore এবং দুই-tenant isolation পরীক্ষা.
6. সম্পূর্ণ Next.js production build, browser E2E ও authenticated performance/load test.
7. Actual hosted deployment/commit ও live pilot acceptance.

## পাইলটের সিদ্ধান্ত-নিয়ম

- পরিকল্পিত প্রথম pilot: ১৪ দিন; প্রমাণ অসম্পূর্ণ হলে বাড়বে।
- প্রথমে একটি সহযোগিতাপ্রবণ ছোট দোকান; পরের দল মাত্র ২–৩টি দোকান, আগের দলের প্রমাণ পর্যালোচনার পরে।
- গুরুতর ডেটা বিচ্ছিন্নতা, ডুপ্লিকেট, stock/accounting, payment/due বা recovery test-এ কোনো অমীমাংসিত ব্যর্থতা গ্রহণযোগ্য নয়।
- প্রযুক্তিগত গ্রহণযোগ্যতা ডেভেলপার/QA, হিসাব মিল দোকানদার বা অনুমোদিত প্রতিনিধি, এবং চূড়ান্ত go/no-go প্রকল্প দায়িত্বপ্রাপ্ত ব্যক্তি অনুমোদন করবেন।
- নিরাপত্তা/হিসাবের গুরুতর সমস্যা হলে প্রভাবিত কাজ সীমিত বা pilot স্থগিত করতে হবে।

## প্রযুক্তিগত caveat

এই পরিবেশে npm registry-তে DNS/network failure হওয়ায় dependency install সম্পন্ন হয়নি। তাই Next.js build/lint এবং live Supabase/SQL runtime execution যাচাই করা যায়নি। এর পরিবর্তে Node.js core tests, SQL static check, TypeScript/TSX syntax parsing, archive integrity ও local CPU-only benchmark চালানো হবে। এই ফল database concurrency বা hosted performance-এর বিকল্প নয়।
