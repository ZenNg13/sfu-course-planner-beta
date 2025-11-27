import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';
import { PrerequisiteParser } from '../../utils/prerequisiteParser';

interface CompletedCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EligibleCourse {
  courseKey: string;
  title: string;
  prerequisites: string; // Raw prerequisite string from SFU
}

export const CompletedCoursesModal: React.FC<CompletedCoursesModalProps> = ({ isOpen, onClose }) => {
  const completedCourses = useCourseStore((state) => state.completedCourses);
  const setCompletedCourses = useCourseStore((state) => state.setCompletedCourses);
  const [activeTab, setActiveTab] = useState<'completed' | 'eligible'>('completed');
  const [courses, setCourses] = useState<string[]>([]);
  const [newCourse, setNewCourse] = useState('');
  const [eligibleCourses, setEligibleCourses] = useState<EligibleCourse[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  useEffect(() => {
    setCourses([...completedCourses]);
    if (isOpen && activeTab === 'eligible') {
      loadEligibleCourses();
    }
  }, [completedCourses, isOpen, activeTab]);

  const loadEligibleCourses = async () => {
    setLoadingEligible(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingEligible(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/validate/suggest-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(completedCourses)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Fetch prerequisites for each course from the new endpoint
        const coursesWithPrereqs = await Promise.all(
          data.map(async (course: any) => {
            const courseId = course.course_id || course.courseKey;
            const [dept, number] = courseId.split('-');
            
            try {
              // Fetch prerequisite from CourSys
              const prereqResponse = await fetch(`http://localhost:8000/api/v1/prerequisites/${dept}/${number}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (prereqResponse.ok) {
                const prereqData = await prereqResponse.json();
                return {
                  courseKey: courseId,
                  title: course.title || '',
                  prerequisites: prereqData.prerequisite || ''
                };
              }
            } catch (error) {
              console.error(`Failed to fetch prerequisite for ${courseId}:`, error);
            }
            
            // Fallback if prerequisite fetch fails
            return {
              courseKey: courseId,
              title: course.title || '',
              prerequisites: course.prerequisites || ''
            };
          })
        );
        
        setEligibleCourses(coursesWithPrereqs);
      }
    } catch (error) {
      console.error('Failed to load eligible courses:', error);
    } finally {
      setLoadingEligible(false);
    }
  };

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

  const handleAddFromEligible = (courseKey: string) => {
    // This would add the course to the schedule
    alert(`Adding ${courseKey} to your schedule...`);
  };

  const renderPrerequisites = (course: EligibleCourse) => {
    const prereqString = course.prerequisites;
    
    if (!prereqString || prereqString.trim() === '') {
      return (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">PREREQUISITES:</p>
          <span className="text-xs text-gray-600 italic">None</span>
        </div>
      );
    }

    // Parse the prerequisite tree to get the actual structure
    const tree = PrerequisiteParser.parse(prereqString);
    
    if (!tree) {
      return (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">PREREQUISITES:</p>
          <span className="text-xs text-gray-600">{prereqString}</span>
        </div>
      );
    }

    // Helper to render a prerequisite node
    const renderNode = (node: any, depth: number = 0): JSX.Element => {
      if (node.type === 'course') {
        const isCompleted = courses.includes(node.value);
        return (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              isCompleted
                ? 'bg-green-900 text-green-300 border border-green-700'
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            {node.value}
          </span>
        );
      }

      if (node.type === 'and' && node.children) {
        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {node.children.map((child: any, idx: number) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-purple-400 text-xs font-semibold">AND</span>}
                {renderNode(child, depth + 1)}
              </React.Fragment>
            ))}
          </div>
        );
      }

      if (node.type === 'or' && node.children) {
        // Check if this is a top-level OR (Either...or structure)
        const isTopLevel = depth === 0;
        
        if (isTopLevel) {
          // Show as separate options
          return (
            <div className="space-y-2">
              {node.children.map((child: any, idx: number) => (
                <div key={idx} className="border-l-2 border-purple-500 pl-2">
                  <div className="text-purple-400 text-xs font-semibold mb-1">
                    {idx === 0 ? 'OPTION 1:' : `OPTION ${idx + 1}:`}
                  </div>
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </div>
          );
        } else {
          // Inline OR group
          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-gray-500">(</span>
              {node.children.map((child: any, idx: number) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-purple-400 text-xs font-semibold">OR</span>}
                  {renderNode(child, depth + 1)}
                </React.Fragment>
              ))}
              <span className="text-xs text-gray-500">)</span>
            </div>
          );
        }
      }

      return <></>;
    };

    return (
      <div className="mt-3">
        <p className="text-xs text-gray-500 mb-2">PREREQUISITES:</p>
        {renderNode(tree)}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-500" size={24} />
            <h2 className="text-xl font-bold text-white">My Courses</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-white border-b-2 border-sfu-red bg-dark-bg'
                : 'text-gray-400 hover:text-white hover:bg-dark-bg'
            }`}
          >
            My Completed Courses
          </button>
          <button
            onClick={() => setActiveTab('eligible')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'eligible'
                ? 'text-white border-b-2 border-sfu-red bg-dark-bg'
                : 'text-gray-400 hover:text-white hover:bg-dark-bg'
            }`}
          >
            Eligible Courses
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'completed' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Based on your completed courses, here are the courses you're eligible to take:
              </p>

              {loadingEligible ? (
                <div className="text-center py-8 text-gray-400">
                  Loading eligible courses...
                </div>
              ) : eligibleCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {courses.length === 0 
                    ? 'Add completed courses first to see eligible courses.'
                    : 'No eligible courses found. Try adding more completed courses.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {eligibleCourses.map((course) => (
                    <div
                      key={course.courseKey}
                      className="p-4 bg-dark-bg rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">
                            {course.courseKey}
                          </h3>
                          <p className="text-gray-300 text-sm mt-1">
                            {course.title}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddFromEligible(course.courseKey)}
                          className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors flex items-center space-x-1"
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                      {renderPrerequisites(course)}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-dark-bg transition-colors text-white"
          >
            {activeTab === 'eligible' ? 'Close' : 'Cancel'}
          </button>
          {activeTab === 'completed' && (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-sfu-red hover:bg-red-800 rounded-lg transition-colors text-white font-medium"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
