import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';

const Chatbot = ({ meetingId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchChatHistory();
    }, [meetingId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChatHistory = async () => {
        try {
            const data = await chatAPI.getHistory(meetingId);
            setMessages(data.chatHistory || []);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setError('');
        setLoading(true);

        // Add user message to UI immediately
        const tempMessage = {
            id: Date.now(),
            message: userMessage,
            response: '',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            const data = await chatAPI.sendMessage(meetingId, userMessage);

            // Update with actual response
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === tempMessage.id
                        ? { ...msg, response: data.response }
                        : msg
                )
            );
        } catch (error) {
            console.error('Chat error:', error);
            setError('Failed to send message');
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-base md:text-xl font-bold text-white tracking-tight">Meeting Assistant</h2>
                    <p className="text-white/40 text-[10px] md:text-xs mt-0.5">Powered by AI Context Engine</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Active</span>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-white/[0.02]">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 md:px-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-medium text-base md:text-lg mb-2">Ready to assist you</h3>
                        <p className="text-white/40 text-xs md:text-sm max-w-xs leading-relaxed">
                            Ask me anything about the meeting transcript, key decisions, or assigned tasks.
                        </p>
                        <div className="mt-6 md:mt-8 grid grid-cols-1 gap-2 w-full max-w-xs">
                            <button onClick={() => setInput("Summarize the key points")} className="text-left px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-white/60 text-[11px] md:text-xs hover:bg-white/10 hover:text-white transition-all">
                                "Summarize the key points"
                            </button>
                            <button onClick={() => setInput("What are the next steps?")} className="text-left px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-white/60 text-[11px] md:text-xs hover:bg-white/10 hover:text-white transition-all">
                                "What are the next steps?"
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={msg.id || index} className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* User Message */}
                            <div className="flex justify-end items-start gap-2 md:gap-3">
                                <div className="flex flex-col items-end max-w-[90%] md:max-w-[85%]">
                                    <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tr-none px-3 md:px-4 py-2 md:py-3 shadow-sm">
                                        <p className="text-white/90 text-xs md:text-sm leading-relaxed">{msg.message}</p>
                                    </div>
                                    <span className="text-[10px] text-white/30 mt-1.5 font-medium uppercase tracking-tighter">You</span>
                                </div>
                            </div>

                            {/* Bot Response */}
                            <div className="flex justify-start items-start gap-2 md:gap-3">
                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/5">
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col items-start max-w-[90%] md:max-w-[85%]">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-3 md:px-4 py-2 md:py-3 shadow-sm w-full">
                                        {msg.response ? (
                                            <p className="text-white/80 text-xs md:text-sm whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                                                {msg.response}
                                            </p>
                                        ) : (
                                            <div className="flex items-center gap-1.5 py-1">
                                                <div className="h-1.5 w-1.5 bg-indigo-400/60 rounded-full animate-bounce"></div>
                                                <div className="h-1.5 w-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="h-1.5 w-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-white/30 mt-1.5 font-medium uppercase tracking-tighter">Assistant</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-4 md:mx-6 mb-3 md:mb-4 p-2.5 md:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] md:text-xs flex items-center gap-2 animate-in shake duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Input Form */}
            <div className="p-4 md:p-6 bg-white/5 border-t border-white/10">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about this meeting..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 md:pl-4 pr-12 md:pr-14 py-2.5 md:py-3.5 text-white text-xs md:text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all shadow-inner"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-1.5 md:right-2 p-1.5 md:p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white rounded-lg transition-all duration-200 group"
                    >
                        {loading ? (
                            <div className="h-4 w-4 md:h-5 md:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
                <div className="mt-2 md:mt-3 flex items-center justify-between px-1">
                    <p className="text-[9px] md:text-[10px] text-white/20 font-medium uppercase tracking-widest">Enter to send</p>
                    <p className="text-[9px] md:text-[10px] text-white/20 font-medium uppercase tracking-widest">AI may generate inaccurate info</p>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;