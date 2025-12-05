import React, { useCallback, useMemo } from 'react';
import { MicrosoftIcons } from '../assets/MicrosoftIcons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const sectionTitleClasses = 'text-xl font-bold mb-3 text-gray-800 dark:text-gray-100';
  const subTitleClasses = 'text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200';
  const paragraphClasses = 'mb-3 text-gray-600 dark:text-gray-300';
  const codeClasses = 'px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded font-mono text-blue-600 dark:text-blue-300';

  const content = useMemo(() => (
    <>
      <section>
        <h3 className={sectionTitleClasses}>Boardets Funktioner</h3>
        <p className={paragraphClasses}>
          WidgetBoard er et fleksibelt og modulært dashboard. Du kan tilpasse dit layout ved at
          tilføje, fjerne, trække og ændre størrelsen på widgets.
        </p>
        <h4 className={subTitleClasses}>Grundlæggende Funktioner</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
          <li>
            <b>Tilføj Widgets:</b> Åbn sidebaren til venstre og klik på et widget-navn for at
            tilføje det til dit dashboard.
          </li>
          <li>
            <b>Flyt Widgets:</b> Klik og træk i toppen af et widget (ved titlen) for at flytte
            det til en ny position.
          </li>
          <li>
            <b>Ændre Størrelse:</b> Klik og træk i nederste højre hjørne af et widget for at
            ændre dets størrelse.
          </li>
          <li>
            <b>Fjern Widgets:</b> Klik på krydset (X) i øverste højre hjørne af et widget for at
            fjerne det.
          </li>
        </ul>
        <h4 className={subTitleClasses}>Indstillinger</h4>
        <p className={paragraphClasses}>
          Globale indstillinger kan findes i sidebaren og i "Systemindstillinger" widget'en.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
          <li>
            <b>Dark Mode:</b> Skift mellem lyst og mørkt tema for hele applikationen.
          </li>
          <li>
            <b>Reducer Bevægelse:</b> Deaktiver animationer for en mere statisk oplevelse,
            hvilket kan forbedre tilgængeligheden.
          </li>
        </ul>
      </section>

      <section>
        <h3 className={sectionTitleClasses}>Vejledning for Udviklere: Byg et Nyt Widget</h3>
        <p className={paragraphClasses}>
          At bygge et nyt widget til WidgetBoard er designet til at være enkelt. Følg disse trin
          for at oprette dit eget widget.
        </p>
        <h4 className={subTitleClasses}>1. Opret Widget Komponenten</h4>
        <p className={paragraphClasses}>
          Opret en ny <code className={codeClasses}>.tsx</code> fil i{' '}
          <code className={codeClasses}>src/widgets/</code> mappen (f.eks.,{' '}
          <code className={codeClasses}>MyAwesomeWidget.tsx</code>). Komponenten skal være en
          React Functional Component.
        </p>
      </section>
    </>
  ), [sectionTitleClasses, subTitleClasses, paragraphClasses, codeClasses]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Hjælp og Vejledning"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={handleModalClick}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Hjælp og Vejledning</h2>
          <button
            onClick={onClose}
            className="ms-icon-button ms-focusable"
            title="Luk"
            aria-label="Luk hjælpedialog"
          >
            <MicrosoftIcons.Close />
          </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
          {content}
        </main>
      </div>
    </div>
  );
};

export default HelpModal;