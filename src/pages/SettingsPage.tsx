import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, XCircle, ExternalLink, Eye, EyeOff, Save, Trash2, Shield, Lock, Unlock, KeyRound, AlertTriangle } from 'lucide-react';
import { getConfigStatus, getMaskedKey, isSearchConfigured, isAIConfigured } from '../lib/api';
import { saveEncryptedKeys, loadEncryptedKeys, hasEncryptedKeys, clearEncryptedKeys } from '../lib/crypto';
import { unlockKeys, lockKeys, isUnlocked } from '../lib/keyManager';
import { validatePassword } from '../lib/security';

export default function SettingsPage() {
  const [isSetup, setIsSetup] = useState(hasEncryptedKeys());
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [status, setStatus] = useState(getConfigStatus());

  // Password for unlock/setup
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // New keys (only visible when setting up or updating)
  const [geminiKey, setGeminiKey] = useState('');
  const [braveKey, setBraveKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showBrave, setShowBrave] = useState(false);

  // New password for setup/update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setIsSetup(hasEncryptedKeys());
    setUnlocked(isUnlocked());
    setStatus(getConfigStatus());
  }, []);

  // Handle unlock with password
  const handleUnlock = async () => {
    if (!password) {
      setUnlockError('Please enter your password.');
      return;
    }
    setUnlockError('');
    const success = await unlockKeys(password);
    if (success) {
      setUnlocked(true);
      setStatus(getConfigStatus());
      setPassword('');
    } else {
      setUnlockError('Incorrect password. Please try again.');
    }
  };

  // Handle lock
  const handleLock = () => {
    lockKeys();
    setUnlocked(false);
    setStatus(getConfigStatus());
  };

  // Handle save/update keys
  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);

    // Determine which password to use
    const pwd = isSetup ? (newPassword || password) : newPassword;
    
    if (!pwd) {
      setSaveError(isSetup ? 'Enter your password to save changes.' : 'Create a password to protect your keys.');
      return;
    }

    if (!isSetup && pwd !== confirmPassword) {
      setSaveError('Passwords do not match.');
      return;
    }

    // SECURITY FIX: Use stronger password validation
    const passwordValidation = validatePassword(pwd);
    if (!passwordValidation.valid) {
      setSaveError(passwordValidation.message);
      return;
    }

    if (!geminiKey.trim() && !braveKey.trim()) {
      setSaveError('Enter at least one API key.');
      return;
    }

    try {
      await saveEncryptedKeys(
        {
          gemini: geminiKey.trim() || undefined,
          brave: braveKey.trim() || undefined,
        },
        pwd
      );
      
      // Unlock with the password
      await unlockKeys(pwd);
      
      setUnlocked(true);
      setIsSetup(true);
      setStatus(getConfigStatus());
      setSaveSuccess(true);
      setGeminiKey('');
      setBraveKey('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError('Failed to save keys. Please try again.');
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all stored API keys? This cannot be undone.')) {
      clearEncryptedKeys();
      lockKeys();
      setIsSetup(false);
      setUnlocked(false);
      setStatus(getConfigStatus());
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-solar-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Securely manage your API keys. Keys are encrypted with your password and never stored in plain text.
        </p>
      </div>

      {/* Not set up yet */}
      {!isSetup && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-solar-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-solar-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Up Your API Keys</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Enter your API keys below and protect them with a password. Your keys will be encrypted and stored securely.
            </p>
          </div>

          {/* Setup Form */}
          <div className="space-y-5 border-t border-gray-200 pt-6">
            <ApiKeyInput
              label="Gemini AI API Key"
              value={geminiKey}
              onChange={setGeminiKey}
              showValue={showGemini}
              onToggleShow={() => setShowGemini(!showGemini)}
              placeholder="Paste your Gemini API key..."
              helpUrl="https://aistudio.google.com/apikey"
            />
            <ApiKeyInput
              label="Brave Search API Key"
              value={braveKey}
              onChange={setBraveKey}
              showValue={showBrave}
              onToggleShow={() => setShowBrave(!showBrave)}
              placeholder="Paste your Brave Search API key..."
              helpUrl="https://brave.com/search/api/"
            />

            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Create a Password
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                This password encrypts your keys. You'll need it each time you open the app. Choose something memorable — there's no recovery if forgotten.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none text-sm"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none text-sm"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full py-3 bg-solar-600 text-white font-semibold rounded-xl hover:bg-solar-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save & Encrypt Keys
            </button>
          </div>
        </div>
      )}

      {/* Set up but locked */}
      {isSetup && !unlocked && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Password to Unlock</h2>
            <p className="text-gray-500 mb-6">
              Your API keys are encrypted. Enter your password to unlock them for this session.
            </p>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setUnlockError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {unlockError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {unlockError}
              </div>
            )}

            <button
              onClick={handleUnlock}
              className="w-full py-3 bg-solar-600 text-white font-semibold rounded-xl hover:bg-solar-700 transition-colors flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Unlock
            </button>

            <button
              onClick={handleClearAll}
              className="w-full py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Forgot password? Clear all data and start over
            </button>
          </div>
        </div>
      )}

      {/* Unlocked - show status and update form */}
      {isSetup && unlocked && (
        <>
          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-green-500" />
                Keys Unlocked
              </h2>
              <button
                onClick={handleLock}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock
              </button>
            </div>

            <div className="space-y-3">
              <StatusRow
                label="Gemini AI"
                configured={status.gemini}
                maskedKey={status.gemini ? getMaskedKey('gemini') : ''}
              />
              <StatusRow
                label="Brave Search"
                configured={status.braveSearch}
                maskedKey={status.braveSearch ? getMaskedKey('brave') : ''}
              />
            </div>

            {saveSuccess && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Keys saved and encrypted successfully.
              </div>
            )}
          </div>

          {/* Update Keys */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update API Keys</h2>
            <p className="text-sm text-gray-500 mb-4">
              Leave a field empty to keep the existing key. Enter a new key to replace it.
            </p>

            <div className="space-y-4">
              <ApiKeyInput
                label="Gemini AI API Key"
                value={geminiKey}
                onChange={setGeminiKey}
                showValue={showGemini}
                onToggleShow={() => setShowGemini(!showGemini)}
                placeholder={status.gemini ? 'Leave empty to keep current key...' : 'Paste your Gemini API key...'}
                helpUrl="https://aistudio.google.com/apikey"
              />
              <ApiKeyInput
                label="Brave Search API Key"
                value={braveKey}
                onChange={setBraveKey}
                showValue={showBrave}
                onToggleShow={() => setShowBrave(!showBrave)}
                placeholder={status.braveSearch ? 'Leave empty to keep current key...' : 'Paste your Brave Search API key...'}
                helpUrl="https://brave.com/search/api/"
              />

              <div className="border-t border-gray-200 pt-4">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your password to save changes"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-solar-600 text-white font-medium rounded-xl hover:bg-solar-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2.5 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Security Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-solar-600" />
          How Your Keys Are Protected
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Keys are encrypted with <strong>AES-256-GCM</strong> using a key derived from your password via <strong>PBKDF2</strong> (100,000 iterations).</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Only the <strong>encrypted data</strong> is stored in your browser — your password is never saved.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Keys are decrypted in memory only for the current session and <strong>cleared on page refresh</strong>.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Without your password, the encrypted data is <strong>completely unreadable</strong> — even to someone with access to your device.</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p><strong>Important:</strong> If you forget your password, you'll need to clear all data and re-enter your keys. There is no recovery mechanism by design.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable API key input component
function ApiKeyInput({ label, value, onChange, showValue, onToggleShow, placeholder, helpUrl }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showValue: boolean;
  onToggleShow: () => void;
  placeholder: string;
  helpUrl: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none font-mono text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          title={showValue ? 'Hide' : 'Show'}
        >
          {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <a
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5"
      >
        Where do I get this key? <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

// Status row component
function StatusRow({ label, configured, maskedKey }: { label: string; configured: boolean; maskedKey: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-2">
        {configured ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {configured && maskedKey && (
          <code className="text-xs text-gray-500 font-mono">{maskedKey}</code>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {configured ? 'Active' : 'Missing'}
        </span>
      </div>
    </div>
  );
}
