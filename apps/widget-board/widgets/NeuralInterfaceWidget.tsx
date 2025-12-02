import React from 'react';
import { MatrixWidgetWrapper } from '../src/components/MatrixWidgetWrapper';
import { ThreeBrain } from '../src/components/3d/ThreeBrain';
import { HoloEditor } from '../src/components/3d/HoloEditor';
import { DataStream } from '../src/components/3d/DataStream';
import { Maximize, Share2 } from 'lucide-react';

const NeuralInterfaceWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  return (
    <MatrixWidgetWrapper 
        title="NEURAL INTERFACE" 
        className="h-full w-full"
        controls={
            <div className="flex gap-2">
                <button className="text-cyan-400 hover:text-white"><Share2 size={14} /></button>
                <button className="text-cyan-400 hover:text-white"><Maximize size={14} /></button>
            </div>
        }
    >
      <div className="relative w-full h-full bg-black overflow-hidden">
        <ThreeBrain />
        <HoloEditor />
        <DataStream />
      </div>
    </MatrixWidgetWrapper>
  );
};

export default NeuralInterfaceWidget;
