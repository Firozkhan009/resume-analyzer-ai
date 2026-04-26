import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => [
    { title: "AI-Powered Resume Analyzer | Auth" },
    { name: "description", content: "Sign in to review and save resume feedback." },
];

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const navigate = useNavigate();

    // ✅ robust query parsing
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "/";

    // ✅ if already authenticated, go to next
    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate(next, { replace: true });
        }
    }, [auth.isAuthenticated, next, navigate]);

    return (
        <main className="page-shell page-auth min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white/95 border border-slate-200 rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Sign in to review and save your resume scans.</h2>
                    </div>

                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse" disabled>
                                <p>Signing you in...</p>
                            </button>
                        ) : auth.isAuthenticated ? (
                            <button className="auth-button" onClick={auth.signOut}>
                                <p>Sign Out</p>
                            </button>
                        ) : (
                            <button className="auth-button" onClick={auth.signIn}>
                                <p>Sign In</p>
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Auth;
