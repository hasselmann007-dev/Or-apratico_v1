-- Schema SQL para o OrçaPrático SaaS

-- 1. TABELA DE PERFIS PROFISSIONAIS
create table if not exists public.perfis_profissionais (
  id uuid references auth.users on delete cascade primary key,
  nome text not null default 'Profissional',
  logo_url text,
  termos_padrao text default '1. Validade desta Proposta: Este orçamento é válido por 15 dias a partir da data de emissão.
2. Insumos e Materiais: Os materiais necessários para a execução dos serviços não estão inclusos neste valor, ficando sob responsabilidade do cliente, salvo disposição em contrário acordada previamente.
3. Serviços Extras: Qualquer serviço solicitado que não esteja explicitamente descrito neste documento demandará uma nova avaliação e orçamento complementar.',
  telefone text,
  documento text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
alter table public.perfis_profissionais enable row level security;

-- Políticas RLS para perfis_profissionais
create policy "Qualquer um pode ler perfis" on public.perfis_profissionais
  for select using (true);

create policy "Usuários autenticados podem inserir seu próprio perfil" on public.perfis_profissionais
  for insert with check (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.perfis_profissionais
  for update using (auth.uid() = id);


-- 2. TABELA DE ORÇAMENTOS
create table if not exists public.orcamentos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  numero_sequencial text, -- Gerado via trigger
  data text not null,
  cliente jsonb not null,
  itens jsonb not null,
  desconto numeric not null default 0,
  ajuste numeric not null default 0,
  observacoes text,
  status text not null default 'Rascunho',
  execution_term text,
  payment_terms text,
  total_amount numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
alter table public.orcamentos enable row level security;

-- Políticas RLS para orcamentos
create policy "Usuários podem ver apenas seus próprios orçamentos" on public.orcamentos
  for select using (auth.uid() = user_id);

create policy "Usuários podem criar seus próprios orçamentos" on public.orcamentos
  for insert with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios orçamentos" on public.orcamentos
  for update using (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios orçamentos" on public.orcamentos
  for delete using (auth.uid() = user_id);


-- 3. FUNÇÃO E TRIGGER PARA CRIAR PERFIL AUTOMÁTICO APÓS REGISTRO
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis_profissionais (id, nome, email)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'nome', 'Profissional'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 4. FUNÇÃO E TRIGGER PARA GERAR NÚMERO SEQUENCIAL (EX: 001/2026) POR USUÁRIO
create or replace function public.generate_next_quote_number()
returns trigger as $$
declare
  current_year text;
  next_seq integer;
begin
  current_year := extract(year from current_date)::text;
  
  -- Conta e pega o maior número daquele usuário no ano corrente
  select coalesce(max(substring(numero_sequencial from 1 for 3)::integer), 0) + 1
  into next_seq
  from public.orcamentos
  where user_id = new.user_id 
    and substring(numero_sequencial from 5 for 4) = current_year;

  -- Formata com preenchimento de zeros à esquerda (ex: 001/2026)
  new.numero_sequencial := lpad(next_seq::text, 3, '0') || '/' || current_year;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_generate_quote_number on public.orcamentos;
create trigger trigger_generate_quote_number
before insert on public.orcamentos
for each row
execute function public.generate_next_quote_number();


-- 5. BUCKET DE ARMAZENAMENTO PARA LOGOS
-- Obs: O bucket é criado via API ou painel, mas as políticas RLS podem ser definidas via SQL.
-- Garanta que o bucket 'logos-usuarios' exista antes de rodar os comandos abaixo se for em produção.
insert into storage.buckets (id, name, public)
values ('logos-usuarios', 'logos-usuarios', true)
on conflict (id) do nothing;

-- Políticas RLS para storage.objects (Bucket logos-usuarios)
create policy "Qualquer um pode ler as logos" on storage.objects
  for select using (bucket_id = 'logos-usuarios');

create policy "Usuários autenticados podem fazer upload de sua própria logo" on storage.objects
  for insert with check (
    bucket_id = 'logos-usuarios' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Usuários autenticados podem atualizar sua própria logo" on storage.objects
  for update using (
    bucket_id = 'logos-usuarios' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Usuários autenticados podem deletar sua própria logo" on storage.objects
  for delete using (
    bucket_id = 'logos-usuarios' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );
