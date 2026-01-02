import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
    return (
        <div
            className={`glass-strong rounded-xl p-6 hover:scale-105 transition-all duration-300 group animate-slide-up stagger-${delay}`}
            style={{ animationFillMode: 'both' }}
        >
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};
