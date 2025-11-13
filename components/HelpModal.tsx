import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sectionTitleClasses = "text-xl font-bold mb-3 text-gray-800 dark:text-gray-100";
  const subTitleClasses = "text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200";
  const paragraphClasses = "mb-3 text-gray-600 dark:text-gray-300";
  const codeClasses = "px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded font-mono text-blue-600 dark:text-blue-300";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Hjælp og Vejledning</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Luk"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className={sectionTitleClasses}>Boardets Funktioner</h3>
            <p className={paragraphClasses}>
              WidgetBoard er et fleksibelt og modulært dashboard. Du kan tilpasse dit layout ved at tilføje, fjerne, trække og ændre størrelsen på widgets.
            </p>
            <h4 className={subTitleClasses}>Grundlæggende Funktioner</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li><b>Tilføj Widgets:</b> Åbn sidebaren til venstre og klik på et widget-navn for at tilføje det til dit dashboard.</li>
              <li><b>Flyt Widgets:</b> Klik og træk i toppen af et widget (ved titlen) for at flytte det til en ny position.</li>
              <li><b>Ændre Størrelse:</b> Klik og træk i nederste højre hjørne af et widget for at ændre dets størrelse.</li>
              <li><b>Fjern Widgets:</b> Klik på krydset (X) i øverste højre hjørne af et widget for at fjerne det.</li>
            </ul>
            <h4 className={subTitleClasses}>Indstillinger</h4>
            <p className={paragraphClasses}>
              Globale indstillinger kan findes i sidebaren og i "Systemindstillinger" widget'en.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li><b>Dark Mode:</b> Skift mellem lyst og mørkt tema for hele applikationen.</li>
              <li><b>Reducer Bevægelse:</b> Deaktiver animationer for en mere statisk oplevelse, hvilket kan forbedre tilgængeligheden.</li>
            </ul>
          </section>

          <section>
            <h3 className={sectionTitleClasses}>Vejledning for Udviklere: Byg et Nyt Widget</h3>
            <p className={paragraphClasses}>
              At bygge et nyt widget til WidgetBoard er designet til at være enkelt. Følg disse trin for at oprette dit eget widget.
            </p>
            <h4 className={subTitleClasses}>1. Opret Widget Komponenten</h4>
            <p className={paragraphClasses}>
              Opret en ny <code className={codeClasses}>.tsx</code> fil i <code className={codeClasses}>src/widgets/</code> mappen (f.eks., <code className={codeClasses}>MyAwesomeWidget.tsx</code>).
              Komponenten skal være en React Functional Component og modtage <code className={codeClasses}>widgetId: string</code> som prop.
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-sm overflow-x-auto">
{`import React from 'react';

const MyAwesomeWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  return (
    <div className="h-full flex flex-col -m-4">
      {/* Brug -m-4 for at fjerne padding fra containeren */}
      <div className="p-4">
        <h3 className="font-bold">Mit Fantastiske Widget!</h3>
        <p>Widget ID: {widgetId}</p>
      </div>
    </div>
  );
};

export default MyAwesomeWidget;`}
            </pre>

            <h4 className={subTitleClasses}>2. Registrer Widget'en</h4>
            <p className={paragraphClasses}>
              Åbn <code className={codeClasses}>src/constants.ts</code> og tilføj din nye widget til <code className={codeClasses}>WIDGET_DEFINITIONS</code> array'et.
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-sm overflow-x-auto">
{`import MyAwesomeWidget from './widgets/MyAwesomeWidget';
// ... andre imports

import { WidgetDefinition } from './types';

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // ... eksisterende widgets
  {
    id: 'MyAwesomeWidget', // Unikt ID
    name: 'Mit Fantastiske Widget', // Vises i sidebaren
    component: MyAwesomeWidget, // Komponenten du lige har lavet
    defaultLayout: { w: 4, h: 5 } // Standard bredde og højde i grid-enheder
  }
];`}
            </pre>
            <h4 className={subTitleClasses}>Bedste Praksis</h4>
             <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li><b>Styling:</b> Brug Tailwind CSS for at sikre et konsistent design. Dit widget skal være responsivt inden for sin container.</li>
                <li><b>Global State:</b> Importer <code className={codeClasses}>useGlobalState</code> fra <code className={codeClasses}>'./contexts/GlobalStateContext'</code> for at gøre dit widget opmærksom på temaet (dark/light) og andre globale indstillinger.</li>
                <li><b>Selvstændighed:</b> Widgets bør være så selvstændige som muligt og håndtere deres egen state, datahentning, loading og fejlstatus.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HelpModal;
