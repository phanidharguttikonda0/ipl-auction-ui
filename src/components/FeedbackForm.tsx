import { useState } from "react";
import { MessageSquare, Star, Bug, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "../services/api";

type FeedbackType = "rating" | "bug" | "improvements";

export const FeedbackForm = () => {
    const [feedbackType, setFeedbackType] = useState<FeedbackType>("rating");
    const [rating, setRating] = useState<number>(5);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validation
        if (feedbackType === "rating" && (rating < 1 || rating > 5)) {
            setMessage({ type: "error", text: "Please provide a valid rating (1-5)" });
            setLoading(false);
            return;
        }

        if ((feedbackType === "bug" || feedbackType === "improvements") && !description.trim()) {
            setMessage({ type: "error", text: "Please provide a description" });
            setLoading(false);
            return;
        }

        if ((feedbackType === "bug" || feedbackType === "improvements") && !title.trim()) {
            setMessage({ type: "error", text: "Please provide a title" });
            setLoading(false);
            return;
        }

        try {
            await apiClient.submitFeedback({
                feedback_type: feedbackType,
                rating_value: feedbackType === "rating" ? rating : undefined,
                title: title.trim() || undefined,
                description: description.trim() || undefined,
            });

            setMessage({ type: "success", text: "Thank you for your feedback!" });
            // Reset form
            setTitle("");
            setDescription("");
            setRating(5);

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to submit feedback" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Give Feedback</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback Type Selector */}
                <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setFeedbackType("rating")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors ${feedbackType === "rating"
                                ? "bg-gray-700 text-white shadow-sm"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                            }`}
                    >
                        <Star className="w-3 h-3" />
                        Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setFeedbackType("bug")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors ${feedbackType === "bug"
                                ? "bg-gray-700 text-white shadow-sm"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                            }`}
                    >
                        <Bug className="w-3 h-3" />
                        Bug
                    </button>
                    <button
                        type="button"
                        onClick={() => setFeedbackType("improvements")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors ${feedbackType === "improvements"
                                ? "bg-gray-700 text-white shadow-sm"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                            }`}
                    >
                        <Zap className="w-3 h-3" />
                        Idea
                    </button>
                </div>

                {/* Rating Input */}
                {feedbackType === "rating" && (
                    <div className="flex justify-center gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-8 h-8 ${star <= rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-600"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                )}

                {/* Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={feedbackType === "rating" ? "Short summary (optional)" : "Title"}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    required={feedbackType !== "rating"}
                />

                {/* Description Input */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                        feedbackType === "rating"
                            ? "Tell us more about your experience (optional)..."
                            : feedbackType === "bug"
                                ? "Describe the bug and how to reproduce it..."
                                : "Describe your idea for improvement..."
                    }
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                    required={feedbackType !== "rating"}
                />

                {/* Message Display */}
                {message && (
                    <div
                        className={`flex items-center gap-2 text-sm p-3 rounded-lg ${message.type === "success"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        "Submit Feedback"
                    )}
                </button>
            </form>
        </div>
    );
};
