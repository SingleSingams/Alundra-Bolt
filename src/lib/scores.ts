// Supabase scores table schema (run once in the Supabase SQL editor):
//
// create table scores (
//   id bigserial primary key,
//   name text not null check (char_length(name) between 1 and 10),
//   level int not null,
//   xp int not null,
//   zone text not null,
//   created_at timestamptz default now()
// );
// alter table scores enable row level security;
// create policy "anon insert" on scores for insert to anon with check (true);
// create policy "anon select" on scores for select to anon using (true);

import { supabase } from './supabase';

export interface Score {
  id: number;
  name: string;
  level: number;
  xp: number;
  zone: string;
  created_at: string;
}

export interface ScoreInput {
  name: string;
  level: number;
  xp: number;
  zone: string;
}

export async function submitScore(input: ScoreInput): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('scores').insert(input);
  return !error;
}

export async function fetchTopScores(limit = 10): Promise<Score[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('scores')
    .select('id, name, level, xp, zone, created_at')
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit);
  return error ? [] : (data as Score[]);
}

export const supabaseConfigured = supabase !== null;
