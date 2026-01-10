import { useState, useRef, useEffect } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { ChatMessage } from "../../types";

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (msg: string) => void;
    isMobileOverlay?: boolean;
    onClose?: () => void;
    className?: string;
    myTeamName: string;
}

export const ChatBox = ({
    messages,
    onSendMessage,
    isMobileOverlay = false,
    onClose,
    className = "",
    myTeamName,
}: ChatBoxProps) => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    // Mobile overlay styles
    const overlayClasses = isMobileOverlay
        ? "fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        : "";

    const containerClasses = isMobileOverlay
        ? "w-full max-w-sm h-[70vh] bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border-2 border-gray-700/50 rounded-2xl shadow-2xl flex flex-col"
        : `bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl flex flex-col h-[400px] ${className}`;

    return (
        <div className={overlayClasses}>
            <div className="relative group">
                {!isMobileOverlay && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                )}
                <div className={containerClasses}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b-2 border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="font-bold text-white text-base">Team Chat</h3>
                        </div>
                        {isMobileOverlay && onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all duration-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="p-4 bg-gray-700/30 rounded-full mb-3">
                                    <MessageSquare className="w-12 h-12 text-gray-500" />
                                </div>
                                <p className="text-gray-400 font-medium">No messages yet</p>
                                <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.team_name === myTeamName;
                                return (
                                    <div
                                        key={index}
                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}
                                    >
                                        <span className={`text-xs font-semibold mb-1 px-2 ${isMe ? "text-blue-300" : "text-gray-400"
                                            }`}>
                                            {isMe ? "You" : msg.team_name}
                                        </span>
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm break-words shadow-lg ${isMe
                                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm"
                                                    : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 rounded-bl-sm border border-gray-600/50"
                                                }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t-2 border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-900/70 border-2 border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${input.trim()
                                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                                        : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
