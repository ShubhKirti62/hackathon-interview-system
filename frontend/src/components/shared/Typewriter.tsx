import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    cursor?: boolean;
    className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({
    text,
    speed = 50,
    cursor = false,
    className = ''
}) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(intervalId);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return (
        <span className={className} style={{ textAlign: 'left' }}>
            {displayedText}
            {cursor && <span style={{ animation: 'blink 1s step-end infinite', marginLeft: '2px' }}>|</span>}
            <style>
                {`
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                    }
                `}
            </style>
        </span>
    );
};

export default Typewriter;
