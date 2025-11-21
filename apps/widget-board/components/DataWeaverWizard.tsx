import React, { useState, Fragment, useMemo, useEffect } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { X, UploadCloud, Link, Type, BarChart2, List, Table, Eye, Wand2, CheckCircle, LineChart as LineChartIcon, PieChart as PieChartIcon, Loader } from 'lucide-react';
import { useWidgetRegistry } from '../contexts/WidgetRegistryContext';
import { useWidgetStore } from './widgetStore';
import { WidgetCategory } from '../types';
import { GenericDataWidget } from './GenericDataWidget';

interface DataWeaverWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    { id: 1, name: 'Data Source' },
    { id: 2, name: 'Configure & Preview' },
    { id: 3, name: 'Design Widget' },
    { id: 4, name: 'Review & Create' },
];

export const DataWeaverWizard: React.FC<DataWeaverWizardProps> = ({ isOpen, onClose }) => {
    const { registerWidget } = useWidgetRegistry();
    const addWidget = useWidgetStore((state) => state.addWidget);

    const [currentStep, setCurrentStep] = useState(1);
    const [dataSourceType, setDataSourceType] = useState<'api' | 'json' | 'file' | null>(null);
    const [widgetName, setWidgetName] = useState('');
    const [visualizationType, setVisualizationType] = useState<'table' | 'list' | 'bar' | 'line' | 'pie' | null>(null);
    const [rawData, setRawData] = useState('');
    const [chartCategoryKey, setChartCategoryKey] = useState<string | null>(null);
    const [chartValueKeys, setChartValueKeys] = useState<string[]>([]);
    const [pieValueKey, setPieValueKey] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    // Validate raw JSON data in real-time
    React.useEffect(() => {
        if (dataSourceType === 'json' && rawData.trim()) {
            try {
                const data = JSON.parse(rawData);
                setParsedData(data);
                setErrors(prev => ({ ...prev, rawData: null }));
            } catch (error) {
                setParsedData(null);
                setErrors(prev => ({ ...prev, rawData: 'Invalid JSON format. Please check your data.' }));
            }
        } else if (dataSourceType !== 'json') {
            // Clear JSON-specific errors if we switch source type
            setErrors(prev => ({ ...prev, rawData: null }));
        }
    }, [rawData, dataSourceType]);

    // Nulstil diagram-konfiguration, når visualiseringstype ændres
    useEffect(() => {
        if (visualizationType !== 'bar' && visualizationType !== 'line') {
            setChartCategoryKey(null);
            setChartValueKeys([]);
        }
        if (visualizationType !== 'pie') {
            setPieValueKey(null);
        }
    }, [visualizationType]);

    const dataKeys = useMemo(() => {
        if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
            return { stringKeys: [], numberKeys: [] };
        }
        const sample = parsedData[0];
        if (typeof sample !== 'object' || sample === null) {
            return { stringKeys: [], numberKeys: [] };
        }
        const keys = Object.keys(sample);
        const stringKeys = keys.filter(key => typeof sample[key] === 'string');
        const numberKeys = keys.filter(key => typeof sample[key] === 'number');
        return { stringKeys, numberKeys };
    }, [parsedData]);

    const isStepValid = useMemo(() => {
        switch (currentStep) {
            case 1: return dataSourceType !== null;
            case 2: return parsedData !== null && !errors.rawData;
            case 3:
                if (widgetName.trim() === '' || visualizationType === null) return false;
                if ((visualizationType === 'bar' || visualizationType === 'line') && (!chartCategoryKey || chartValueKeys.length === 0)) return false;
                if (visualizationType === 'pie' && (!chartCategoryKey || !pieValueKey)) return false;
                return true;
            case 4: return true;
            default: return false;
        }
    }, [currentStep, dataSourceType, parsedData, widgetName, visualizationType, errors.rawData, chartCategoryKey, chartValueKeys, pieValueKey]);

    const handleCreateWidget = () => {
        try {
            const newWidgetId = `data-weaver-${Date.now()}`;

            registerWidget({
                id: newWidgetId,
                name: widgetName || 'New Data Widget',
                component: GenericDataWidget,
                category: 'ai-agents' as WidgetCategory,
                defaultLayout: { w: 6, h: 8 },
                source: 'dynamic',
            }, undefined, 'dynamic');

            addWidget(newWidgetId, { data: parsedData, visualizationType, chartCategoryKey, chartValueKeys, pieValueKey });
            handleClose();
        } catch (e) {
            setErrors(prev => ({ ...prev, final: 'Failed to create widget. Please check your data.' }));
        }
    };

    const handleClose = () => {
        // Reset state
        setCurrentStep(1);
        setDataSourceType(null);
        setWidgetName('');
        setVisualizationType(null);
        setRawData('');
        setParsedData(null);
        setErrors({});
        setChartCategoryKey(null);
        setChartValueKeys([]);
        setPieValueKey(null);
        onClose();
    };

    const handleNext = () => {
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1e1e2e] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                                        <Wand2 className="w-5 h-5 text-purple-400" />
                                        Data Weaver Wizard
                                    </Dialog.Title>
                                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close wizard">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Stepper */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-700 -z-10"></div>
                                        {steps.map((step) => {
                                            const isCompleted = currentStep > step.id;
                                            const isCurrent = currentStep === step.id;
                                            return (
                                                <div key={step.id} className="flex flex-col items-center bg-[#1e1e2e] px-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${isCompleted ? 'bg-green-500 text-white' :
                                                        isCurrent ? 'bg-purple-600 text-white' :
                                                            'bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.id}
                                                    </div>
                                                    <span className={`text-xs ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{step.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="min-h-[300px]">
                                    {currentStep === 1 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium text-card-foreground">Step 1: Select Data Source</h3>
                                            <RadioGroup value={dataSourceType} onChange={setDataSourceType} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                <RadioGroup.Option value="json" className={({ checked }) =>
                                                    `data-source-option ${checked ? 'active' : ''
                                                    }`
                                                }>
                                                    <Type className="w-8 h-8 text-purple-400" />
                                                    <span className="text-sm font-medium text-white">Raw JSON</span>
                                                </RadioGroup.Option>
                                                <RadioGroup.Option value="api" disabled className="cursor-not-allowed opacity-50 rounded-lg border border-white/10 p-4 flex flex-col items-center gap-3 bg-white/5">
                                                    <Link className="w-8 h-8 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-400">API Endpoint</span>
                                                </RadioGroup.Option>
                                                <RadioGroup.Option value="file" disabled className="cursor-not-allowed opacity-50 rounded-lg border border-white/10 p-4 flex flex-col items-center gap-3 bg-white/5">
                                                    <UploadCloud className="w-8 h-8 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-400">File Upload</span>
                                                </RadioGroup.Option>
                                            </RadioGroup>

                                            <div className="mt-4">
                                                {dataSourceType === 'json' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Paste JSON Data</label>
                                                        <textarea
                                                            value={rawData}
                                                            onChange={(e) => setRawData(e.target.value)}
                                                            className={`w-full h-48 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-purple-500 ${errors.rawData ? 'border-red-500' : ''}`}
                                                            placeholder='[{"id": 1, "name": "Example"}, ...]'
                                                        />
                                                        {errors.rawData && <p className="text-red-400 text-xs mt-2">{errors.rawData}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-medium text-card-foreground">Step 2: Design Widget</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Widget Name</label>
                                                <input
                                                    type="text"
                                                    value={widgetName}
                                                    onChange={(e) => setWidgetName(e.target.value)}
                                                    className="form-input"
                                                    placeholder="My Awesome Widget"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Visualization Type</label>
                                                <RadioGroup value={visualizationType} onChange={setVisualizationType} className="grid grid-cols-3 gap-4">
                                                    <RadioGroup.Option value="table" className={({ checked }) =>
                                                        `cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-3 transition-all ${checked ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`
                                                    }>
                                                        <Table className="w-6 h-6 text-blue-400" />
                                                        <span className="text-sm font-medium text-white">Table</span>
                                                    </RadioGroup.Option>
                                                    <RadioGroup.Option value="list" className={({ checked }) =>
                                                        `cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-3 transition-all ${checked ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`
                                                    }>
                                                        <List className="w-6 h-6 text-green-400" />
                                                        <span className="text-sm font-medium text-white">List</span>
                                                    </RadioGroup.Option>
                                                    <RadioGroup.Option value="bar" className={({ checked }) =>
                                                        `cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-3 transition-all ${checked ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`
                                                    }>
                                                        <BarChart2 className="w-6 h-6 text-orange-400" />
                                                        <span className="text-sm font-medium text-white">Bar Chart</span>
                                                    </RadioGroup.Option>
                                                    <RadioGroup.Option value="line" className={({ checked }) =>
                                                        `cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-3 transition-all ${checked ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`
                                                    }>
                                                        <LineChartIcon className="w-6 h-6 text-sky-400" />
                                                        <span className="text-sm font-medium text-white">Line Chart</span>
                                                    </RadioGroup.Option>
                                                    <RadioGroup.Option value="pie" className={({ checked }) =>
                                                        `cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-3 transition-all ${checked ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`
                                                    }>
                                                        <PieChartIcon className="w-6 h-6 text-rose-400" />
                                                        <span className="text-sm font-medium text-white">Pie Chart</span>
                                                    </RadioGroup.Option>
                                                </RadioGroup>
                                            </div>
                                            {(visualizationType === 'bar' || visualizationType === 'line') && dataKeys.stringKeys.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Category Axis (X-Axis)</label>
                                                        <select
                                                            value={chartCategoryKey || ''}
                                                            onChange={e => setChartCategoryKey(e.target.value)}
                                                            className="form-input"
                                                            aria-label="Select category axis"
                                                        >
                                                            <option value="" disabled>Select a text column</option>
                                                            {dataKeys.stringKeys.map(key => (
                                                                <option key={key} value={key}>{key}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Value Axis (Y-Axis)</label>
                                                        <select
                                                            multiple
                                                            value={chartValueKeys}
                                                            onChange={e => setChartValueKeys(Array.from(e.target.selectedOptions, option => option.value))}
                                                            className="form-input h-24"
                                                            aria-label="Select value axis"
                                                        >
                                                            {dataKeys.numberKeys.map(key => (
                                                                <option key={key} value={key}>{key}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple values.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {visualizationType === 'pie' && dataKeys.stringKeys.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Labels (Names)</label>
                                                        <select
                                                            value={chartCategoryKey || ''}
                                                            onChange={e => setChartCategoryKey(e.target.value)}
                                                            className="form-input"
                                                            aria-label="Select label column"
                                                        >
                                                            <option value="" disabled>Select a text column</option>
                                                            {dataKeys.stringKeys.map(key => (
                                                                <option key={key} value={key}>{key}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Value</label>
                                                        <select
                                                            value={pieValueKey || ''}
                                                            onChange={e => setPieValueKey(e.target.value)}
                                                            className="form-input"
                                                            aria-label="Select value column"
                                                        >
                                                            <option value="" disabled>Select a number column</option>
                                                            {dataKeys.numberKeys.map(key => (
                                                                <option key={key} value={key}>{key}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            {(visualizationType === 'bar' || visualizationType === 'line' || visualizationType === 'pie') && dataKeys.stringKeys.length === 0 && (
                                                <p className="text-amber-400 text-sm mt-4">Chart visualization requires data with at least one text column (for labels) and one number column (for values).</p>
                                            )}
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-4">
                                            <h4 className="text-white font-medium flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-purple-400" />
                                                Preview
                                            </h4>
                                            <div className="bg-black/30 border border-white/10 rounded-lg p-4 h-64 overflow-hidden flex flex-col">
                                                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{widgetName || 'Untitled Widget'}</div>
                                                <div className="flex-1 overflow-hidden border border-white/5 rounded bg-[#1e1e2e] min-h-0">
                                                    <GenericDataWidget config={{ data: rawData ? JSON.parse(rawData) : null, visualizationType, chartCategoryKey: chartCategoryKey || undefined, chartValueKeys, pieValueKey: pieValueKey || undefined }} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                Ready to create your widget? It will be added to your dashboard immediately.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
                                    <button
                                        onClick={handleBack}
                                        disabled={currentStep === 1}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStep === 1
                                            ? 'text-gray-600 cursor-not-allowed'
                                            : 'text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        Back
                                    </button>

                                    {currentStep < steps.length ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!isStepValid}
                                            className="px-6 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/20"
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            disabled={!isStepValid}
                                            onClick={handleCreateWidget}
                                            className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2"
                                        >
                                            <Wand2 className="w-4 h-4" />
                                            Create Widget
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
