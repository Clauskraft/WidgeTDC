import React, { forwardRef } from 'react';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';

interface TrashDropzoneProps {
  isVisible: boolean;
  isActive: boolean;
}

const TrashDropzone = forwardRef<HTMLDivElement, TrashDropzoneProps>(({ isVisible, isActive }, ref) => {
  const classes = `trash-dropzone ${isVisible ? 'is-visible' : ''} ${isActive ? 'is-active' : ''}`;

  return (
    <div ref={ref} className={classes}>
      <div className="trash-icon">
        <MicrosoftIcons.Trash />
      </div>
      <span className="font-semibold text-lg">Træk hertil for at slette</span>
    </div>
  );
});

TrashDropzone.displayName = 'TrashDropzone';

export default TrashDropzone;
