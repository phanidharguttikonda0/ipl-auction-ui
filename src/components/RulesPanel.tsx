import { BookOpen } from "lucide-react";
import { AUCTION_RULES } from "../constants";
import { FeedbackForm } from "./FeedbackForm";

export const RulesPanel = () => {
  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Auction Rules</h2>
          </div>
          <ul className="space-y-4">
            {AUCTION_RULES.map((rule, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300 text-sm group/item">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center mt-0.5 border border-blue-500/20 group-hover/item:bg-blue-500/20 transition-colors">
                  <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                </div>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FeedbackForm />
    </div>
  );
};
