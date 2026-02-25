import Logo from "../ui/Logo";

/**
 * Navbar — placeholder.
 * Will show Lila logo, nav links (Chat, Settings), and user avatar/logout.
 */
export default function Navbar() {
  return (
    <nav className="w-full bg-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Logo className="w-6 h-6" glow />
        <span className="font-bold text-white text-lg">Lila</span>
      </div>
      {/* nav links will go here */}
    </nav>
  );
}
