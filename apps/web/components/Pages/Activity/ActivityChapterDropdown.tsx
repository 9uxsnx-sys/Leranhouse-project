'use client'
import { useMediaQuery } from 'usehooks-ts'
import { Check, FileText, ListTree, Video, X, StickyNote, Backpack, ArrowRight } from 'lucide-react'
import { getUriWithOrg } from '@services/config/config'
import Link from 'next/link'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface ActivityChapterDropdownProps {
  course: any
  currentActivityId: string
  orgslug: string
  trailData?: any
}

export default function ActivityChapterDropdown(props: ActivityChapterDropdownProps): React.ReactNode {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Clean up course UUID by removing 'course_' prefix if it exists
  const cleanCourseUuid = props.course.course_uuid?.replace('course_', '');

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Function to get the appropriate icon for activity type
  const getActivityTypeIcon = (activityType: string) => {
    switch (activityType) {
      case 'TYPE_VIDEO':
        return <Video size={10} />;
      case 'TYPE_DOCUMENT':
        return <FileText size={10} />;
      case 'TYPE_DYNAMIC':
        return <StickyNote size={10} />;
      case 'TYPE_ASSIGNMENT':
        return <Backpack size={10} />;
      default:
        return <FileText size={10} />;
    }
  };

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'TYPE_VIDEO':
        return t('activities.video');
      case 'TYPE_DOCUMENT':
        return t('activities.document');
      case 'TYPE_DYNAMIC':
        return t('activities.page');
      case 'TYPE_ASSIGNMENT':
        return t('activities.assignment');
      default:
        return t('activities.learning_material');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="bg-white dark:bg-dk-card rounded-full px-5 nice-shadow flex items-center space-x-2 p-2.5 text-gray-700 dark:text-dk-fg-1 hover:bg-gray-50 dark:hover:bg-dk-raised transition delay-150 duration-300 ease-in-out"
        aria-label="View all activities"
        title="View all activities"
      >
        <ListTree size={17} />
        <span className="text-xs font-bold">{t('courses.chapters')}</span>
      </button>
      
      {isOpen && (
        <div className={`absolute z-dropdown mt-2 ${isMobile ? 'end-0 w-[90vw] sm:w-72' : 'end-0 w-72'} max-h-[70vh] cursor-pointer overflow-y-auto bg-white dark:bg-dk-card rounded-lg shadow-xl border border-gray-200 dark:border-dk-line-strong py-1 animate-in fade-in duration-200`}>
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-dk-line flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-dk-fg-1">{t('courses.course_content')}</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 dark:text-dk-fg-3 hover:text-gray-700 dark:hover:text-dk-fg-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dk-raised cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="py-0.5">
            {props.course.chapters.map((chapter: any, index: number) => (
              <div key={chapter.id} className="mb-1">
                <div className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dk-fg-2 bg-gray-50 dark:bg-dk-inset/40 border-y border-gray-100 dark:border-dk-line flex items-center">
                  <div className="flex items-center space-x-1.5">
                    <div className="bg-gray-500 dark:bg-zinc-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span>{chapter.name}</span>
                  </div>
                </div>
                <div className="py-0.5">
                  {chapter.activities.map((activity: any) => {
                    const cleanActivityUuid = activity.activity_uuid?.replace('activity_', '');
                    const isCurrent = cleanActivityUuid === props.currentActivityId.replace('activity_', '');
                    
                    // Find the correct run and check if activity is complete
                    const run = props.trailData?.runs?.find(
                      (run: any) => {
                        const cleanRunCourseUuid = run.course?.course_uuid?.replace('course_', '');
                        return cleanRunCourseUuid === cleanCourseUuid;
                      }
                    );
                    
                    const isComplete = run?.steps?.find(
                      (step: any) => step.activity_id === activity.id && step.complete === true
                    );
                    
                    return (
                      <Link
                        key={activity.id}
                        href={getUriWithOrg(props.orgslug, '') + `/course/${cleanCourseUuid}/activity/${cleanActivityUuid}`}
                        prefetch={false}
                        onClick={() => setIsOpen(false)}
                      >
                        <div 
                          className={`group hover:bg-neutral-50 dark:hover:bg-dk-raised transition-colors px-3 py-2 ${
                            isCurrent ? 'bg-neutral-50 dark:bg-dk-inset/60 border-s-2 border-neutral-300 dark:border-dk-line-strong ps-2.5 font-medium' : ''
                          }`}
                        >
                          <div className="flex space-x-2 items-center">
                            <div className="flex items-center">
                              {isComplete ? (
                                <div className="relative cursor-pointer">
                                  <Check size={14} className="stroke-[2.5] text-teal-600" />
                                </div>
                              ) : (
                                <div className="text-neutral-300 dark:text-zinc-600 cursor-pointer">
                                  <Check size={14} className="stroke-[2]" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col grow">
                              <div className="flex items-center space-x-1.5 w-full">
                                <p dir="auto" className="text-sm font-medium text-neutral-600 dark:text-dk-fg-2 group-hover:text-neutral-800 dark:group-hover:text-dk-fg-1 transition-colors">
                                  {activity.name}
                                </p>
                                {isCurrent && (
                                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 rounded-full text-[10px] font-medium animate-pulse">
                                    <span>{t('activities.current')}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5 text-neutral-400 dark:text-dk-fg-3">
                                {getActivityTypeIcon(activity.activity_type)}
                                <span className="text-[10px] font-medium">
                                  {getActivityTypeLabel(activity.activity_type)}
                                </span>
                              </div>
                            </div>
                            <div className="text-neutral-300 dark:text-zinc-600 group-hover:text-neutral-400 dark:group-hover:text-dk-fg-3 transition-colors cursor-pointer">
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 