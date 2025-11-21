import React, { useEffect, useState } from 'react';
import AcrylicCard from '../components/AcrylicCard';

/**
 * AgentTeamBuilderWidget
 * ----------------------
 * This widget creates a "team of agents" that perform flow‑tests and usability‑tests.
 *
 * Requirements (as requested by the user):
 *   • 22 groups
 *   • Each group contains 20 agents (one per area)
 *   • Every group runs 5 test‑passes (iterations)
 *
 * The widget simply generates this data structure on mount and renders a compact
 * overview table. It does **not** perform any real testing – the purpose is to
 * visualise the configuration inside the dashboard.
 */
interface Agent {
    id: string;
    area: string;
}

interface Group {
    id: string;
    agents: Agent[];
    passes: number; // number of test passes to run (fixed to 5)
}

export const AgentTeamBuilderWidget: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);

    useEffect(() => {
        const generatedGroups: Group[] = [];
        for (let g = 1; g <= 22; g++) {
            const agents: Agent[] = [];
            for (let a = 1; a <= 20; a++) {
                agents.push({
                    id: `G${g}-A${a}`,
                    area: `Area ${a}`,
                });
            }
            generatedGroups.push({
                id: `Group-${g}`,
                agents,
                passes: 5,
            });
        }
        setGroups(generatedGroups);
    }, []);

    return (
        <AcrylicCard
            isDarkMode={false}
            title="Agent Team Builder"
            className="h-full"
        >
            <div className="overflow-auto h-full">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                            <th className="p-2 text-left">Group</th>
                            <th className="p-2 text-left">Agents (count)</th>
                            <th className="p-2 text-left">Passes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((g) => (
                            <tr key={g.id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-2">{g.id}</td>
                                <td className="p-2">{g.agents.length}</td>
                                <td className="p-2">{g.passes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AcrylicCard>
    );
};

export default AgentTeamBuilderWidget;
