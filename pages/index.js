import { supabase } from '../lib/initSupabase'
import { Auth } from '@supabase/ui'
import CreateUserPhotoNew from '../components/UserPhotoNew'

export default function IndexPage() {
  const { user } = Auth.useUser()

  return (
    <div className="w-full h-full bg-slate-200">
      {!user ? (
        <div className="w-full h-full p-4">
          <Auth
            supabaseClient={supabase}
            providers={['google', 'github']}
            socialLayout="horizontal"
            socialButtonSize="xlarge"
            socialButtonType="default"
          />
        </div>
      ) : (
        <div
          className="w-full h-full items-center p-4"
          style={{ minWidth: 250, maxWidth: 600, margin: 'auto' }}
        >
            <CreateUserPhotoNew user={supabase.auth.user()} />
          <button
            className="btn-black w-full mt-12"
            onClick={async () => {
              const { error } = await supabase.auth.signOut()
              if (error) console.log('Error logging out:', error.message)
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

