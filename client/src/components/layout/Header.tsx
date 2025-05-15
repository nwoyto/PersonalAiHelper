import React, { ReactNode } from 'react';
import { Link } from 'wouter';
import Logo from './Logo';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showUserIcon?: boolean;
  children?: ReactNode;
}

export default function Header({ 
  title = "Jibe AI", 
  showBackButton = false,
  showUserIcon = true,
  children
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
          <Logo className="mr-3" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-text-secondary text-sm">Your AI Assistant</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        
        {showUserIcon && (
          <button className="rounded-full bg-surface p-2">
            <i className="ri-user-line text-text-primary text-xl"></i>
          </button>
        )}
      </div>
    </header>
  );
}