'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('❌ بيانات الدخول غير صحيحة')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div dir="rtl" style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#1a202c 0%,#2d3748 100%)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'Tajawal, Arial, sans-serif',
    }}>
      <div style={{width:'100%',maxWidth:'420px',padding:'0 20px'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{
            width:'60px',height:'60px',
            background:'linear-gradient(135deg,#e53e3e,#dd6b20)',
            borderRadius:'16px',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'28px',margin:'0 auto 16px',
            boxShadow:'0 0 30px rgba(229,62,62,.4)',
          }}>🔔</div>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:'28px',fontWeight:700,letterSpacing:'4px',color:'#fff'}}>ATE</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,.4)',letterSpacing:'2px',marginTop:'4px'}}>INTERNAL CRM</div>
        </div>

        {/* Card */}
        <div style={{
          background:'#fff',borderRadius:'16px',padding:'32px',
          boxShadow:'0 24px 60px rgba(0,0,0,.3)',
        }}>
          <h2 style={{fontSize:'20px',fontWeight:900,color:'#1a202c',marginBottom:'6px'}}>تسجيل الدخول</h2>
          <p style={{fontSize:'12px',color:'#718096',marginBottom:'24px'}}>أدخل بياناتك للوصول إلى النظام</p>

          {error && (
            <div style={{
              background:'rgba(229,62,62,.1)',border:'1px solid rgba(229,62,62,.3)',
              borderRadius:'8px',padding:'10px 14px',
              fontSize:'12px',color:'#e53e3e',fontWeight:700,
              marginBottom:'16px',
            }}>{error}</div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:'16px'}}>
              <label style={{
                display:'block',fontSize:'10px',color:'#718096',
                fontFamily:'IBM Plex Mono,monospace',letterSpacing:'1px',
                marginBottom:'6px',fontWeight:600,
              }}>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ate-platform.com"
                required
                style={{
                  width:'100%',padding:'11px 14px',
                  background:'#f7fafc',border:'1px solid #e2e5ea',
                  borderRadius:'9px',fontSize:'13px',
                  fontFamily:'Tajawal,sans-serif',color:'#1a202c',
                  outline:'none',boxSizing:'border-box',
                }}
              />
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={{
                display:'block',fontSize:'10px',color:'#718096',
                fontFamily:'IBM Plex Mono,monospace',letterSpacing:'1px',
                marginBottom:'6px',fontWeight:600,
              }}>كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width:'100%',padding:'11px 14px',
                  background:'#f7fafc',border:'1px solid #e2e5ea',
                  borderRadius:'9px',fontSize:'13px',
                  fontFamily:'Tajawal,sans-serif',color:'#1a202c',
                  outline:'none',boxSizing:'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%',padding:'13px',
                background: loading ? '#a0aec0' : 'linear-gradient(135deg,#3182ce,#2b6cb0)',
                color:'#fff',fontWeight:700,fontSize:'14px',
                borderRadius:'9px',border:'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:'Tajawal,sans-serif',
              }}
            >
              {loading ? '⏳ جارٍ الدخول...' : '🔐 تسجيل الدخول'}
            </button>
          </form>

          <div style={{
            marginTop:'20px',paddingTop:'20px',
            borderTop:'1px solid #f0f2f5',
            textAlign:'center',fontSize:'11px',color:'#a0aec0',
          }}>
            ATE Platform · نظام إدارة أجهزة الإنذار
          </div>
        </div>

      </div>
    </div>
  )
}