import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';

interface CompletedCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompletedCoursesModal: React.FC<CompletedCoursesModalProps> = ({ isOpen, onClose }) => {
  const completedCourses = useCourseStore((state) => state.completedCourses);
  const setCompletedCourses = useCourseStore((state) => state.setCompletedCourses);
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    setCourses([...completedCourses]);
  }, [completedCourses, isOpen]);

  const handleAdd = () => {
    if (newCourse.trim()) {
      const formatted = newCourse.trim().toUpperCase().replace(/\s+/g, '-');
      if (!courses.includes(formatted)) {
        setCourses([...courses, formatted]);
      }
      setNewCourse('');
    }
  };

  const handleRemove = (course: string) => {
    setCourses(courses.filter(c => c !== course));
  };

  const handleSave = async () => {
    setCompletedCourses(courses);
    
    // Save to backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:8000/api/v1/user/courses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(courses)
        });
      } catch (error) {
        console.error('Failed to save completed courses:', error);
      }
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-500" size={24} />
            <h2 className="text-xl font-bold text-white">Completed Courses</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-400 text-sm mb-4">
            Add courses you've already completed. These will be used for prerequisite checking.
          </p>

          {/* Add Course Input */}
          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., CMPT 120 or CMPT-120"
              className="flex-1 px-4 py-2 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sfu-red"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>

          {/* Course List */}
          <div className="space-y-2">
            {courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No completed courses yet. Add some above!
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <span className="text-white font-medium">{course}</span>
                  <button
                    onClick={() => handleRemove(course)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-dark-bg transition-colors text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-white font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
