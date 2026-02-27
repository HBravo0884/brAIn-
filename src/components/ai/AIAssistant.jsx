import { useState } from 'react';
import { Bot, Send, Loader, Sparkles, TrendingUp, FileText, DollarSign } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import {
  chatWithClaude,
  analyzeBudget,
  generateProgressReport,
  categorizeExpense,
  generateBudgetForecast,
  summarizeMeetingNotes
} from '../../utils/ai';
import { useApp } from '../../context/AppContext';

const AIAssistant = ({ budgetId, grantId }) => {
  const { budgets, grants } = useApp();
  const budget = budgets.find(b => b.id === budgetId);
  const grant = grants.find(g => g.id === grantId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'analyze', 'generate'
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const quickActions = [
    {
      id: 'budget-analysis',
      icon: TrendingUp,
      label: 'Analyze Budget',
      description: 'Get AI insights on budget health',
      action: async () => {
        if (!budget) {
          alert('No budget selected');
          return;
        }
        setIsLoading(true);
        setActiveTab('analyze');
        try {
          const analysis = await analyzeBudget(budget, grant);
          setAiResponse(analysis);
        } catch (error) {
          setAiResponse(`Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'progress-report',
      icon: FileText,
      label: 'Generate Report',
      description: 'Create progress report',
      action: async () => {
        if (!grant || !budget) {
          alert('No grant/budget selected');
          return;
        }
        setIsLoading(true);
        setActiveTab('generate');
        try {
          const report = await generateProgressReport(grant, budget);
          setAiResponse(report);
        } catch (error) {
          setAiResponse(`Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      id: 'budget-forecast',
      icon: DollarSign,
      label: 'Budget Forecast',
      description: 'Predict spending trajectory',
      action: async () => {
        if (!budget || !grant) {
          alert('No budget/grant selected');
          return;
        }
        setIsLoading(true);
        setActiveTab('analyze');
        try {
          const today = new Date();
          const endDate = new Date(grant.endDate);
          const remainingMonths = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 30)));
          const forecast = await generateBudgetForecast(budget, remainingMonths);
          setAiResponse(forecast);
        } catch (error) {
          setAiResponse(`Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithClaude(userMsg, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Make sure you've set up your API key in .env file.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        title="AI Assistant"
      >
        <Sparkles size={24} />
      </button>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Assistant"
        size="xl"
      >
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={isLoading}
                className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left disabled:opacity-50"
              >
                <action.icon size={20} className="text-purple-600 mb-2" />
                <p className="font-semibold text-sm text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('analyze')}
                className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'analyze'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'generate'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Generated Content
              </button>
            </div>
          </div>

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Ask me anything about your grant or budget!</p>
                    <p className="text-sm mt-2">I can help with analysis, recommendations, and documentation.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <Loader className="animate-spin text-purple-600" size={20} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Claude anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  variant="primary"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analyze' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader className="animate-spin text-purple-600" size={48} />
                </div>
              ) : aiResponse ? (
                <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
                      {aiResponse}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  <p>Click a quick action to generate analysis</p>
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader className="animate-spin text-purple-600" size={48} />
                </div>
              ) : aiResponse ? (
                <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-sm text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: aiResponse.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(aiResponse);
                        alert('Copied to clipboard!');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  <p>Click a quick action to generate content</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AIAssistant;
