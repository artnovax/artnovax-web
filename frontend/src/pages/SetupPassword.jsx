import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '@/lib/supabase';

const inputCls =
  'w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40';

const authErrorFromUrl = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    query.get('error_description') ||
    hash.get('error_description') ||
    query.get('error') ||
    hash.get('error') ||
    ''
  );
};

const SetupPassword = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const prepareSession = async () => {
      try {
        const redirectError = authErrorFromUrl();
        if (redirectError) {
          throw new Error(decodeURIComponent(redirectError.replace(/\+/g, ' ')));
        }

        let {
          data: { session },
        } = await supabase.auth.getSession();

        // PKCE invitations can arrive with ?code=... . Usually supabase-js
        // consumes this automatically, but explicitly exchange it when there is
        // not already a session so this route works with either auth flow.
        const code = new URLSearchParams(window.location.search).get('code');
        if (!session && code) {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          session = data.session;
        }

        // Give the client a moment to process implicit-flow hash parameters.
        if (!session) {
          await new Promise((resolve) => window.setTimeout(resolve, 250));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
        }

        if (!session?.user) {
          throw new Error(
            'This invitation is invalid, expired, or has already been used. Ask an ArtNovaX administrator to send a new invitation.',
          );
        }

        if (cancelled) return;
        setEmail(session.user.email || '');
      } catch (sessionError) {
        if (!cancelled) {
          setError(
            sessionError?.message ||
              'We could not verify this invitation. Ask an ArtNovaX administrator to send a new one.',
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    prepareSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setComplete(true);
      window.setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 900);
    } catch (updateError) {
      setError(
        updateError?.message ||
          'We could not save your password. Please try again or request a new invitation.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Header activePath="/admin" />

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <section className="w-full max-w-[470px] rounded-3xl bg-ivory-100 ring-1 ring-ivory-300 p-7 md:p-9">
          <div className="mx-auto w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
            {complete ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            ) : (
              <KeyRound className="w-6 h-6 text-burgundy" />
            )}
          </div>

          <h1 className="mt-4 text-center font-serif-display text-burgundy text-[28px] md:text-[32px] font-semibold">
            Set up your ArtNovaX account
          </h1>

          {checking ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-ink/60 text-[13.5px]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking your invitation…
            </div>
          ) : complete ? (
            <div className="mt-6 rounded-xl bg-emerald-50 text-emerald-800 px-4 py-4 text-center text-[13.5px]">
              Your password is set. Taking you to the staff dashboard…
            </div>
          ) : (
            <>
              <p className="mt-2 text-center text-ink/65 text-[13.5px] leading-relaxed">
                {email
                  ? `Finish setting up ${email} by choosing a password.`
                  : 'Use the secure invitation email sent by ArtNovaX to finish setting up your staff account.'}
              </p>

              {error && (
                <div className="mt-5 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px] leading-relaxed">
                  {error}
                </div>
              )}

              {email && (
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
                      New password
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={`${inputCls} mt-1`}
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
                      Confirm password
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={`${inputCls} mt-1`}
                    />
                  </label>

                  <p className="text-[11.5px] text-ink/50">
                    Use at least 12 characters and a password you do not reuse elsewhere.
                  </p>

                  <button
                    disabled={saving}
                    className="cta-btn w-full inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-3 text-[14px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Setting password…' : 'Finish account setup'}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SetupPassword;
