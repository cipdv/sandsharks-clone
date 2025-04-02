// "use client";

// import React, { useState } from "react";
// import { submitSurvey } from "@/app/_actions";

// const SurveyPage = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     permits: "",
//     volunteer: "",
//     comments: "",
//     feeDeterrent: "", // New state for the additional question
//   });

//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Form submitted:", formData);
//     try {
//       await submitSurvey(formData);
//       setIsSubmitted(true);
//     } catch (error) {
//       console.error("Error submitting survey:", error);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 max-w-lg mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Sandsharks 2025 Season Survey</h1>
//       {isSubmitted ? (
//         <h2 className="text-xl font-bold mb-4">
//           Thanks for submitting the survey :)
//         </h2>
//       ) : (
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="flex space-x-4">
//             <div className="flex-1">
//               <label className="block mb-1">First Name:</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 required
//                 className="w-full p-2 border border-gray-300 rounded"
//               />
//             </div>
//             <div className="flex-1">
//               <label className="block mb-1">Last Name:</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 required
//                 className="w-full p-2 border border-gray-300 rounded"
//               />
//             </div>
//           </div>
//           <div>
//             <label className="block mb-1">Email Address:</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             />
//           </div>
//           <div>
//             <label className="block mb-1">
//               Would a one-time $25 fee for the summer discourage you from
//               playing with Sandsharks?
//             </label>
//             <select
//               name="feeDeterrent"
//               value={formData.feeDeterrent}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Yes">Yes</option>
//               <option value="No">No</option>
//             </select>
//           </div>
//           <p className="my-4">
//             Here is a list of the dates that are available to get court permits:
//             <br />
//             <span className="block mt-2">May 17, 18, 24, 25, 31</span>
//             <span className="block mt-2">June 1, 14, 15, 28, 29</span>
//             <span className="block mt-2">July 12, 13</span>
//             <span className="block mt-2">August 23, 24, 30, 31</span>
//             <span className="block mt-2">September 1</span>
//           </p>
//           <div>
//             <label className="block mb-1">
//               Would you like me to get permits for Saturdays or Sundays, or
//               both?
//             </label>
//             <select
//               name="permits"
//               value={formData.permits}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Saturdays">Saturdays</option>
//               <option value="Sundays">Sundays</option>
//               <option value="Both">Both</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-1">
//               Would you be interested in learning how to volunteer to run
//               Sandsharks once or twice this season?
//             </label>
//             <select
//               name="volunteer"
//               value={formData.volunteer}
//               onChange={handleChange}
//               required
//               className="w-full p-2 border border-gray-300 rounded"
//             >
//               <option value="">Select an option</option>
//               <option value="Yes">Yes</option>
//               <option value="No">No</option>
//             </select>
//           </div>

//           <div>
//             <label className="block mb-1">
//               If you have any questions or comments, please enter them here:
//             </label>
//             <textarea
//               name="comments"
//               value={formData.comments}
//               onChange={handleChange}
//               className="w-full p-2 border border-gray-300 rounded"
//             />
//           </div>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Submit
//           </button>
//         </form>
//       )}
//     </div>
//   );
// };

// export default SurveyPage;
