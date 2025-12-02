import React from 'react';

export const DataStream: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 right-4 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex items-end p-4">
        <div className="flex gap-1 items-end h-full w-full opacity-50">
            {Array.from({length: 50}).map((_, i) => (
                <div 
                    key={i} 
                    className="bg-cyan-500 w-1 mx-px"
                    style={{
                        height: `${Math.random() * 100}%`,
                        opacity: Math.random()
                    }}
                />
            ))}
        </div>
    </div>
  );
};
