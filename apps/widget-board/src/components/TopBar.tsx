// Top navigation bar with Settings (gear) button
import React, { useState } from 'react';
import SettingsModal from './SettingsModal';

const TopBar: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <header className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
            <h1 className="text-2xl font-bold">WidgeTDC Platform</h1>
            <button
                aria-label="Open settings"
                className="text-2xl hover:text-teal-400 transition-colors"
                onClick={() => setOpen(true)}
            >
                ⚙️
            </button>
            {open && <SettingsModal onClose={() => setOpen(false)} />}
        </header>
    );
};

export default TopBar;
