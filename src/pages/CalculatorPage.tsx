import { useState, useEffect } from 'react';
import { Calculator, Target, Users, FileText, Briefcase } from 'lucide-react';
import type { SalesFunnelInputs, SalesFunnelOutputs } from '../types';
import { saveFunnelInputs, loadFunnelInputs } from '../lib/storage';

const DEFAULT_INPUTS: SalesFunnelInputs = {
  monthlyTarget: 500000,
  avgProjectValue: 50000,
  leadToMeetingRate: 10,
  meetingToProposalRate: 50,
  proposalToCloseRate: 20,
};

function calculateFunnel(inputs: SalesFunnelInputs): SalesFunnelOutputs {
  const requiredClosedDeals = Math.ceil(inputs.monthlyTarget / inputs.avgProjectValue);
  const requiredProposals = Math.ceil(requiredClosedDeals / (inputs.proposalToCloseRate / 100));
  const requiredMeetings = Math.ceil(requiredProposals / (inputs.meetingToProposalRate / 100));
  const requiredLeads = Math.ceil(requiredMeetings / (inputs.leadToMeetingRate / 100));
  return { requiredClosedDeals, requiredProposals, requiredMeetings, requiredLeads };
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<SalesFunnelInputs>(DEFAULT_INPUTS);
  const [outputs, setOutputs] = useState<SalesFunnelOutputs>(calculateFunnel(DEFAULT_INPUTS));

  useEffect(() => {
    const saved = loadFunnelInputs();
    if (saved) {
      setInputs(saved);
      setOutputs(calculateFunnel(saved));
    }
  }, []);

  const updateInput = (key: keyof SalesFunnelInputs, value: number) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    setOutputs(calculateFunnel(newInputs));
    saveFunnelInputs(newInputs);
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-solar-600" />
          Sales Target Calculator
        </h1>
        <p className="text-gray-500 mt-1">
          Calculate how many leads, meetings, and proposals you need to hit your revenue target.
        </p>
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Sales Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue Target</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={inputs.monthlyTarget}
                onChange={(e) => updateInput('monthlyTarget', Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Average Project Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={inputs.avgProjectValue}
                onChange={(e) => updateInput('avgProjectValue', Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead → Meeting Rate (%)</label>
            <input
              type="number"
              min="1" max="100"
              value={inputs.leadToMeetingRate}
              onChange={(e) => updateInput('leadToMeetingRate', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting → Proposal Rate (%)</label>
            <input
              type="number"
              min="1" max="100"
              value={inputs.meetingToProposalRate}
              onChange={(e) => updateInput('meetingToProposalRate', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposal → Close Rate (%)</label>
            <input
              type="number"
              min="1" max="100"
              value={inputs.proposalToCloseRate}
              onChange={(e) => updateInput('proposalToCloseRate', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-solar-500 focus:border-solar-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Required Activity</h2>
        
        {/* Visual Funnel */}
        <div className="space-y-4">
          <FunnelStep
            icon={<Users className="w-5 h-5" />}
            label="Qualified Leads Needed"
            value={outputs.requiredLeads.toLocaleString()}
            color="bg-blue-500"
            width="100%"
          />
          <FunnelStep
            icon={<Briefcase className="w-5 h-5" />}
            label="Meetings Needed"
            value={outputs.requiredMeetings.toLocaleString()}
            color="bg-yellow-500"
            width={`${(outputs.requiredMeetings / outputs.requiredLeads) * 100}%`}
          />
          <FunnelStep
            icon={<FileText className="w-5 h-5" />}
            label="Proposals Needed"
            value={outputs.requiredProposals.toLocaleString()}
            color="bg-orange-500"
            width={`${(outputs.requiredProposals / outputs.requiredLeads) * 100}%`}
          />
          <FunnelStep
            icon={<Target className="w-5 h-5" />}
            label="Deals to Close"
            value={outputs.requiredClosedDeals.toLocaleString()}
            color="bg-solar-600"
            width={`${(outputs.requiredClosedDeals / outputs.requiredLeads) * 100}%`}
          />
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{outputs.requiredLeads.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Leads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{outputs.requiredMeetings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Meetings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{outputs.requiredProposals.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Proposals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-solar-600">{outputs.requiredClosedDeals}</p>
              <p className="text-xs text-gray-500">Closed Deals</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            To achieve {formatCurrency(inputs.monthlyTarget)}/month at {formatCurrency(inputs.avgProjectValue)} avg project value
          </p>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ icon, label, value, color, width }: { icon: React.ReactNode; label: string; value: string; color: string; width: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`${color} text-white p-2 rounded-lg flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-lg font-bold text-gray-900">{value}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width }} />
        </div>
      </div>
    </div>
  );
}
