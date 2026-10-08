import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, XCircle, ExternalLink, Eye, EyeOff, Save, Trash2, Shield } from 'lucide-react';
import { getConfigStatus, saveApiKey, hasApiKey, getMaskedKey } from '../lib/api';

export default function SettingsPage() {
  const [status, setStatus] = useState(getConfigStatus());
  const [geminiKey, setGeminiKey] = useState('');
  const [braveKey, setBraveKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showBrave, setShowBrave] = useState(false);
  const [saved, setSaved] = useState<{ gemini: boolean; brave: boolean }>({ gemini: false, brave: false });

  useEffect(() => {
    // Refresh status on mount
    setStatus(getConfigStatus());
  }, []);

  const handleSaveGemini = () => {
    saveApiKey('VITE_GEMINI_API_KEY', geminiKey);
    setStatus(getConfigStatus());
    setSaved(prev => ({ ...prev, gemini: true }));
    setGeminiKey('');
    setTimeout(() => setSaved(prev => ({ ...prev, gemini: false })), 3000);
  };

  const handleSaveBrave = () => {
    saveApiKey('VITE_BRAVE_SEARCH_API_KEY', braveKey);
    setStatus(getConfigStatus());
    setSaved(prev => ({ ...prev, brave: true }));
    setBraveKey('');
    setTimeout(() => setSaved(prev => ({ ...prev, brave: false })), 3000);
  };

  const handleClearGemini = () => {
    localStorage.removeItem('VITE_GEMINI_API_KEY');
    setStatus(getConfigStatus());
  };

  const handleClearBrave = () => {
    localStorage.removeItem('VITE_BRAVE_SEARCH_API_KEY');
    setStatus(getConfigStatus());
  };

  const apis = [
    {
      name: 'Gemini AI',
      envVar: 'VITE_GEMINI_API_KEY',
      description: 'Used for company analysis, scoring, and generating sales intelligence.',
      configured: status.gemini,
      setupUrl: 'https://aistudio.google.com/apikey',
      keyValue: geminiKey,
      setKeyValue: setGeminiKey,
      showValue: showGemini,
      setShowValue: setShowGemini,
      onSave: handleSaveGemini,
      onClear: handleClearGemini,
      justSaved: saved.gemini,
      maskedKey: getMaskedKey('VITE_GEMINI_API_KEY'),
    },
    {
      name: 'Brave Search',
      envVar: 'VITE_BRAVE_SEARCH_API_KEY',
      description: 'Used for finding real businesses via web search.',
      configured: status.braveSearch,
      setupUrl: 'https://brave.com/search/api/',
      keyValue: braveKey,
      setKeyValue: setBraveKey,
      showValue: showBrave,
      setShowValue: setShowBrave,
      onSave: handleSaveBrave,
      onClear: handleClearBrave,
      justSaved: saved.brave,
      maskedKey: getMaskedKey('VITE_BRAVE_SEARCH_API_KEY'),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-solar-600" />
          Settings & API Configuration
        </h1>
        <p className="text-gray-500 mt-1">
          Configure API keys securely. Keys are stored locally in your browser and never transmitted to our servers.
        </p>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-solar-600" />
          API Keys
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter your API keys below. They are stored securely in your browser's local storage and cannot be viewed once saved. 
          Keys persist across page refreshes until explicitly cleared.
        </p>

        <div className="space-y-6">
          {apis.map(api => (
            <div key={api.envVar} className="border border-gray-200 rounded-xl p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{api.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    api.configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {api.configured ? '✓ Configured' : '✕ Not configured'}
                  </span>
                </div>
                {api.configured && (
                  <button
                    onClick={api.onClear}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-3">{api.description}</p>

              {/* Current key status */}
              {api.configured && api.maskedKey && (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span>Stored key: <code className="font-mono">{api.maskedKey}</code></span>
                </div>
              )}

              {/* Input field */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={api.showValue ? 'text' : 'password'}
                    value={api.keyValue}
                    onChange={(e) => api.setKeyValue(e.target.value)}
                    placeholder={api.configured ? 'Enter new key to replace...' : 'Paste your API key here...'}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none font-mono text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => api.setShowValue(!api.showValue)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    title={api.showValue ? 'Hide' : 'Show'}
                  >
                    {api.showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={api.onSave}
                  disabled={!api.keyValue.trim()}
                  className="px-4 py-2.5 bg-solar-600 text-white text-sm font-medium rounded-lg hover:bg-solar-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>

              {/* Success message */}
              {api.justSaved && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Key saved successfully. It will persist until cleared or browser data is wiped.
                </div>
              )}

              {/* Get key link */}
              <div className="mt-3">
                <a
                  href={api.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  Get API key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-solar-600" />
          Security & Storage
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>API keys are stored in your browser's <strong>localStorage</strong> — they never leave your device.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Keys are masked after saving and <strong>cannot be viewed</strong> in plain text once stored.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Keys <strong>persist across page refreshes</strong> and browser sessions until explicitly cleared.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>You can also set keys via environment variables (<code className="bg-gray-100 px-1 rounded">VITE_GEMINI_API_KEY</code>, <code className="bg-gray-100 px-1 rounded">VITE_BRAVE_SEARCH_API_KEY</code>) at build time.</p>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p>Clearing browser data or using incognito mode will remove stored keys.</p>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables Reference</h2>
        <p className="text-sm text-gray-500 mb-3">
          For build-time configuration, create a <code className="bg-gray-100 px-1 rounded">.env</code> file:
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`# .env file (build-time only)
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_BRAVE_SEARCH_API_KEY=your_brave_key_here`}
        </pre>
        <p className="text-xs text-gray-400 mt-2">
          Note: Environment variables are embedded at build time. For runtime configuration, use the secure fields above.
        </p>
      </div>
    </div>
  );
}
