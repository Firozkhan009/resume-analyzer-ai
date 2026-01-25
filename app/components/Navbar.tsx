const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 w-full">
            <div
                className="
          max-w-7xl mx-auto mt-4
          flex items-center justify-between
          px-6 py-4
          rounded-2xl
          bg-white/70 backdrop-blur-md
          border border-white/40
          shadow-lg
        "
            >
                <a href="/" className="text-2xl font-bold text-gray-800">
                    ResumeAI
                </a>

                <a href="/upload" className="primary-button w-fit">
                    Upload Resume
                </a>
            </div>
        </nav>
    );
};

export default Navbar;



