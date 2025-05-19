import React from "react";
import { Link } from "wouter";
import { Mic } from "lucide-react";

interface HeaderProps {
  onVoiceClick: () => void;
}

export default function Header({ onVoiceClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                <i className="ri-robot-2-line text-lg text-white"></i>
              </div>
              <span className="text-xl font-bold text-white">Jibe AI</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onVoiceClick}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center justify-center"
            aria-label="Voice Assistant"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}