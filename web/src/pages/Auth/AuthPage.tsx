import { KeyRound, LogOut } from 'lucide-react'
import { useAppContext } from '../../AppContext'
import './AuthPage.css'

export function AuthPage() {
  const {
    authForm,
    authMode,
    busy,
    changePassword,
    logout,
    profile,
    setAuthForm,
    setAuthMode,
    submitAuth,
  } = useAppContext()

  return (
    <section className="page-panel auth-grid">
      <form className="side-form" onSubmit={submitAuth}>
        <div className="section-heading">
          <div>
            <h2>{authMode === 'login' ? '用户登录' : '用户注册'}</h2>
            <p>登录后可管理个人资料和密码。</p>
          </div>
        </div>
        <label>
          <span>用户名</span>
          <input value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} />
        </label>
        {authMode === 'register' && (
          <label>
            <span>邮箱</span>
            <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
          </label>
        )}
        <label>
          <span>密码</span>
          <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
        </label>
        <button className="primary-action full" type="submit" disabled={busy}>
          <KeyRound size={18} />
          {authMode === 'login' ? '登录' : '注册'}
        </button>
        <button className="ghost-action full" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
          切换到{authMode === 'login' ? '注册' : '登录'}
        </button>
      </form>

      <section className="table-panel">
        <div className="section-heading">
          <div>
            <h2>用户信息管理</h2>
            <p>查看资料、修改密码或退出当前账号。</p>
          </div>
        </div>
        {profile ? (
          <div className="card-grid two">
            <article className="data-card">
              <strong>{profile.username}</strong>
              <span>{profile.email}</span>
              <p>登录有效期至：{profile.tokenExpiresAt.slice(0, 10)}</p>
            </article>
            <article className="data-card">
              <label>
                <span>新密码</span>
                <input type="password" value={authForm.newPassword} onChange={(event) => setAuthForm({ ...authForm, newPassword: event.target.value })} />
              </label>
              <div className="row-actions">
                <button type="button" onClick={changePassword}>
                  修改密码
                </button>
                <button type="button" onClick={logout}>
                  <LogOut size={16} />
                  登出
                </button>
              </div>
            </article>
          </div>
        ) : (
          <div className="empty-state">当前未登录，请先使用左侧表单登录或注册。</div>
        )}
      </section>
    </section>
  )
}
