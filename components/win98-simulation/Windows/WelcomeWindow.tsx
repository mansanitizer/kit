
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Help.css'; // Reusing Help styles for now as they are generic enough (sidebar + content)

interface WelcomeWindowProps {
    onClose: () => void;
    content?: string;
}

const WelcomeWindow: React.FC<WelcomeWindowProps> = ({ onClose, content: propContent }) => {
    // Fallback content in case prop is missing (though it shouldn't be with the new setup)
    const fallbackContent = `
# Welcome to Kit 1.0
(Loading tutorial content...)
`;

    const content = propContent || fallbackContent;

    return (
        <div className="win98-help h-full flex flex-col bg-white">
            <div className="win98-help-content-body">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            <div className="p-4 border-t border-gray-300 flex justify-end bg-[#c0c0c0]">
                <button
                    className="px-4 py-1 border-2 border-white border-r-gray-800 border-b-gray-800 active:border-gray-800 active:border-r-white active:border-b-white bg-[#c0c0c0]"
                    onClick={onClose}
                >
                    Start Using Kit
                </button>
            </div>
        </div>
    );
};

export default WelcomeWindow;
