import { useState } from "react";
import { X, Copy, Check, Heart } from "lucide-react";

interface DonateModalProps {
    onClose: () => void;
}

export const DonateModal = ({ onClose }: DonateModalProps) => {
    const [copied, setCopied] = useState(false);
    const upiId = "88858587602004@ibl";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(upiId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-700/50 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Support This Project</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Heartfelt Message */}
                    <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-5">
                        <p className="text-gray-200 text-center leading-relaxed">
                            If you love this application and appreciate the effort put into creating it,
                            your support would mean the world! 💝 I've built this platform with a commitment
                            to keeping it completely <span className="text-pink-300 font-semibold">ad-free</span>,
                            ensuring the best possible experience for all cricket lovers to enjoy.
                        </p>
                        <p className="text-gray-200 text-center leading-relaxed mt-3">
                            Every contribution helps keep this project alive, ad-free, and motivates me
                            to build more amazing features for you.
                        </p>
                        <p className="text-pink-300 text-center mt-3 font-semibold italic">
                            Thank you for being awesome! 🙏✨
                        </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <img
                                src="/UPI.jpeg"
                                alt="UPI Payment QR Code"
                                className="w-64 h-64 object-contain rounded-lg"
                            />
                        </div>
                    </div>

                    {/* UPI ID Section */}
                    <div className="space-y-3">
                        <p className="text-sm text-gray-400 text-center font-medium">
                            Or scan the QR code above, or copy the UPI ID:
                        </p>
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                            <button
                                onClick={handleCopy}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${copied
                                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>UPI ID Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5" />
                                        <span>Copy UPI ID</span>
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Click to copy the UPI ID to clipboard
                            </p>
                        </div>
                    </div>

                    {/* Footer Message */}
                    <div className="text-center pt-2">
                        <p className="text-gray-400 text-sm">
                            Your generosity fuels creativity! 🚀
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
