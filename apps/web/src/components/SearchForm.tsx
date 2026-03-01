import { useState } from 'react';
import type { SearchParams, PostFilterOptions } from '@job-hunt/core';

interface SearchFormProps {
  onSearch: (params: SearchParams, filters?: PostFilterOptions) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [directApplyOnly, setDirectApplyOnly] = useState(false);
  const [employmentType, setEmploymentType] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [experience, setExperience] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params: SearchParams = {
      query: location ? `${query} in ${location}` : query,
    };
    if (remoteOnly) params.remote_jobs_only = true;
    if (employmentType) params.employment_types = employmentType;
    if (datePosted) params.date_posted = datePosted as SearchParams['date_posted'];
    if (experience) params.job_requirements = experience;

    const filters: PostFilterOptions = {};
    if (minSalary) filters.minSalary = parseInt(minSalary, 10);
    if (maxSalary) filters.maxSalary = parseInt(maxSalary, 10);
    if (directApplyOnly) filters.directApplyOnly = true;
    if (includeKeywords) filters.includeKeywords = includeKeywords.split(',').map((s) => s.trim());
    if (excludeKeywords) filters.excludeKeywords = excludeKeywords.split(',').map((s) => s.trim());

    onSearch(params, Object.keys(filters).length > 0 ? filters : undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Query */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title / Keywords
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "frontend engineer", "React developer"'
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder='e.g. "San Francisco, CA"'
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Quick filters row */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Remote only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={directApplyOnly}
            onChange={(e) => setDirectApplyOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Direct apply only</span>
        </label>

        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any type</option>
          <option value="FULLTIME">Full-time</option>
          <option value="PARTTIME">Part-time</option>
          <option value="CONTRACTOR">Contractor</option>
          <option value="INTERN">Intern</option>
        </select>

        <select
          value={datePosted}
          onChange={(e) => setDatePosted(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any time</option>
          <option value="today">Today</option>
          <option value="3days">Last 3 days</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>

        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any experience</option>
          <option value="no_experience">No experience</option>
          <option value="under_3_years_experience">Under 3 years</option>
          <option value="more_than_3_years_experience">3+ years</option>
          <option value="no_degree">No degree required</option>
        </select>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced filters
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g. 80000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
            <input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="e.g. 200000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Include keywords (comma-separated)
            </label>
            <input
              type="text"
              value={includeKeywords}
              onChange={(e) => setIncludeKeywords(e.target.value)}
              placeholder="React, TypeScript"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude keywords (comma-separated)
            </label>
            <input
              type="text"
              value={excludeKeywords}
              onChange={(e) => setExcludeKeywords(e.target.value)}
              placeholder="Senior, 10+ years"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="mt-4">
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </div>
    </form>
  );
}
