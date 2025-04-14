import React from 'react';

const ApiTokens = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">API Tokens</h2>
      <p className="mb-4">Manage your API tokens here.</p>

      <div className="space-y-4">
        {/* Existing Tokens */}
        <div>
          <h3 className="font-semibold">Existing Tokens</h3>
          {/* Placeholder for existing tokens list */}
          <ul className="mt-2 space-y-2">
            <li className="border p-3 rounded-md flex justify-between items-center">
              <span>Token 1: exampletoken123</span>
              <div className="space-x-2">
                <button className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white">Modify</button>
                <button className="px-3 py-1 text-sm rounded-md bg-red-500 text-white">Revoke</button>
              </div>
            </li>
            {/* Add more tokens here */}
          </ul>
        </div>

        {/* Generate New Token */}
        <div>
          <h3 className="font-semibold">Generate New Token</h3>
          <button className="mt-2 px-4 py-2 rounded-md bg-green-500 text-white">Generate Token</button>
        </div>
      </div>
    </div>
  );
};

export default ApiTokens;