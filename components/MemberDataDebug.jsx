"use client";

import { useState } from "react";

const MemberDataDebug = ({ member }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm"
      >
        {showDebug ? "Hide" : "Debug Member Data"}
      </button>

      {showDebug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Member Data Structure</h2>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(member, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDataDebug;
