const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = req.query.userId || 'default_user';
    const stateData = req.body;

    if (!stateData) {
      return res.status(400).json({ error: 'No state data provided' });
    }

    const { error } = await supabase
      .from('watchlist_state')
      .upsert(
        {
          user_id: userId,
          state_data: stateData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('setState error:', err);
    return res.status(500).json({ error: err.message });
  }
}
