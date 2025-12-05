import React from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface CollapsibleSectionProps {
    title: string;
    subtitle?: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
}

export default function CollapsibleSection({
    title,
    subtitle,
    status,
    isOpen,
    onToggle,
    children,
    className = ''
}: CollapsibleSectionProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'active':
                return <div className="w-2 h-2 rounded-full bg-gray-400" />;
            case 'completed':
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <div className="w-2 h-2 rounded-full bg-red-500" />;
            default:
                return <div className="w-2 h-2 rounded-full bg-gray-300" />;
        }
    };

    const getBorderColor = () => {
        switch (status) {
            case 'active':
                return 'border-blue-200 ring-1 ring-blue-100';
            case 'completed':
                return 'border-gray-200';
            case 'failed':
                return 'border-red-200';
            default:
                return 'border-gray-100';
        }
    };

    return (
        <div className={`bg-white rounded-lg border transition-all duration-200 ${getBorderColor()} ${className}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon()}
                    <div className="flex-1 min-w-0 text-left">
                        <span className={`font-medium ${status === 'active' ? 'text-blue-700' : 'text-gray-700'}`}>
                            {title}
                        </span>
                        {!isOpen && subtitle && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
