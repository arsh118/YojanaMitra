// pages/api/match.js
const fs = require('fs');
const path = require('path');

function scoreDeterministic(profile, scheme) {
  let score = 0;
  try {
    const rules = JSON.parse(scheme.eligibility_json || '{}');
    if (rules.income_max && profile.income_annual != null && profile.income_annual <= rules.income_max) score += 50;
    if (rules.category && profile.caste_category && rules.category.includes(profile.caste_category)) score += 30;
    if (rules.student_status && profile.student_flag) score += 20;
  } catch (e) {
    // ignore parse issues
  }
  return score;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { profile } = req.body || {};
  if (!profile) return res.status(400).json({ error: 'no profile' });

  const schemesPath = path.join(process.cwd(), 'data/schemes.json');
  if (!fs.existsSync(schemesPath)) return res.status(500).json({ error: 'schemes not seeded' });
  const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));

  const scored = schemes.map(s => ({ scheme: s, score: scoreDeterministic(profile, s) }));
  scored.sort((a,b)=>b.score - a.score);
  const top3 = scored.slice(0,3).map(s => ({
    id: s.scheme.id,
    title: s.scheme.title,
    state: s.scheme.state,
    score: s.score,
    source_url: s.scheme.source_url,
    required_docs: s.scheme.required_docs
  }));

  res.json({ matches: top3 });
}
