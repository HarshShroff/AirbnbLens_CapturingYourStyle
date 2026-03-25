'use client';

import React from 'react';

interface HeaderProps {
  showMiniSearch?: boolean;
  onMiniSearchClick?: () => void;
  currentCity?: string;
}

const Header = ({ showMiniSearch, onMiniSearchClick, currentCity }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-1.5 group">
          <svg className="w-7 h-7 text-[#FF5A5F] group-hover:scale-110 transition-transform" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415c0 2.516-1.128 4.348-3.14 5.285l-.36.157c-.732.317-1.526.48-2.36.48-1.72 0-3.252-.827-4.453-2.17-.932 1.03-2.06 1.87-3.455 2.463l-.185.07-.357.122c-1.8.595-3.77.522-5.405-.186l-.307-.14c-2.008-.96-3.226-2.764-3.226-5.156 0-1.035.22-1.937.862-3.23l.198-.4c.917-1.843 5.03-10.45 6.97-14.25l.533-1.04C12.533 1.963 13.992 1 16 1z" />
          </svg>
          <span className="font-extrabold text-[#222222] text-lg hidden sm:block">
            airbnb<span className="text-[#FF5A5F]">lens</span>
          </span>
        </a>

        {/* Mini search pill */}
        {showMiniSearch ? (
          <button
            onClick={onMiniSearchClick}
            className="hidden md:flex items-center gap-3 bg-white border border-gray-200 rounded-full pl-4 pr-2 py-2 shadow-md hover:shadow-lg transition-all duration-200 text-sm"
          >
            <span className="font-semibold text-[#222222] border-r border-gray-200 pr-3">{currentCity || 'Anywhere'}</span>
            <span className="text-gray-500 border-r border-gray-200 pr-3">Any aesthetic</span>
            <span className="text-gray-500 pr-2 hidden lg:block">Upload photo</span>
            <div className="w-7 h-7 rounded-full bg-[#FF5A5F] flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ) : (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="text-[#222222] border-b-2 border-[#222222] pb-0.5">Stays</a>
            <a href="#" className="hover:text-[#222222] transition-colors pb-0.5">Experiences</a>
            <a href="#" className="hover:text-[#222222] transition-colors pb-0.5">List Your Style</a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <button className="hidden sm:block text-sm font-medium text-[#222222] hover:bg-gray-100 px-3 py-2 rounded-full transition-colors">
            Airbnb your home
          </button>
          <button className="flex items-center gap-2 border border-gray-200 rounded-full p-2 hover:shadow-md transition-all duration-200">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <div className="w-8 h-8 rounded-full bg-[#71717A] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
