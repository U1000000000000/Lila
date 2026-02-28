import React from "react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  const links = [
    { label: "About", to: "/about" },
    { label: "Privacy", to: "/privacy" },
    { label: "Terms", to: "/terms" },
    {
      label: "GitHub",
      to: "https://github.com/U1000000000000/Lila",
      external: true,
    },
  ];

  return (
    <footer className="w-full border-t border-white/[0.05] px-6 sm:px-8 py-5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
      <span className="text-[11px] text-white/20 tracking-wide select-none text-center sm:text-left">
        © 2026 LilaKreis. All rights reserved.
      </span>
      <div className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center">
        {links.map(({ label, to, external }) =>
          external ? (
            <a
              key={label}
              href={to}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/25 hover:text-white/60 transition-colors duration-200 cursor-pointer"
            >
              {label}
            </a>
          ) : (
            <a
              key={label}
              onClick={(e) => {
                e.preventDefault();
                navigate(to);
              }}
              href={to}
              className="text-[11px] text-white/25 hover:text-white/60 transition-colors duration-200 cursor-pointer"
            >
              {label}
            </a>
          ),
        )}
      </div>
    </footer>
  );
}
