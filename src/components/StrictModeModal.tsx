
import { X, ShieldAlert, Award, PlayCircle, Lock, Crown, CheckCircle2, TrendingUp } from "lucide-react";

interface StrictModeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StrictModeModal = ({ isOpen, onClose }: StrictModeModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient background */}
                <div className="relative bg-gradient-to-r from-red-900/40 via-purple-900/40 to-blue-900/40 p-6 border-b border-gray-700/50 flex-shrink-0">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldAlert className="w-32 h-32 text-red-500" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/10">
                                <ShieldAlert className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">STRICT MODE RULES</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20">PRO</span>
                                    <p className="text-gray-400 text-sm">Strategic Bidding Architecture</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0">

                    {/* Rules Section Grid */}
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Rule 1: Spending Limits */}
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:bg-gray-800/60 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-blue-200">1. Stage-Based Spending Limits</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    { label: "First 5 Players", value: "Max 50 Cr" },
                                    { label: "First 10 Players", value: "Max 90 Cr" },
                                    { label: "First 12 Players", value: "Max 96 Cr" },
                                    { label: "All 15 Players", value: "Full 100 Cr" },
                                ].map((item, i) => (
                                    <li key={i} className="flex justify-between items-center text-sm p-2 bg-gray-900/50 rounded-lg border border-gray-700/30">
                                        <span className="text-gray-400">{item.label}</span>
                                        <span className="text-white font-mono font-semibold">{item.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Rule 2: Minimum Balance */}
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:bg-gray-800/60 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-green-200">2. Mandatory Balance Safekeep</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">Minimum balance required after each stage to prevent bankruptcy:</p>
                            <div className="space-y-2">
                                {[
                                    { stage: "After 5 Players", req: "50 Cr" },
                                    { stage: "After 10 Players", req: "10 Cr" },
                                    { stage: "After 12 Players", req: "4 Cr" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-gray-300 flex-1">{item.stage}</span>
                                        <span className="text-sm font-bold text-green-400">{item.req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rule 3: Buffer Protection */}
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 hover:bg-gray-800/60 transition-colors group md:col-span-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-purple-200">3. Deadlock Prevention (Per-Player Buffer)</h3>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { label: "Players 1-5", val: "5 Cr / player", desc: "Reserved per remaining player" },
                                    { label: "Players 6-10", val: "4 Cr / player", desc: "Reserved per remaining player" },
                                    { label: "Players 11-15", val: "1 Cr / player", desc: "Reserved per remaining player" },
                                ].map((item, i) => (
                                    <div key={i} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/30 text-center">
                                        <p className="text-purple-300 font-bold text-sm mb-1">{item.label}</p>
                                        <p className="text-white font-mono text-lg font-bold">{item.val}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-gray-500 text-sm mt-3 text-center italic">
                                Calculated as: <code className="bg-gray-900 px-1 py-0.5 rounded text-gray-300">Max Bid = Balance - Required Buffer - Stage Min Balance</code>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4"></div>

                    {/* Benefits Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Award className="w-6 h-6 text-yellow-400" />
                            <h3 className="text-2xl font-bold text-white">Why Choose Strict Mode?</h3>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: "No Deadlocks", desc: "Impossible to run out of money before completing squad.", icon: CheckCircle2, color: "text-green-400" },
                                { title: "Strategic Depth", desc: "Planning required. No reckless spending early on.", icon: Crown, color: "text-yellow-400" },
                                { title: "Fair Competition", desc: "Prevents rich-player dominance. Equal opportunities.", icon: TrendingUp, color: "text-blue-400" },
                                { title: "Realistic IPL Feel", desc: "Mimics real auction constraints and professionalism.", icon: PlayCircle, color: "text-red-400" },
                                { title: "Smooth Flow", desc: "No pauses, calculations, or invalid bid arguments.", icon: PlayCircle, color: "text-purple-400" },
                                { title: "Better UX", desc: "Clear limits. You always know your exact max bid.", icon: CheckCircle2, color: "text-teal-400" },
                            ].map((benefit, i) => (
                                <div key={i} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <benefit.icon className={`w-5 h-5 ${benefit.color} mt-1 flex-shrink-0`} />
                                        <div>
                                            <h4 className="text-white font-semibold text-sm">{benefit.title}</h4>
                                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer - Fixed at bottom */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        Start with Strict Mode
                    </button>
                </div>
            </div>
        </div>
    );
};
