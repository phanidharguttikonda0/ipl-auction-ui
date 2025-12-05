import { BookOpen } from "lucide-react";
import { AUCTION_RULES } from "../constants";
import { FeedbackForm } from "./FeedbackForm";

export const RulesPanel = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Auction Rules</h2>
        </div>
        <ul className="space-y-3">
          {AUCTION_RULES.map((rule, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-300 text-sm">
              <span className="text-blue-400 mt-1">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <FeedbackForm />
    </div>
  );
};
