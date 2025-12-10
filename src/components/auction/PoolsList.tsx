import { POOL_NAMES } from "../../constants";

interface PoolsListProps {
    selectedPoolId: number | null;
    onSelectPool: (poolId: number) => void;
    currentAuctionPoolId?: number;
}

export const PoolsList = ({ selectedPoolId, onSelectPool, currentAuctionPoolId }: PoolsListProps) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Player Pools</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(POOL_NAMES).map(([idStr, name]) => {
                    const id = parseInt(idStr);
                    const isSelected = selectedPoolId === id;
                    const isCurrent = currentAuctionPoolId === id;

                    return (
                        <button
                            key={id}
                            onClick={() => onSelectPool(id)}
                            className={`p-2 rounded-lg text-xs font-medium transition-all relative overflow-hidden flex flex-col items-center justify-center gap-1 min-h-[50px] ${isSelected
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400"
                                : isCurrent
                                    ? "bg-green-500/10 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            {isCurrent && (
                                <div className="absolute top-0 right-0 p-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                </div>
                            )}
                            <span className="text-center z-10">{name}</span>
                            {isCurrent && (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20">
                                    Live
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
