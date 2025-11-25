import React from 'react';
import { Save, Upload, Download, Maximize2, Trash2 } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';

export const FooterActionBar: React.FC = () => {
  const getTotalCredits = useCourseStore((state) => state.getTotalCredits);
  const clearAll = useCourseStore((state) => state.clearAll);
  const getScheduledCourses = useCourseStore((state) => state.getScheduledCourses);
  
  const totalCredits = getTotalCredits();
  const scheduledCourses = getScheduledCourses();
  const courseCount = scheduledCourses.length;

  return (
    <div className="sticky bottom-0 bg-dark-card border-t border-gray-700 px-4 py-3 shadow-2xl">
      <div className="flex items-center justify-between">
        {/* Left: Total Credits */}
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-400">Courses:</span>
            <span className="ml-2 font-semibold text-white">{courseCount}</span>
          </div>
          <div className="h-6 w-px bg-gray-600" />
          <div className="text-sm">
            <span className="text-gray-400">Total Credits:</span>
            <span className="ml-2 font-semibold text-white">{totalCredits}</span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-sm font-medium"
            title="Save schedule"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-sm font-medium"
            title="Load schedule"
          >
            <Upload size={16} />
            <span>Load</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-sm font-medium"
            title="Export schedule"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-sm font-medium"
            title="Toggle fullscreen"
          >
            <Maximize2 size={16} />
            <span>Open/Close</span>
          </button>
          
          <button 
            onClick={clearAll}
            className="flex items-center space-x-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm font-medium"
            title="Clear all courses"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
