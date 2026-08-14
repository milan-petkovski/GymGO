import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const myHandler = async (event) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) throw error;

    console.log('Supabase ping successful');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Keep-alive success' }),
    };
  } catch (err) {
    console.error('Supabase ping error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

export const handler = schedule('0 9 * * 1,4', myHandler);