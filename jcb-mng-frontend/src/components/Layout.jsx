import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-jcb-background text-jcb-textMain font-sans">
      {/* Sidebar fixed to the left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet /> {/* This is where UserManager, BookingManager, etc. will render */}
      </main>
    </div>
  );
};

export default Layout;