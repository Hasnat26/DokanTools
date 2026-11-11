-- Minimal Supabase Auth compatibility shim for a disposable local PostgreSQL test DB.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
