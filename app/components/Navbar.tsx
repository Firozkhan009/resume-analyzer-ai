import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const Navbar = () => {
    const { auth } = usePuterStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/auth?next=/", { replace: true });
    };

    const user = auth.user;

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

                {/* Left: Avatar + ResumeAI */}
                <div className="flex items-center gap-3">
                    {user && (
                        <div
                            className="
                w-9 h-9 rounded-full
                bg-gradient-to-br from-slate-700 to-slate-900
                flex items-center justify-center
                text-white font-semibold text-sm
                select-none
              "
                            title={user.username}
                        >
                            {(user.username || "U")[0].toUpperCase()}
                        </div>
                    )}

                    <Link to="/" className="text-2xl font-bold text-slate-800">
                        ResumeAI
                    </Link>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    {auth.isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="
                inline-flex items-center justify-center
                rounded-xl px-4 py-2
                font-medium
                text-red-600
                border border-red-200
                bg-red-50
                hover:bg-red-100
                hover:border-red-300
                transition
              "
                        >
                            Log out
                        </button>
                    )}

                    <Link to="/upload" className="primary-button w-fit">
                        Upload Resume
                    </Link>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
