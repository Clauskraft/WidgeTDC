// SettingsModal.tsx – expanded modal for platform settings
import React, { useEffect } from 'react';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-gray-900 text-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
                <p className="mb-4">Adjust global preferences for the WidgeTDC platform.</p>
                {/* Expanded settings */}
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked /> Enable auto‑save
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" /> Dark mode (override)
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked /> Activate HansPedder orchestrator
                    </label>
                    <label className="flex items-center">
                        Insight refresh interval (seconds):
                        <input type="number" className="ml-2 w-16" defaultValue={60} min={10} step={10} />
                    </label>
                    <label className="flex items-center">
                        Theme accent color:
                        <select className="ml-2" defaultValue="teal">
                            <option value="teal">Teal</option>
                            <option value="purple">Purple</option>
                            <option value="amber">Amber</option>
                        </select>
                    </label>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

