      <p>Initializing WidgeTDC Pro...</p>
      <div className="mt-4 flex gap-1 justify-center">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div >
  </div >
);

export default function App() {
  return (
    <PlatformProvider>
      <Suspense fallback={<AppLoader />}>
        <WidgetRegistryProvider>
          <WidgeTDCPro />
        </WidgetRegistryProvider>
      </Suspense>
    </PlatformProvider>
  );
}