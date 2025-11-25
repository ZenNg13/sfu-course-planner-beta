import React, { useEffect, useState } from 'react';
import { CourseGroup, CourseSection } from '../../types';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface EnrollmentCache {
  [sectionId: string]: {
    enrolled: string;
    waitlist: string;
  };
}

interface SectionSelectorModalProps {
  group: CourseGroup;
  onClose: () => void;
  onSelectSection: (section: CourseSection) => void;
}

export const SectionSelectorModal: React.FC<SectionSelectorModalProps> = ({
  group,
  onClose,
  onSelectSection,
}) => {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentCache>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch enrollment data for all sections
    const fetchEnrollmentData = async () => {
      setLoading(true);
      try {
        const coursesToFetch = group.sections.map(section => ({
          dept: section.dept,
          number: section.number,
          section: section.section
        }));

        const results = await api.getBatchEnrollment(coursesToFetch, '2025/fall');
        
        const cache: EnrollmentCache = {};
        results.forEach((result, index) => {
          const section = group.sections[index];
          if (section) {
            cache[section.id] = {
              enrolled: result.enrolled,
              waitlist: result.waitlist
            };
          }
        });

        setEnrollmentData(cache);
      } catch (error) {
        console.error('Failed to fetch enrollment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentData();
  }, [group]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-dark-card border border-gray-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Select Section for {group.dept} {group.number}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {group.sections.map((section) => (
            <div
              key={section.id}
              onClick={() => onSelectSection(section)}
              className="bg-dark-bg border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-500 hover:bg-gray-800 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2">
                    <h4 className="text-lg font-semibold text-white">
                      {section.section}
                    </h4>
                    <span className="text-sm text-gray-400">{section.instructor}</span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {section.schedule.map((sched, idx) => (
                      <div key={idx} className="text-sm text-gray-300">
                        <span className="font-medium">{sched.type}:</span> {sched.day} {sched.startTime} - {sched.endTime}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-xs">
                    <span className="text-gray-400">
                      Enrolled: <span className="text-white">
                        {loading ? 'Loading...' : (enrollmentData[section.id]?.enrolled || section.stats.enrolled)}
                      </span>
                    </span>
                    {enrollmentData[section.id]?.waitlist && (
                      <span className="text-gray-400">
                        Waitlist: <span className="text-orange-400">({enrollmentData[section.id].waitlist}W)</span>
                      </span>
                    )}
                    <span className="text-gray-400">
                      Rating: <span className="text-yellow-400">{section.stats.profRating}</span>
                    </span>
                    <span className="text-gray-400">
                      Avg Grade: <span className="text-green-400">{section.stats.avgGrade}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
