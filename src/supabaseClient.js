import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxekimndwrfzhztsonln.supabase.co'
const supabaseKey = 'sb_publishable_BPmO8aeKnUTs5silmPODFQ_m9dU5ihD'

export const supabase = createClient(supabaseUrl, supabaseKey)