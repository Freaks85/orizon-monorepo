import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { status: 'error', message: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Simple query to keep Supabase active
    const { error } = await supabase.from('_keep_alive').select('*').limit(1)

    // It's ok if the table doesn't exist, we just want to ping Supabase
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: error?.message === 'relation "_keep_alive" does not exist' ? 'active' : 'connected'
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
