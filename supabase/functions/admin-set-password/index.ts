import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  medewerker: 80,
  coordinator: 60,
  coach: 40,
  fighter: 20,
  fan: 10,
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    // Create admin client (with service role key for user management)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create regular client to verify the requesting user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      throw new Error('Unauthorized')
    }

    // Get the requesting user's member profile to check role
    const { data: requestingMember, error: memberError } = await supabaseAdmin
      .from('members')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (memberError || !requestingMember) {
      throw new Error('Could not verify user permissions')
    }

    const requestingRole = requestingMember.role as string
    const requestingRoleLevel = ROLE_HIERARCHY[requestingRole] || 0

    // Only staff can set passwords
    if (requestingRoleLevel < ROLE_HIERARCHY.coordinator) {
      throw new Error('Onvoldoende rechten om wachtwoorden te wijzigen')
    }

    // Parse request body
    const { user_id, new_password } = await req.json()

    if (!user_id || !new_password) {
      throw new Error('user_id and new_password are required')
    }

    if (new_password.length < 8) {
      throw new Error('Wachtwoord moet minimaal 8 karakters zijn')
    }

    // Get the target user's role
    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from('members')
      .select('role, first_name, last_name')
      .eq('id', user_id)
      .single()

    if (targetError || !targetMember) {
      throw new Error('Gebruiker niet gevonden')
    }

    const targetRole = targetMember.role as string
    const targetRoleLevel = ROLE_HIERARCHY[targetRole] || 0

    // Check if requesting user can modify target user
    // Admin can modify everyone
    // Others can only modify users with lower role level
    if (requestingRole !== 'admin' && requestingRoleLevel <= targetRoleLevel) {
      throw new Error(`Je hebt geen rechten om het wachtwoord van een ${targetRole} te wijzigen`)
    }

    // Use admin API to update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      throw new Error('Kon wachtwoord niet bijwerken')
    }

    console.log(`Password updated for user ${user_id} (${targetMember.first_name} ${targetMember.last_name}) by ${requestingUser.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Wachtwoord succesvol ingesteld voor ${targetMember.first_name} ${targetMember.last_name}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in admin-set-password:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
