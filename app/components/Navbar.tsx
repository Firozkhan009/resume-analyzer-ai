const Navbar = () => {
    return (
        <nav className="flex items-center justify-between px-6 py-4">
            <a href="/" className="text-2xl font-bold text-gradient">
                ResumeAI
            </a>

            <a
                href="/upload"
                className="primary-button w-fit"
            >
                Upload Resume
            </a>
        </nav>
    );
};

export default Navbar;


