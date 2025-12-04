

interface EditChangesListProps {
    changes: string[];
    className?: string;
}

export default function EditChangesList({ changes, className = '' }: EditChangesListProps) {
    if (!changes || changes.length === 0) {
        return null;
    }

    return (
        <div className={`bg-purple-50 border border-purple-100 rounded-md p-4 ${className}`}>
            <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editor Changes
            </h4>
            <ul className="space-y-2">
                {changes.map((change, index) => (
                    <li key={index} className="text-sm text-purple-800 flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 mr-2 flex-shrink-0"></span>
                        {change}
                    </li>
                ))}
            </ul>
        </div>
    );
}
