import React from 'react';
import { Info, HelpCircle, Save, Settings } from 'lucide-react';

export const GlobalHeader: React.FC = () => {
  return (
    <header className="w-full bg-sfu-red text-white h-16 flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold tracking-tight">SFU Scheduler</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          title="Information"
        >
          <Info size={20} />
        </button>
        <button 
          className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          title="Help"
        >
          <HelpCircle size={20} />
        </button>
        <button 
          className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          title="Save"
        >
          <Save size={20} />
        </button>
        <button 
          className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};
