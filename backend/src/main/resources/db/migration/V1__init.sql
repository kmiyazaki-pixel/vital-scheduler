create table if not exists departments (
  id bigserial primary key,
  name varchar(100) not null unique
);

create table if not exists users (
  id bigserial primary key,
  name varchar(100) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'member',
  department_id bigint references departments(id),
  is_active boolean not null default true
);

create table if not exists calendars (
  id bigserial primary key,
  name varchar(100) not null,
  type varchar(20) not null,
  owner_user_id bigint references users(id),
  department_id bigint references departments(id),
  is_active boolean not null default true
);

create table if not exists events (
  id bigserial primary key,
  calendar_id bigint not null references calendars(id) on delete cascade,
  title varchar(200) not null,
  category varchar(30) not null,
  memo text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_all_day boolean not null default false
);

insert into departments (id, name) values (1, '開発部') on conflict do nothing;
insert into users (id, name, email, password_hash, role, department_id, is_active)
values (1, '山田太郎', 'yamada@vital-area.co.jp', '{noop}password', 'admin', 1, true)
on conflict do nothing;
insert into calendars (id, name, type, owner_user_id, department_id, is_active)
values
  (1, '自分', 'personal', 1, 1, true),
  (2, '開発部', 'department', 1, 1, true),
  (3, '全社', 'company', 1, 1, true)
on conflict do nothing;
insert into events (calendar_id, title, category, memo, start_at, end_at, is_all_day)
values
  (1, '朝会', 'meeting', '', '2026-03-25T09:00:00+09:00', '2026-03-25T10:00:00+09:00', false),
  (1, '機能開発', 'work', 'Next.js移行', '2026-03-25T10:00:00+09:00', '2026-03-25T12:00:00+09:00', false),
  (2, 'コードレビュー', 'review', 'Spring Boot API確認', '2026-03-26T14:00:00+09:00', '2026-03-26T15:00:00+09:00', false)
on conflict do nothing;
