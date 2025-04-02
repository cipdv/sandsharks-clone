"use client";

import { useState, useRef, useEffect } from "react";

export default function MemberSearch({ members, onSelect, role }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = members.filter((member) =>
        `${member.first_name} ${member.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered.slice(0, 5)); // Limit to 5 results
      setIsOpen(true);
    } else {
      setFilteredMembers([]);
      setIsOpen(false);
    }
  }, [searchTerm, members]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (member) => {
    onSelect(member, role);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search members..."
        className="w-full p-2 border border-gray-300 rounded"
        aria-label={`Search for ${role}`}
      />

      {isOpen && filteredMembers.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-md max-h-60 overflow-y-auto">
          {filteredMembers.map((member) => (
            <li
              key={member.id}
              onClick={() => handleSelect(member)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {member.first_name} {member.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
