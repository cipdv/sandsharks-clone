"use client";

import { useState } from "react";
import Image from "next/image";

const SponsorsList = ({ sponsors = [], isAdmin = false }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!sponsors || sponsors.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">
          {isAdmin
            ? "No sponsors found. Create your first sponsor!"
            : "No sponsors available at this time."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sponsors.map((sponsor) => (
        <div
          key={sponsor.id}
          className="border rounded-md overflow-hidden bg-white shadow-sm"
        >
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleExpand(sponsor.id)}
          >
            <div className="flex items-center space-x-4">
              {sponsor.logo_url ? (
                <div className="w-12 h-12 relative flex-shrink-0">
                  <Image
                    src={sponsor.logo_url || "/placeholder.svg"}
                    alt={sponsor.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs">No Logo</span>
                </div>
              )}
              <h3 className="font-medium">{sponsor.name}</h3>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${
                expandedId === sponsor.id ? "transform rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandedId === sponsor.id && (
            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsor.description && (
                  <div className="col-span-full">
                    <h4 className="text-sm font-medium text-gray-500">
                      Description
                    </h4>
                    <p className="mt-1">{sponsor.description}</p>
                  </div>
                )}

                {sponsor.member_name && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Associated Member
                    </h4>
                    <p className="mt-1">{sponsor.member_name}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {sponsor.website_url && (
                      <a
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Website
                      </a>
                    )}
                    {sponsor.instagram_url && (
                      <a
                        href={sponsor.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-pink-100 text-pink-800 hover:bg-pink-200"
                      >
                        Instagram
                      </a>
                    )}
                    {sponsor.other_url && (
                      <a
                        href={sponsor.other_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        Other Link
                      </a>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="col-span-full mt-2 flex justify-end">
                    <button
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm hover:bg-yellow-200 mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality would go here
                        alert("Edit functionality to be implemented");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete functionality would go here
                        if (
                          confirm(
                            "Are you sure you want to delete this sponsor?"
                          )
                        ) {
                          alert("Delete functionality to be implemented");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SponsorsList;
