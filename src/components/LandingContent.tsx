import { Users, DollarSign, UserCircle, Coins } from "lucide-react";

export const LandingContent = () => {
    const features = [
        {
            icon: Users,
            title: "Create or Join Rooms",
            description: "Start your own auction or join friends with a simple room code",
        },
        {
            icon: UserCircle,
            title: "Pick Your Favorite Team",
            description: "Choose from all 10 IPL teams and build your dream squad",
        },
        {
            icon: DollarSign,
            title: "Smart Bidding",
            description: "100 Crore budget to build a squad of 15-25 players strategically",
        },
        {
            icon: Coins,
            title: "Live Player Auctions",
            description: "Bid against friends in real-time for top cricket players",
        },
    ];

    return (
        <div className="h-full flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12 relative overflow-hidden">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }} className="animate-grid"></div>
            </div>

            <div className="relative z-10">
                {/* Main Headline */}
                <div className="mb-12 animate-fade-in-up">
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                        <span className="text-sm font-medium text-indigo-300">Auctions Happening Now</span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                        Build Your<br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Dream Team
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 leading-relaxed max-w-xl font-light">
                        Experience the excitement of IPL auctions with your friends. Bid, strategize, and create your ultimate cricket team.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 animate-fade-in-up delay-${(index + 2) * 100}`}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Bar */}
                <div className="animate-fade-in-up delay-600">
                    <div className="grid grid-cols-3 gap-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">10</div>
                            <div className="text-sm text-slate-400">IPL Teams</div>
                        </div>
                        <div className="text-center border-x border-white/10">
                            <div className="text-3xl font-bold text-white mb-1">100Cr</div>
                            <div className="text-sm text-slate-400">Starting Budget</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">15+</div>
                            <div className="text-sm text-slate-400">Players to Buy</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-tr from-pink-600/20 to-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
    );
};
