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
        ? "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        : "";

    const containerClasses = isMobileOverlay
        ? "w-full max-w-sm h-[70vh] bg-gray-900/80 border border-gray-700 rounded-xl shadow-2xl flex flex-col"
        : `bg-gray-800/50 border border-gray-700 rounded-xl flex flex-col h-[400px] ${className}`;

    return (
        <div className={overlayClasses}>
            <div className={containerClasses}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-white text-sm">Team Chat</h3>
                    </div>
                    {isMobileOverlay && onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                            <p>No messages yet</p>
                            <p className="text-xs">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.team_name === myTeamName;
                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"
                                        }`}
                                >
                                    <span className="text-[10px] text-gray-400 mb-0.5 px-1 truncate max-w-[150px]">
                                        {isMe ? "You" : msg.team_name}
                                    </span>
                                    <div
                                        className={`px-3 py-2 rounded-lg max-w-[85%] text-sm break-words ${isMe
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-gray-700 text-gray-200 rounded-bl-none"
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
                <div className="p-3 border-t border-gray-700 bg-gray-800/30 rounded-b-xl">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white transition flex items-center justify-center"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
