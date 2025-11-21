// Updated SystemSettings for OAuth
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useGlobalState } from '../contexts/GlobalStateContext';  // For user/org

export default function SystemSettingsWidget() {
  const { state: { user } } = useGlobalState();
  const [loading, setLoading] = useState(false);

  const handleOAuth = async () => {
    setLoading(true);
    const authUrl = await fetch('/api/auth/aula/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, orgId: user.org_id })
    }).then(res => res.text());

    window.location.href = authUrl;  // Redirect to Aula
  };

  const handleCallback = async (code: string, state: string) => {
    // Called from callback URL
    await fetch('/api/auth/aula/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state, userId: user.id, orgId: user.org_id })
    });
    // Refresh UI or show success
  };

  // Listen for callback (hash in URL)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    if (code && state) {
      handleCallback(code, state);
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div>
      <h4>Aula Integration</h4>
      <Button onClick={handleOAuth} disabled={loading}>
        {loading ? 'Authenticating...' : 'Connect Aula via OAuth'}
      </Button>
      <p>Status: {user.aulaConnected ? 'Connected' : 'Not Connected'}</p>
    </div>
  );
}
