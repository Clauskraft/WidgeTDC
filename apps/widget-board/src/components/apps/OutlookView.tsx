import React, { useState, useEffect } from 'react';
import { Mail, Send, Sparkles, RefreshCw, Check, Clock, AlertCircle } from 'lucide-react';

interface EmailSuggestion {
    id: string;
    from: string;
    subject: string;
    preview: string;
    receivedAt: string;
    importance: 'high' | 'normal' | 'low';
    suggestedReplies: string[];
    isProcessing?: boolean;
}

export const OutlookView: React.FC = () => {
    const [emails, setEmails] = useState<EmailSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReply, setSelectedReply] = useState<{ emailId: string; reply: string } | null>(null);

    // Fetch emails from backend
    useEffect(() => {
        const fetchEmails = async () => {
            try {
                // Try to fetch from backend MCP
                const response = await fetch('/api/mcp/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tool: 'email.rag',
                        payload: { action: 'list', limit: 5 }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.emails && Array.isArray(data.emails)) {
                        // Transform backend data to our format with AI suggestions
                        const emailsWithSuggestions = data.emails.map((email: any) => ({
                            id: email.id,
                            from: email.sender?.name || email.from || 'Ukendt',
                            subject: email.subject || 'Ingen emne',
                            preview: email.bodyPreview || email.preview || '',
                            receivedAt: formatDate(email.receivedDateTime || email.date),
                            importance: email.importance || 'normal',
                            suggestedReplies: generateSuggestions(email)
                        }));
                        setEmails(emailsWithSuggestions);
                        setLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.log('[OutlookView] Backend not available, using demo data');
            }

            // Fallback to demo data if backend fails
            setEmails([
                {
                    id: '1',
                    from: 'Lars Jensen',
                    subject: 'Projektstatus Q2 - Kræver svar',
                    preview: 'Hej Claus, kan du bekræfte at vi er klar til launch næste uge?',
                    receivedAt: 'I dag, 10:30',
                    importance: 'high',
                    suggestedReplies: [
                        'Ja, vi er klar til launch som planlagt.',
                        'Jeg har brug for lidt mere tid - kan vi tage et møde?',
                        'Lad mig vende tilbage inden kl. 15 med en status.'
                    ]
                },
                {
                    id: '2',
                    from: 'Mette Hansen',
                    subject: 'Frokostmøde i morgen?',
                    preview: 'Har du tid til at spise frokost i morgen kl. 12?',
                    receivedAt: 'I dag, 09:15',
                    importance: 'normal',
                    suggestedReplies: [
                        'Ja, det lyder godt! Ses kl. 12.',
                        'Desværre, jeg har møde. Hvad med torsdag?',
                        'Måske - jeg vender tilbage senere i dag.'
                    ]
                },
                {
                    id: '3',
                    from: 'Support Team',
                    subject: 'URGENT: Server nedbrud',
                    preview: 'Server 3 er nede. Kan du tjekke logs hurtigst muligt?',
                    receivedAt: 'I dag, 08:45',
                    importance: 'high',
                    suggestedReplies: [
                        'Jeg kigger på det med det samme.',
                        'Har eskaleret til DevOps teamet.',
                        'Kan du sende mig log-filerne?'
                    ]
                }
            ]);
            setLoading(false);
        };

        fetchEmails();
    }, []);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Ukendt';
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return `I dag, ${date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
    };

    const generateSuggestions = (email: any): string[] => {
        // Simple rule-based suggestions - in production, use AI
        const subject = (email.subject || '').toLowerCase();
        const body = (email.bodyPreview || email.body?.content || '').toLowerCase();

        if (subject.includes('møde') || body.includes('møde')) {
            return ['Ja, jeg deltager.', 'Desværre, jeg kan ikke den dag.', 'Kan vi flytte det?'];
        }
        if (subject.includes('urgent') || email.importance === 'high') {
            return ['Jeg kigger på det nu.', 'Tak for heads up - er på det.', 'Kan du give flere detaljer?'];
        }
        if (body.includes('?')) {
            return ['Ja, det er korrekt.', 'Nej, lad mig forklare...', 'Godt spørgsmål - jeg vender tilbage.'];
        }
        return ['Tak for beskeden.', 'Modtaget - jeg vender tilbage.', 'Noteret.'];
    };

    const handleSendReply = async (emailId: string, reply: string) => {
        setSelectedReply({ emailId, reply });
        
        // Mark as processing
        setEmails(prev => prev.map(e => 
            e.id === emailId ? { ...e, isProcessing: true } : e
        ));

        // Simulate sending (in production, call backend)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Remove the email from list after "sending"
        setEmails(prev => prev.filter(e => e.id !== emailId));
        setSelectedReply(null);
    };

    const getImportanceIcon = (importance: string) => {
        if (importance === 'high') return <AlertCircle size={14} className="text-red-400" />;
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="animate-spin text-[#00B5CB]" size={24} />
            </div>
        );
    }

    return (
        <div className="h-full bg-[#0B3E6F]/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00B5CB]/20 rounded-lg">
                            <Sparkles size={20} className="text-[#00B5CB]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Email Svarforslag</h3>
                            <p className="text-xs text-gray-400">{emails.length} emails kræver svar</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Email List with Suggestions */}
            <div className="overflow-y-auto max-h-[calc(100%-80px)]">
                {emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Check size={48} className="mb-4 text-green-400" />
                        <p className="font-medium">Alle emails besvaret!</p>
                        <p className="text-sm text-gray-500">Ingen ventende svar</p>
                    </div>
                ) : (
                    emails.map((email) => (
                        <div 
                            key={email.id} 
                            className={`p-4 border-b border-white/5 ${email.isProcessing ? 'opacity-50' : ''}`}
                        >
                            {/* Email Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                        {email.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">{email.from}</span>
                                            {getImportanceIcon(email.importance)}
                                        </div>
                                        <span className="text-xs text-gray-500">{email.receivedAt}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subject & Preview */}
                            <div className="mb-3 pl-10">
                                <p className="text-sm font-medium text-gray-200 mb-1">{email.subject}</p>
                                <p className="text-xs text-gray-400 line-clamp-2">{email.preview}</p>
                            </div>

                            {/* AI Suggested Replies */}
                            <div className="pl-10 space-y-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                    <Sparkles size={12} className="text-[#00B5CB]" />
                                    <span>Foreslåede svar:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {email.suggestedReplies.map((reply, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendReply(email.id, reply)}
                                            disabled={email.isProcessing}
                                            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-[#00B5CB]/20 border border-white/10 hover:border-[#00B5CB]/30 rounded-full text-gray-300 hover:text-white transition-all flex items-center gap-1.5 group"
                                        >
                                            <span>{reply}</span>
                                            <Send size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
