/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    COGNITIVE NODE WIDGET                                   ║
 * ║═══════════════════════════════════════════════════════════════════════════║
 * ║  Widget wrapper for CognitiveNode component                                ║
 * ║  Displays real-time Neural Bridge system status                            ║
 * ║  Handover #007 - Visual Cortex Activation                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { CognitiveNode } from '../src/components/CognitiveNode';

const CognitiveNodeWidget: React.FC = () => {
    return <CognitiveNode />;
};

export default CognitiveNodeWidget;
