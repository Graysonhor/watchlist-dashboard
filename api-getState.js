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

    const { data, error } = await supabase
      .from('watchlist_state')
      .select('state_data')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data && data.state_data) {
      return res.status(200).json(data.state_data);
    }

    const listId = 'l_' + Date.now().toString(36);
    const emptyState = {
      lists: [
        {
          id: listId,
          name: '默认',
          groups: [
            {
              id: 'g_' + Date.now().toString(36),
              name: '股票',
              collapsed: false,
              symbols: []
            }
          ]
        }
      ],
      activeListId: listId
    };

    return res.status(200).json(emptyState);
  } catch (err) {
    console.error('getState error:', err);
    return res.status(500).json({ error: err.message });
  }
}
