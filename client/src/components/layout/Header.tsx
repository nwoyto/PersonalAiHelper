import React from 'react';
import { Link } from 'wouter';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showUserIcon?: boolean;
}

export default function Header({ 
  title = "Jibe AI", 
  showBackButton = false,
  showUserIcon = true
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6 pt-2">
      <div className="flex items-center">
        {showBackButton ? (
          <Link href="/">
            <a className="mr-3">
              <i className="ri-arrow-left-line text-xl"></i>
            </a>
          </Link>
        ) : (
          <div className="bg-gradient-to-r from-primary to-secondary w-10 h-10 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">J</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-text-secondary text-sm">Your AI Assistant</p>
        </div>
      </div>
      
      {showUserIcon && (
        <button className="rounded-full bg-surface p-2">
          <i className="ri-user-line text-text-primary text-xl"></i>
        </button>
      )}
    </header>
  );
}