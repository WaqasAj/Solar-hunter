import { Settings as SettingsIcon, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { getConfigStatus } from '../lib/api';

export default function SettingsPage() {
  const status = getConfigStatus();

  const apis = [
    {
      name: 'Gemini AI',
      envVar: 'VITE_GEMINI_API_KEY',
      description: 'Used for company analysis, scoring, and generating sales intelligence.',
      configured: status.gemini,
      setupUrl: 'https://aistudio.google.com/apikey',
    },
    {
      name: 'Brave Search',
      envVar: 'VITE_BRAVE_SEARCH_API_KEY',
      description: 'Used for finding real businesses via web search.',
      configured: status.braveSearch,
      setupUrl: 'https://brave.com/search/api/',
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
          Configure API keys and check the status of external services.
        </p>
      </div>

      {/* API Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Configuration Status</h2>
        
        <div className="space-y-4">
          {apis.map(api => (
            <div key={api.envVar} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex-shrink-0 mt-0.5">
                {api.configured ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{api.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    api.configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {api.configured ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{api.description}</p>
                <div className="mt-2">
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">{api.envVar}</code>
                </div>
                {!api.configured && (
                  <div className="mt-2">
                    <a
                      href={api.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Get API key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Configure API Keys</h2>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Option 1: Environment Variables</h3>
            <p>Set environment variables before building the application:</p>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_BRAVE_SEARCH_API_KEY=your_brave_key_here`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Option 2: .env File</h3>
            <p>Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the project root:</p>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
{`# .env file
VITE_GEMINI_API_KEY=AIza...
VITE_BRAVE_SEARCH_API_KEY=BSA...`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Option 3: Google AI Studio Secrets</h3>
            <p>If deploying via Google AI Studio, add the keys in the Secrets panel:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Go to your app's Secrets section</li>
              <li>Add <code className="bg-gray-100 px-1 rounded">VITE_GEMINI_API_KEY</code></li>
              <li>Add <code className="bg-gray-100 px-1 rounded">VITE_BRAVE_SEARCH_API_KEY</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 text-sm mb-1">⚠️ Security Note</h3>
        <p className="text-sm text-amber-700">
          API keys are embedded at build time via Vite environment variables. For production use, 
          consider proxying API calls through a server-side function to keep keys out of client-side code. 
          Never commit API keys to version control.
        </p>
      </div>
    </div>
  );
}
