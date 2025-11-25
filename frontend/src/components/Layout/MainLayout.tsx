import React from 'react';
import { GlobalHeader } from './GlobalHeader';
import { ControlBar } from './ControlBar';
import { WeeklyCalendar } from '../Calendar/WeeklyCalendar';
import { CourseList } from '../CourseList/CourseList';
import { FooterActionBar } from './FooterActionBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Header */}
      <GlobalHeader />
      
      {/* Control Bar */}
      <ControlBar />
      
      {/* Main Content: 2-Column Grid */}
      <div className="flex-1 grid grid-cols-[1fr_400px] overflow-hidden">
        {/* Left Column: Calendar */}
        <div className="border-r border-gray-700 overflow-hidden">
          <WeeklyCalendar />
        </div>
        
        {/* Right Column: Course List */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CourseList />
          </div>
          <FooterActionBar />
        </div>
      </div>
    </div>
  );
};
