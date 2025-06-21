import React from 'react';
import { Github, Code } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full text-center py-4 px-2 mt-auto text-gray-400 text-xs sm:text-sm">
      <div className="flex justify-center items-center gap-2 flex-wrap">
        <a 
          href="https://github.com/caovanducanh/sodocku-game" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <Code size={14} />
          <span>© {new Date().getFullYear()} Sudoku Master</span>
        </a>
        <span>|</span>
        <div className="flex items-center gap-1">
          <span>Phát triển & Vận hành bởi</span>
          <a 
            href="https://github.com/caovanducanh" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1 font-semibold text-gray-300 hover:text-purple-400 transition-colors"
          >
            <Github size={14} />
            <span>caovanducanh</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 