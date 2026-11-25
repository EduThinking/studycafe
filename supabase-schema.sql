-- =============================================================
--  제이 스터디 카페 · Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 한 번 실행하세요.
-- =============================================================
--  실시간 참가자 위치·좌석·공부 시간은 Realtime Presence 로,
--  채팅과 이모지 반응은 Realtime Broadcast 로 오갑니다(테이블 불필요).
--  아래 테이블은 "남겨 두어야 하는 기록"만 저장합니다.
--   1) chat_messages    : 채팅 기록(새로 입장한 사람이 최근 대화를 봄)
--   2) attendance_logs  : 키오스크 출석·퇴장 기록
-- =============================================================

-- ---------- 1. 채팅 기록 ----------
create table if not exists public.chat_messages (
  id          bigserial primary key,
  nickname    text        not null check (char_length(nickname) between 1 and 24),
  body        text        not null check (char_length(body) between 1 and 300),
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

-- ---------- 2. 출석·퇴장 기록 ----------
create table if not exists public.attendance_logs (
  id           bigserial primary key,
  nickname     text        not null check (char_length(nickname) between 1 and 24),
  round        int         not null check (round between 1 and 10),
  kind         text        not null check (kind in ('in', 'out')),
  recorded_at  timestamptz not null default now()
);

create index if not exists attendance_logs_nickname_time_idx
  on public.attendance_logs (nickname, recorded_at desc);

-- 같은 사람이 같은 회차에 같은 종류를 두 번 찍지 못하게 (선택)
create unique index if not exists attendance_logs_unique_stamp
  on public.attendance_logs (nickname, round, kind, ((recorded_at at time zone 'Asia/Seoul')::date));

-- ---------- 3. RLS (행 수준 보안) ----------
alter table public.chat_messages   enable row level security;
alter table public.attendance_logs enable row level security;

-- 누구나 읽기 (로그인 없는 카페이므로 anon 역할 허용)
drop policy if exists "chat read for all"   on public.chat_messages;
drop policy if exists "chat insert for all" on public.chat_messages;
drop policy if exists "att read for all"    on public.attendance_logs;
drop policy if exists "att insert for all"  on public.attendance_logs;

create policy "chat read for all"
  on public.chat_messages for select
  to anon, authenticated
  using (true);

create policy "chat insert for all"
  on public.chat_messages for insert
  to anon, authenticated
  with check (true);

create policy "att read for all"
  on public.attendance_logs for select
  to anon, authenticated
  using (true);

create policy "att insert for all"
  on public.attendance_logs for insert
  to anon, authenticated
  with check (true);

-- 수정·삭제 정책은 만들지 않습니다. (기록은 덧붙이기만 가능)

-- ---------- 3-1. 테이블 권한 ----------
-- RLS 정책이 있어도 역할(anon)에 테이블 권한이 없으면
-- 401 "permission denied for table ..." 가 납니다. 함께 열어 둡니다.
grant usage on schema public to anon, authenticated;
grant select, insert on public.chat_messages   to anon, authenticated;
grant select, insert on public.attendance_logs to anon, authenticated;
grant usage, select on sequence public.chat_messages_id_seq   to anon, authenticated;
grant usage, select on sequence public.attendance_logs_id_seq to anon, authenticated;

-- ---------- 4. Realtime ----------
-- Broadcast/Presence 는 테이블 설정 없이 동작합니다.
-- chat_messages 를 postgres_changes 로도 구독하고 싶다면 아래 주석을 해제하세요.
-- alter publication supabase_realtime add table public.chat_messages;

-- ---------- 5. 오래된 기록 정리 (선택) ----------
-- 90일이 지난 채팅을 지우는 함수. pg_cron 이 있으면 아래처럼 예약할 수 있습니다.
create or replace function public.cleanup_old_cafe_data()
returns void
language sql
security definer
as $$
  delete from public.chat_messages   where created_at  < now() - interval '90 days';
  delete from public.attendance_logs where recorded_at < now() - interval '365 days';
$$;

-- select cron.schedule('cleanup-cafe', '0 4 * * *', 'select public.cleanup_old_cafe_data()');

-- =============================================================
--  끝. 이제 config.js 의 supabase.url / supabase.anonKey 를 채우면
--  앱이 자동으로 실시간 모드로 전환됩니다.
-- =============================================================
