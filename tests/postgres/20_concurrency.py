#!/usr/bin/env python3
import concurrent.futures, os, subprocess
DB=os.environ["DB_URL"]
USER="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
SHOP=USER
PAYLOAD='{"header":{"shopName":"Shop A","shopAddress":"Address A","shopPhone":"+8801700000001","mapUrl":"https://maps.google.com/maps?q=shop-a"},"lines":[{"catalogItemId":null,"itemName":"Concurrent Tea","unit":"cup","quantity":"1","unitPrice":"12.00"}]}'
def call(request_id):
 sql=f"""set role authenticated; set request.jwt.claim.sub='{USER}';
 select result_invoice_id::text||'|'||result_bill_number::text||'|'||result_was_replay::text
 from public.create_invoice_transaction('{SHOP}','invoice-create/v1','{request_id}','{PAYLOAD}'::jsonb);"""
 p=subprocess.run(["psql",DB,"-X","-A","-t","-q","-v","ON_ERROR_STOP=1","-c",sql],text=True,capture_output=True)
 if p.returncode: raise RuntimeError(p.stderr)
 return p.stdout.strip().splitlines()[-1]
ids=[f"30000000-0000-4000-8000-{i:012d}" for i in range(1,21)]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool: rows=list(pool.map(call,ids))
numbers=sorted(int(x.split("|")[1]) for x in rows)
if len(set(numbers))!=20 or numbers!=list(range(2,22)): raise SystemExit(f"distinct request numbering failed: {numbers}")
same="40000000-0000-4000-8000-000000000001"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: retries=list(pool.map(lambda _:call(same),range(2)))
parts=[x.split("|") for x in retries]
if len({x[0] for x in parts})!=1 or len({x[1] for x in parts})!=1 or {x[2] for x in parts}!={"true","false"}: raise SystemExit(f"concurrent replay failed: {retries}")
verify=f"select count(*) from public.invoice_idempotency where idempotency_namespace='invoice-create/v1' and request_id='{same}';"
p=subprocess.run(["psql",DB,"-X","-A","-t","-q","-v","ON_ERROR_STOP=1","-c",verify],text=True,capture_output=True)
if p.returncode or p.stdout.strip()!="1": raise SystemExit("expected one idempotency row: "+p.stdout+p.stderr)
print("PASS: 20 concurrent distinct requests received contiguous bill numbers 2..21.")
print("PASS: 2 concurrent identical requests returned same invoice; exactly one replay and one registry row.")
