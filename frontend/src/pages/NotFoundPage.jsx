import React from 'react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import iktisLogo from '../assets/iktis-logo.svg';
import notFoundIllustration from '../assets/not-found-house-keys.png';
import { useAuth } from '../context/AuthContext.jsx';
import IKTISLoadingScreen from '../components/IKTISLoadingScreen.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isInitialized, ensureAuth } = useAuth();

  React.useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);

  if (isLoading || !isInitialized) {
    return <IKTISLoadingScreen />;
  }

  // RootRoute already resolves / to the dashboard or landing page as appropriate.
  const homePath = '/';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(homePath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-slate-950">
      <header className="border-b border-slate-200/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to={homePath} className="flex items-center gap-3" aria-label="IKTIS home">
            <img src={iktisLogo} alt="" aria-hidden="true" className="h-9 w-9" />
            <span className="text-base font-semibold tracking-[0.12em]">IKTIS</span>
          </Link>
          <span className="hidden text-xs font-medium uppercase tracking-[0.16em] text-slate-500 sm:inline">Page not found</span>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-145px)] max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <section className="max-w-xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">404 / UNASSIGNED SPACE</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">Looks like this space is unoccupied.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            We couldn’t find the property or page you were looking for. It may have moved, or the address may be incomplete.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to={homePath} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              {isAuthenticated ? 'Back to Dashboard' : 'Go to Homepage'}
              <ArrowRight size={16} />
            </Link>
            <button type="button" onClick={handleGoBack} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950">
              <ArrowLeft size={16} />
              Go back
            </button>
          </div>
        </section>

        <aside className="relative mx-auto w-full max-w-md" aria-label="House and key illustration">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-10">
            <div className="absolute right-6 top-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Address not found
            </div>
            <img src={notFoundIllustration} alt="A house and a key being handed over" className="mx-auto mt-7 h-auto w-full max-w-[290px] grayscale-[0.25] opacity-90" />
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <Home size={16} className="text-slate-700" />
              <span>The right place is one step away.</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-7 text-xs text-slate-500 sm:px-8">
        <span>© {new Date().getFullYear()} IKTIS</span>
        <span className="text-right">Better-managed homes start with a clear address. <a href="https://icons8.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-950">Illustration by Icons8</a> · <a href="https://icons8.com/illustrations/styles/cherry" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-950">Cherry style</a></span>
      </footer>
    </div>
  );
}
