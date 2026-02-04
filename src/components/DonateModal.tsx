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

                    {/* Buy Me a Coffee - Primary Option */}
                    <div className="space-y-3">
                        <a
                            href="https://buymeacoffee.com/phanidhar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/50 text-yellow-200 font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 hover:scale-105"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.164 0-.13.24.05.481.094.724.13.078.011.172.026.258.036.377.051.758.086 1.157.107 1.178.076 2.359.074 3.536-.006.422-.038.916-.072 1.382-.146.377-.058.71.09.834.473.104.321-.122.78-.474.834-.298.046-.597.086-.896.119-1.213.128-2.432.168-3.65.118-1.098-.04-2.212-.132-3.287-.37a4.792 4.792 0 01-1.123-.366c-.277-.124-.538-.313-.692-.58-.216-.376-.12-.844.177-1.146.242-.245.57-.385.888-.501.87-.316 1.835-.417 2.75-.5a25.834 25.834 0 013.7-.062c1.027.056 2.077.153 3.077.416.211.055.416.115.626.194.399.154.8.388.996.788.148.297.193.662.25.987.067.377.127.755.192 1.133.035.206.079.429.231.572.15.143.373.172.57.241.613.216.882.781 1.001 1.379.043.221.08.443.132.666.45 1.932.451 3.956.451 5.902 0 1.698 0 3.45-.135 5.14-.061.768-.272 1.559-.776 2.165-.578.693-1.484 1.046-2.375 1.234-.866.183-1.75.243-2.628.243-2.309 0-4.616-.002-6.925-.002h-.331c-.882 0-1.764-.06-2.629-.243-.891-.188-1.797-.541-2.375-1.234-.504-.606-.715-1.397-.776-2.165-.135-1.69-.135-3.442-.135-5.14 0-1.946.001-3.97.451-5.902z" />
                            </svg>
                            <span>Buy Me a Coffee</span>
                        </a>
                    </div>

                    {/* Separator */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-gray-900 text-gray-400">Or support via UPI</span>
                        </div>
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
                            Scan the QR code above, or copy the UPI ID:
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
