import React, { lazy } from 'react';
import { ModuleGrid, ModuleCard } from './ModuleGrid';

const FeedIngestionWidget = lazy(() => import('../../../widgets/FeedIngestionWidget'));
const SearchInterfaceWidget = lazy(() => import('../../../widgets/SearchInterfaceWidget'));
const VideoAnalyzerWidget = lazy(() => import('../../../widgets/VideoAnalyzerWidget'));
const ImageAnalyzerWidget = lazy(() => import('../../../widgets/ImageAnalyzerWidget'));
const AudioTranscriberWidget = lazy(() => import('../../../widgets/AudioTranscriberWidget'));
const ProcurementIntelligenceWidget = lazy(() => import('../../../widgets/ProcurementIntelligenceWidget'));

export default function IntelCenterView() {
  return (
    <ModuleGrid>
      <ModuleCard title="Global Feed Ingestion" colSpan={2} rowSpan={2}>
        <FeedIngestionWidget widgetId="feed-ingestion" />
      </ModuleCard>
      <ModuleCard title="Deep Web Search">
        <SearchInterfaceWidget widgetId="search-interface" />
      </ModuleCard>
      <ModuleCard title="Visual Intelligence (Image)">
        <ImageAnalyzerWidget widgetId="image-analyzer" />
      </ModuleCard>
      <ModuleCard title="Video Forensics">
        <VideoAnalyzerWidget widgetId="video-analyzer" />
      </ModuleCard>
      <ModuleCard title="Audio Signals">
        <AudioTranscriberWidget widgetId="audio-transcriber" />
      </ModuleCard>
      <ModuleCard title="Procurement Radar">
        <ProcurementIntelligenceWidget widgetId="procurement-radar" />
      </ModuleCard>
    </ModuleGrid>
  );
}
