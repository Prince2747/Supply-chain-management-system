import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function syncUsers() {
  try {
    console.log('🔄 Syncing Supabase users with Profile table...')

    // Get all users from Supabase Auth
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error fetching users from Supabase:', error.message)
      return
    }

    console.log(`📊 Found ${users.length} users in Supabase Auth`)

    for (const user of users) {
      // Check if profile already exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id }
      })

      if (existingProfile) {
        console.log(`✅ Profile already exists for user: ${user.email}`)
        continue
      }

      // Create profile for user
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          role: user.email?.includes('admin') ? 'admin' : 'user', // Make admin if email contains 'admin'
        }
      })

      console.log(`✨ Created profile for user: ${user.email} with role: ${profile.role}`)
    }

    console.log('🎉 User sync completed successfully!')

  } catch (error) {
    console.error('❌ Error syncing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync
syncUsers()
