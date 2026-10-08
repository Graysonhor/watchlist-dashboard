const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_KEY' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const userId = req.query.userId || 'default_user';

    const { data, error } = await supabase
      .from('watchlist_state')
      .select('state_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data && data.state_data) {
      return res.status(200).json(data.state_data);
    }

    const now = Date.now();
    const listId = 'l_' + now.toString(36);
    const emptyState = {
      lists: [{
        id: listId,
        name: '默认',
        groups: [{
          id: 'g_' + (now + 1).toString(36),
          name: '股票',
          collapsed: false,
          symbols: []
        }]
      }],
      activeListId: listId
    };

    // Create the cloud row on first load so Table Editor is never mysteriously empty.
    const { error: createError } = await supabase
      .from('watchlist_state')
      .upsert({
        user_id: userId,
        state_data: emptyState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (createError) throw createError;

    return res.status(200).json(emptyState);
  } catch (err) {
    console.error('getState error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
