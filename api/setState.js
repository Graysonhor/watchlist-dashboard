const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_KEY' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const userId = req.query.userId || 'default_user';

    let stateData = req.body;
    if (typeof stateData === 'string') {
      stateData = JSON.parse(stateData);
    }

    if (!stateData || !Array.isArray(stateData.lists) || !stateData.activeListId) {
      return res.status(400).json({ error: 'Invalid state data' });
    }

    const savedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('watchlist_state')
      .upsert({
        user_id: userId,
        state_data: stateData,
        updated_at: savedAt
      }, { onConflict: 'user_id' })
      .select('user_id, updated_at')
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      userId: data.user_id,
      savedAt: data.updated_at
    });
  } catch (err) {
    console.error('setState error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
