import React from 'react';

const GuideArrow: React.FC = () => (
    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 animate-[guideFadeIn_1s_ease-out_2.8s_forwards,guideGlow_2s_ease-in-out_3.8s_infinite] pointer-events-none z-[100]">
        <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white rotate-[12deg]"
        >
            <path
                d="M12 19V5M12 5L7 10M12 5L17 10"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
        <style>{`
            @keyframes guideFadeIn {
                from { opacity: 0; }
                to { opacity: 0.8; }
            }
            @keyframes guideGlow {
                0%, 100% { 
                    opacity: 0.7; 
                    filter: blur(1.2px) drop-shadow(0 0 10px rgba(255, 255, 255, 0.4)); 
                }
                50% { 
                    opacity: 1; 
                    filter: blur(2px) drop-shadow(0 0 25px rgba(255, 255, 255, 1)); 
                }
            }
        `}</style>
    </div>
);

export default GuideArrow;
